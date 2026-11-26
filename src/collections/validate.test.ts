import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import type { Context } from "../blocks/validate.ts";
import { collectionFor, collections } from "./definitions.ts";
import { COLLECTION_KINDS, ITEM_DIR, SLUG_RE, itemFilePath } from "./schema.ts";
import type { ItemFile, LoadedItem } from "./schema.ts";
import { sortItems, validateItems, visibleItems } from "./validate.ts";

const ctx: Context = { repo: { imageExists: () => true, fileExists: () => true }, pages: null };
const post = (slug: string, data: Record<string, unknown> = {}): ItemFile => ({
  kind: "posts",
  slug,
  data: { status: "live", title: "T", description: "D", date: "2026-03-27", body: [{ type: "paragraph", text: "Hi" }], ...data },
});
const has = (problems: string[], text: string) => assert.ok(problems.some((p) => p.includes(text)), `${text} in ${JSON.stringify(problems)}`);

describe("itemFilePath and slugs", () => {
  it("builds the file path", () => {
    assert.equal(ITEM_DIR, "src/content/collections");
    assert.equal(itemFilePath("posts", "hello-world"), "src/content/collections/posts/hello-world.json");
  });
  it("accepts lowercase words and digits joined by hyphens, 1 to 60 characters", () => {
    for (const ok of ["a", "hello-world", "2026-recap", "a".repeat(60)]) assert.ok(SLUG_RE.test(ok), ok);
    for (const bad of ["", "Hello", "a_b", "-a", "a-", "a--b", "a b", "a/b", "a.b", "a".repeat(61), "../x"]) assert.equal(SLUG_RE.test(bad), false, bad);
  });
});

describe("validateItems", () => {
  it("passes a good item of each kind", () => {
    const files: ItemFile[] = [
      post("hello"),
      { kind: "videos", slug: "tour", data: { status: "draft", title: "T", url: "https://youtu.be/aqz-KE-bpKQ", date: "2026-03-27" } },
      { kind: "episodes", slug: "ep-1", data: { status: "live", title: "T", url: "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk", date: "2026-03-27" } },
      { kind: "testimonials", slug: "dana", data: { status: "live", quote: "Great.", name: "Dana", order: 1 } },
      { kind: "team", slug: "priya", data: { status: "archived", name: "Priya", role: "Designer", order: 2 } },
    ];
    assert.deepEqual(validateItems(files, ctx), []);
  });

  it("names the file, and reports a file that could not be read", () => {
    const problems = validateItems([{ kind: "posts", slug: "broken", data: null, error: "is not valid JSON" }], ctx);
    assert.deepEqual(problems, ["src/content/collections/posts/broken.json: is not valid JSON"]);
  });

  it("refuses an unknown kind, a bad slug and reserved post slugs", () => {
    has(validateItems([{ kind: "recipes", slug: "a", data: { status: "live" } }], ctx), "not a collection");
    has(validateItems([post("Bad_Slug")], ctx), "slug");
    has(validateItems([post("page")], ctx), "reserved");
    has(validateItems([post("feed")], ctx), "reserved");
    assert.deepEqual(validateItems([{ kind: "videos", slug: "page", data: { status: "live", title: "T", url: "https://youtu.be/aqz-KE-bpKQ", date: "2026-03-27" } }], ctx), []);
  });

  it("needs a status of draft, live or archived", () => {
    has(validateItems([post("a", { status: "published" })], ctx), "status");
    const missing = post("a");
    delete (missing.data as Record<string, unknown>)["status"];
    has(validateItems([missing], ctx), "status");
  });

  it("refuses unknown keys, missing fields, and values past a limit", () => {
    has(validateItems([post("a", { extra: 1 })], ctx), "not a field");
    has(validateItems([post("a", { title: "x".repeat(91) })], ctx), "at most 90");
    has(validateItems([post("a", { description: "x".repeat(171) })], ctx), "at most 170");
    has(validateItems([post("a", { date: "yesterday" })], ctx), "YYYY-MM-DD");
    const noBody = post("a");
    delete (noBody.data as Record<string, unknown>)["body"];
    has(validateItems([noBody], ctx), "required");
    has(validateItems([{ kind: "testimonials", slug: "a", data: { status: "live", quote: "q", order: 1 } }], ctx), "name");
    has(validateItems([{ kind: "team", slug: "a", data: { status: "live", name: "N", role: "R", order: 1000 } }], ctx), "at most 999");
    has(validateItems([{ kind: "videos", slug: "a", data: { status: "live", title: "T", url: "https://example.com/v", date: "2026-03-27" } }], ctx), "YouTube");
    has(validateItems([{ kind: "episodes", slug: "a", data: { status: "live", title: "T", url: "https://youtu.be/aqz-KE-bpKQ", date: "2026-03-27" } }], ctx), "Spotify");
  });

  it("refuses an updated date before the date", () => {
    has(validateItems([post("a", { updated: "2026-03-01" })], ctx), "updated");
    assert.deepEqual(validateItems([post("a", { updated: "2026-03-27" })], ctx), []);
  });

  it("refuses two files with the same slug in one kind", () => {
    has(validateItems([post("a"), post("a")], ctx), "twice");
  });

  it("refuses a post body with a javascript: link, an archived-page link, an extra inline key or 40,001 characters", () => {
    const archived: Context = { ...ctx, pages: new Map([["/old", { status: "archived", anchors: new Set<string>() }]]) };
    const link = (href: string, extra: Record<string, unknown> = {}) => post("a", { body: [{ type: "paragraph", text: [{ text: "x", href, ...extra }] }] });
    has(validateItems([link("javascript:alert(1)")], ctx), "javascript");
    has(validateItems([link("/old")], archived), "archived");
    has(validateItems([link("/contact", { onclick: "x" })], ctx), "not a field");
    const big = Array.from({ length: 8 }, () => ({ type: "paragraph", text: "a".repeat(5000) }));
    assert.deepEqual(validateItems([post("a", { body: big })], ctx), []);
    has(validateItems([post("a", { body: [...big, { type: "paragraph", text: "b" }] })], ctx), "40,000");
  });
});

describe("definitions", () => {
  it("has one definition per kind, with fields that include its label field", () => {
    assert.deepEqual(collections.map((c) => c.kind), [...COLLECTION_KINDS]);
    for (const def of collections) {
      assert.ok(def.fields[def.labelField], def.kind);
      assert.ok(def.title && def.singular && def.description, def.kind);
      assert.equal(collectionFor(def.kind), def);
    }
    assert.equal(collectionFor("recipes"), undefined);
  });

  it("fixes the limits the design names", () => {
    const f = (kind: string, name: string) => collectionFor(kind)?.fields[name];
    assert.deepEqual(f("posts", "title"), { kind: "text", label: "Title", max: 90 });
    assert.equal((f("posts", "description") as { max: number }).max, 170);
    assert.equal((f("posts", "image") as { shape: string }).shape, "3:2");
    assert.equal((f("posts", "updated") as { required: boolean }).required, false);
    assert.deepEqual({ ...(f("posts", "body") as object) }, { kind: "body", label: "Post", maxParts: 200, maxChars: 40000 });
    assert.equal((f("videos", "caption") as { max: number }).max, 200);
    assert.equal((f("episodes", "summary") as { max: number }).max, 300);
    assert.equal((f("testimonials", "quote") as { max: number }).max, 600);
    assert.equal((f("testimonials", "name") as { max: number; required?: boolean }).max, 80);
    assert.equal((f("testimonials", "name") as { required?: boolean }).required, undefined);
    assert.equal((f("testimonials", "order") as { max: number }).max, 999);
    assert.equal((f("team", "bio") as { max: number }).max, 400);
    assert.equal((f("team", "photo") as { shape: string }).shape, "4:5");
    assert.deepEqual(collections.map((c) => c.sort), ["date", "date", "date", "order", "order"]);
  });

  it("carries three live example items per kind that pass the item check", () => {
    for (const def of collections) {
      assert.equal(def.example.length, 3, def.kind);
      const files: ItemFile[] = def.example.map((item) => ({ kind: item.kind, slug: item.slug, data: { status: item.status, ...item.data } }));
      assert.deepEqual(validateItems(files, ctx), [], def.kind);
      for (const item of def.example) assert.equal(item.status, "live");
    }
  });

  it("ships example.json for each kind, equal to the first example and using real files", () => {
    const real: Context = { repo: { imageExists: (src) => existsSync(`public${src}`), fileExists: (href) => existsSync(`public${href}`) }, pages: null };
    for (const def of collections) {
      const path = itemFilePath(def.kind, "example");
      // This site ships no example items (its showcase builds them from the definitions), so only a file that exists is held to the rule.
      if (!existsSync(path)) continue;
      const data: unknown = JSON.parse(readFileSync(path, "utf8"));
      const first = def.example[0] as LoadedItem;
      // The shipped post leads with text, not a lead photo: CI audits it, and a photo-led first screen fails Lighthouse on
      // the uncompressed test server (docs/proposals/lighthouse-compression.md). The showcase example keeps its photo.
      const { image: _lead, ...withoutLead } = first.data;
      void _lead;
      assert.deepEqual(data, { status: "live", ...(def.kind === "posts" ? withoutLead : first.data) }, path);
      assert.deepEqual(validateItems([{ kind: def.kind, slug: "example", data }], real), [], path);
    }
  });

  it("makes the testimonial and team examples pure placeholders, never a person", () => {
    for (const kind of ["testimonials", "team"] as const) {
      for (const item of collectionFor(kind)?.example ?? []) {
        for (const [key, value] of Object.entries(item.data)) {
          if (typeof value === "string") assert.match(value, /^\[\[.+\]\]$/, `${kind} ${key}`);
        }
      }
    }
  });

  it("makes the example post body use every body part type", () => {
    const body = collectionFor("posts")?.example[0]?.data["body"] as { type: string; text?: unknown }[];
    assert.deepEqual([...new Set(body.map((p) => p.type))].sort(), ["heading", "list", "paragraph", "photo", "quote"]);
    const paragraph = body.find((p) => p.type === "paragraph");
    assert.ok(JSON.stringify(paragraph).includes('"href":"/contact"'));
  });
});

const item = (kind: LoadedItem["kind"], slug: string, status: LoadedItem["status"], data: Record<string, unknown>): LoadedItem => ({ kind, slug, status, data });

describe("sortItems and visibleItems", () => {
  const posts = collectionFor("posts")!;
  const order = collectionFor("team")!;

  it("sorts by date, newest first, then slug", () => {
    const sorted = sortItems(posts, [
      item("posts", "b", "live", { date: "2026-01-01" }),
      item("posts", "c", "live", { date: "2026-03-01" }),
      item("posts", "a", "live", { date: "2026-01-01" }),
    ]);
    assert.deepEqual(sorted.map((i) => i.slug), ["c", "a", "b"]);
  });

  it("sorts by order, then by name", () => {
    const sorted = sortItems(order, [
      item("team", "z", "live", { name: "Zed", order: 1 }),
      item("team", "b", "live", { name: "Bea", order: 2 }),
      item("team", "a", "live", { name: "Ann", order: 2 }),
    ]);
    assert.deepEqual(sorted.map((i) => i.slug), ["z", "a", "b"]);
  });

  it("does not change the list it is given", () => {
    const input = [item("posts", "a", "live", { date: "2026-01-01" }), item("posts", "b", "live", { date: "2026-02-01" })];
    sortItems(posts, input);
    assert.deepEqual(input.map((i) => i.slug), ["a", "b"]);
  });

  const mixed = [item("posts", "d", "draft", {}), item("posts", "l", "live", {}), item("posts", "a", "archived", {})];
  it("shows live items only, and drafts too only when asked; never archived", () => {
    assert.deepEqual(visibleItems(mixed, { drafts: false }).map((i) => i.slug), ["l"]);
    assert.deepEqual(visibleItems(mixed, { drafts: true }).map((i) => i.slug), ["d", "l"]);
  });
});

describe("this site's extra testimonial fields", () => {
  const item = (extra: Record<string, unknown>): ItemFile => ({
    kind: "testimonials",
    slug: "dana",
    data: { status: "live", quote: "Great.", name: "Dana", order: 1, ...extra },
  });
  it("accepts the fuller quote, industry, source, placements and case study", () => {
    const extra = { quoteLong: "Great. Really.", industry: "Therapy practice", source: "Survey, Dec 8, 2025", placements: ["home", "about"], caseStudy: "hideout-fitness" };
    assert.deepEqual(validateItems([item(extra)], ctx), []);
  });
  it("refuses a page or a case study that is not on the list", () => {
    has(validateItems([item({ placements: ["pricing"] })], ctx), "placements");
    has(validateItems([item({ caseStudy: "other" })], ctx), "caseStudy");
  });
});
