import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { describe, test } from "node:test";
import { REGISTRY_PATH, registryIds, registrySource } from "./registry.ts";
import { formFiles } from "./registry.generated.ts";

describe("registrySource", () => {
  test("sorts the ids and imports each file once", () => {
    const text = registrySource(["quote", "contact", "newsletter-2"]);
    assert.ok(text.indexOf("contact.json") < text.indexOf("newsletter-2.json"));
    assert.ok(text.indexOf("newsletter-2.json") < text.indexOf("quote.json"));
    assert.equal((text.match(/with \{ type: "json" \}/g) ?? []).length, 3);
    assert.match(text, /import f_newsletter_2 from "\.\.\/content\/forms\/newsletter-2\.json" with \{ type: "json" \};/);
    assert.match(text, /\{ id: "newsletter-2", data: f_newsletter_2 \},/);
    assert.match(text, /export const formFiles: readonly \{ id: string; data: unknown \}\[\] = \[/);
  });
  test("is stable: the same ids in any order, with repeats, give the same text", () => {
    assert.equal(registrySource(["b", "a", "c"]), registrySource(["c", "a", "b", "a"]));
    assert.equal(registrySource(["b", "a"]), registrySource(["b", "a"]));
  });
  test("an empty list is a valid, empty registry", () => {
    assert.match(registrySource([]), /= \[\n\];/);
  });
  test("the path", () => assert.equal(REGISTRY_PATH, "src/forms/registry.generated.ts"));
});

describe("registryIds", () => {
  test("is the inverse of registrySource", () => {
    assert.deepEqual(registryIds(registrySource(["quote", "contact", "newsletter-2"])), ["contact", "newsletter-2", "quote"]);
    assert.deepEqual(registryIds(registrySource([])), []);
  });
  test("reads the committed registry", () => assert.deepEqual(registryIds(registrySource(formFiles.map((file) => file.id))), formFiles.map((file) => file.id)));
});

describe("the committed registry", () => {
  test("lists exactly the files in src/content/forms", () => {
    const names = readdirSync(new URL("../content/forms/", import.meta.url)).filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -5));
    assert.deepEqual(formFiles.map((file) => file.id), [...names].sort());
  });
});
