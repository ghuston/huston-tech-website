import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { AnyBlockDefinition } from "../blocks/schema.ts";
import { validateContent, validateRegistry } from "../blocks/validate.ts";
import type { Context } from "../blocks/validate.ts";
import type { FormStatus } from "./schema.ts";

const def = { fields: { form: { kind: "form", label: "Form" } } } as unknown as AnyBlockDefinition;
const repo = { imageExists: () => true, fileExists: () => true };
const forms = new Map<string, FormStatus>([["quote", "live"], ["old", "archived"], ["contact", "live"]]);
const ctx: Context = { repo, pages: null, forms };
const check = (value: unknown, context: Context = ctx) => validateContent(def, { form: value }, "page.json, block 2 (form)", context);

describe('the "form" field kind', () => {
  test("accepts the id of a live form", () => assert.deepEqual(check("quote"), []));
  test("refuses the contact form, with the reason", () => {
    const [problem] = check("contact");
    assert.match(problem as string, /is the contact form, which only the contact-form block shows/);
  });
  test("refuses an archived form", () => assert.match(check("old")[0] as string, /"old" is archived/));
  test("refuses a form that does not exist", () => assert.match(check("nope")[0] as string, /"nope" is not a form on this site/));
  test("refuses a value that is not text", () => assert.match(check(5)[0] as string, /must be the id of a form/));
  test("with no forms at all, nothing can be named", () => {
    assert.match(check("quote", { repo, pages: null })[0] as string, /is not a form on this site/);
    assert.match(check("quote", { repo, pages: null, forms: null })[0] as string, /is not a form on this site/);
  });
  test("a registry example is judged with the showcase form", () => {
    const registry = [
      {
        type: "demo",
        title: "Demo",
        description: "A demo block.",
        source: "site",
        fields: def.fields,
        variants: [{ name: "a", description: "A" }],
        placement: { position: "any", maxPerPage: 1, rhythm: "section" },
        motion: { entrance: "none", reason: "A reason that is long enough to pass." },
        example: { form: "showcase-example" },
      },
    ] as unknown as AnyBlockDefinition[];
    assert.deepEqual(validateRegistry(registry, repo), []);
  });
});
