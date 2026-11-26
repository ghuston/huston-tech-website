import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Fields } from "./schema.ts";
import { validateFields, validatePages, validateRegistry } from "./validate.ts";
import type { Context } from "./validate.ts";
import type { AnyBlockDefinition } from "./schema.ts";

const repo = { imageExists: () => true, fileExists: () => true };
const ctx: Context = { repo, pages: null };
const archivedCtx: Context = {
  repo,
  pages: new Map([
    ["/old", { status: "archived", anchors: new Set<string>() }],
    ["/contact", { status: "live", anchors: new Set<string>() }],
  ]),
};
const SPOTIFY = "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk";

const run = (fields: Fields, value: unknown, c: Context = ctx) => validateFields(fields, value, "item.json", c);
const has = (problems: string[], text: string) => assert.ok(problems.some((p) => p.includes(text)), `${text} in ${JSON.stringify(problems)}`);

describe("date field", () => {
  const fields: Fields = { when: { kind: "date", label: "Date" } };
  it("takes a real YYYY-MM-DD date", () => {
    assert.deepEqual(run(fields, { when: "2026-02-28" }), []);
    assert.deepEqual(run(fields, { when: "2028-02-29" }), []);
  });
  it("refuses other shapes and dates that do not exist", () => {
    for (const bad of ["2026-2-3", "2026-02-30", "2026-13-01", "Feb 3 2026", "2026-02-03T10:00:00Z", 20260203, null]) {
      has(run(fields, { when: bad }), "when");
    }
    has(run(fields, { when: "2027-02-29" }), "not a real date");
  });
});

describe("number field", () => {
  const fields: Fields = { order: { kind: "number", label: "Order", min: 0, max: 999 } };
  it("takes whole numbers from min to max", () => {
    for (const ok of [0, 5, 999]) assert.deepEqual(run(fields, { order: ok }), []);
  });
  it("refuses fractions, out-of-range values, text and NaN", () => {
    for (const bad of [-1, 1000, 1.5, "5", Number.NaN, Infinity]) has(run(fields, { order: bad }), "order");
    has(run(fields, { order: 1000 }), "at most 999");
    has(run(fields, { order: -1 }), "at least 0");
    has(run(fields, { order: 1.5 }), "whole number");
  });
});

describe("audio field", () => {
  const fields: Fields = { url: { kind: "audio", label: "Episode" } };
  it("takes an allowed episode address", () => {
    assert.deepEqual(run(fields, { url: SPOTIFY }), []);
  });
  it("refuses a show, another site and non-text, naming the allowed sites", () => {
    has(run(fields, { url: "https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk" }), "Spotify");
    has(run(fields, { url: "https://example.com/a.mp3" }), "Apple Podcasts");
    has(run(fields, { url: 5 }), "must be");
  });
});

describe("body field", () => {
  const fields: Fields = { body: { kind: "body", label: "Body", maxParts: 200, maxChars: 40000 } };
  const para = (text: unknown) => ({ type: "paragraph", text });
  const body = (parts: unknown, c: Context = ctx) => run(fields, { body: parts }, c);

  it("takes every part type", () => {
    assert.deepEqual(
      body([
        { type: "heading", level: 2, text: "A heading" },
        { type: "heading", level: 3, text: "A smaller heading" },
        para("Plain **bold** text and [[a placeholder]]."),
        para(["See ", { text: "the contact page", href: "/contact" }, " or ", { text: "our site", href: "https://example.com/a" }, "."]),
        { type: "list", style: "bullet", items: ["One", ["Two with ", { text: "a link", href: "/contact" }]] },
        { type: "list", style: "number", items: ["First"] },
        { type: "quote", text: "A quote", source: "Someone" },
        { type: "quote", text: "A quote without a source" },
        { type: "photo", image: { src: "/images/examples/window-light.jpg", alt: "Light through a window" }, caption: "A caption" },
        { type: "photo", image: { src: "/images/examples/window-light.jpg", alt: "Light through a window", focus: "top" } },
      ]),
      [],
    );
  });

  it("refuses a body that is not a list, is empty, or has too many parts", () => {
    has(body("text"), "must be a list");
    has(body([]), "at least one part");
    has(body(Array.from({ length: 201 }, () => para("x"))), "at most 200");
  });

  it("refuses more than 40,000 characters in all", () => {
    const parts = Array.from({ length: 8 }, () => para("a".repeat(5000)));
    assert.deepEqual(body(parts), []);
    has(body([...parts, para("b")]), "40,000");
  });

  it("refuses a javascript: link, a data: link and an http: link", () => {
    has(body([para([{ text: "x", href: "javascript:alert(1)" }])]), "javascript");
    has(body([para([{ text: "x", href: "data:text/html,hi" }])]), "data");
    has(body([para([{ text: "x", href: "http://example.com" }])]), "http");
  });

  it("refuses a link to an archived page", () => {
    has(body([para([{ text: "x", href: "/old" }])], archivedCtx), "archived");
    assert.deepEqual(body([para([{ text: "x", href: "/contact" }])], archivedCtx), []);
  });

  it("refuses an inline link object with an extra key, a missing key or an empty text", () => {
    has(body([para([{ text: "x", href: "/contact", target: "_blank" }])]), "not a field");
    has(body([para([{ text: "x" }])]), "href");
    has(body([para([{ text: "", href: "/contact" }])]), "empty");
  });

  it("refuses an unknown part type, an unknown key and a bad level or style", () => {
    has(body([{ type: "html", text: "<b>x</b>" }]), "not a body part");
    has(body([{ type: "heading", level: 4, text: "x" }]), "level");
    has(body([{ type: "heading", level: 2, text: "x", id: "a" }]), "not a field");
    has(body([{ type: "list", style: "roman", items: ["x"] }]), "style");
    has(body(["just text"]), "must be an object");
  });

  it("refuses a list with no items or more than 30", () => {
    has(body([{ type: "list", style: "bullet", items: [] }]), "at least 1");
    has(body([{ type: "list", style: "bullet", items: Array.from({ length: 31 }, () => "x") }]), "at most 30");
  });

  it("refuses HTML, markdown links and line breaks in text", () => {
    has(body([para("<script>alert(1)</script>")]), "HTML tag");
    has(body([para("[x](https://example.com)")]), "markdown link");
    has(body([para("two\nlines")]), "control character");
    has(body([{ type: "heading", level: 2, text: "<b>x</b>" }]), "HTML tag");
  });

  it("judges a photo like any image: real alt text and a file under /images/", () => {
    has(body([{ type: "photo", image: { src: "/images/a.jpg", alt: "photo" } }]), "says nothing");
    has(body([{ type: "photo", image: { src: "/x/a.svg", alt: "A real description" } }]), "not an image");
    has(body([{ type: "photo", image: { src: "/images/a.jpg" } }]), "alt");
  });
});

const hero = (onlyOn?: string): AnyBlockDefinition => ({
  type: "latest",
  title: "Latest",
  description: "A list.",
  source: "library",
  fields: { heading: { kind: "text", label: "Heading", max: 40 } },
  variants: [{ name: "a", description: "a" }],
  placement: { position: "any", maxPerPage: 1, rhythm: "section", ...(onlyOn === undefined ? {} : { onlyOn }) },
  motion: { entrance: "default" },
  example: { heading: "x" },
});
const first: AnyBlockDefinition = { ...hero(), type: "first", placement: { position: "first", maxPerPage: 1, rhythm: "hero" } };
const page = (path: string, file: string, type: string) => ({
  file,
  data: { path, title: "t", description: "d", status: "live", blocks: type === "first" ? [{ type, content: { heading: "x" } }] : [{ type: "first", content: { heading: "x" } }, { type, content: { heading: "x" } }] },
});

describe("placement.onlyOn", () => {
  it("allows the block on its page and refuses it elsewhere", () => {
    const registry = [first, hero("/blog")];
    const files = [page("/", "home.json", "first"), page("/contact", "contact.json", "first"), page("/blog", "blog.json", "latest")];
    assert.deepEqual(validatePages(files, registry, repo), []);
    const bad = validatePages([page("/", "home.json", "latest"), page("/contact", "contact.json", "first")], registry, repo);
    assert.ok(bad.some((p) => p.includes("home.json, block 2 (latest)") && p.includes("/blog")), JSON.stringify(bad));
  });

  it("the registry check refuses an onlyOn that is not a path, and a collection that is not a kind", () => {
    assert.deepEqual(validateRegistry([first, hero("/blog")]), []);
    assert.ok(validateRegistry([first, hero("blog")]).some((p) => p.includes("onlyOn")));
    const bad = { ...hero(), collection: "recipes" } as unknown as AnyBlockDefinition;
    assert.ok(validateRegistry([first, bad]).some((p) => p.includes("collection")));
    assert.deepEqual(validateRegistry([first, { ...hero(), collection: "posts" }]), []);
  });
});
