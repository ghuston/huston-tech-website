import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { fieldLimits, needOptions, sourceOptions } from "../content/contact-fields.ts";
import { noteForm } from "../content/contact.ts";
import { formWords } from "../content/forms.ts";
import contactJson from "../content/forms/contact.json" with { type: "json" };
import { validateContact } from "../lib/contact-validation.ts";
import { answerLines, emailOf, nameOf, organizationOf } from "./answers.ts";
import { CONTACT_BODY_BYTES, contactDefinitionFor } from "./contact.ts";
import { CONTACT_FORM_ID, DEFAULT_FORM_SETTINGS } from "./schema.ts";
import { showcaseForm } from "./showcase.ts";
import { formProblems, parseForm, validateSubmission } from "./validate.ts";

const ctx = { fileExists: () => true };

describe("contact.json", () => {
  test("is a good form file", () => assert.deepEqual(formProblems(CONTACT_FORM_ID, contactJson, ctx, DEFAULT_FORM_SETTINGS), []));
  test("the browser's light reading equals the checked reading", () => {
    assert.deepEqual(contactDefinitionFor(""), parseForm(contactJson, DEFAULT_FORM_SETTINGS, CONTACT_FORM_ID));
  });
  test("the need options are the labels of needOptions, in order", () => {
    const need = contactJson.fields.find((field) => field.id === "need");
    assert.deepEqual(need?.options, needOptions.map((option) => option.label));
  });
  test("the source options are sourceOptions", () => {
    assert.deepEqual(contactJson.fields.find((field) => field.id === "source")?.options, [...sourceOptions]);
  });
  test("labels, limits and error messages are the contact module's, verbatim", () => {
    const by = Object.fromEntries(contactJson.fields.map((field) => [field.id, field])) as Record<string, { label: string; max?: number; error?: string; help?: string }>;
    assert.equal(by["need"]?.label, noteForm.needLegend);
    assert.equal(by["name"]?.label, noteForm.name.label);
    assert.equal(by["email"]?.label, noteForm.email.label);
    assert.equal(by["business"]?.label, noteForm.business.label);
    assert.equal(by["message"]?.label, noteForm.message.label);
    assert.equal(by["message"]?.help, noteForm.privacyNote);
    assert.equal(by["tools"]?.label, noteForm.tools.label);
    assert.equal(by["website"]?.label, noteForm.website.label);
    assert.equal(by["source"]?.label, noteForm.source.label);
    assert.equal(by["need"]?.error, noteForm.errors.need);
    assert.equal(by["name"]?.error, noteForm.errors.name);
    assert.equal(by["email"]?.error, noteForm.errors.email);
    assert.equal(by["message"]?.error, noteForm.errors.message);
    for (const key of ["name", "business", "message", "tools", "website"] as const) assert.equal(by[key]?.max, fieldLimits[key], key);
    assert.equal(contactJson.button, noteForm.submitLabel);
  });
  test("the email limit is the contact limit", () => assert.equal(contactDefinitionFor("").fields.find((f) => f.id === "email")?.max, fieldLimits.email));
});

describe("contactDefinitionFor", () => {
  test("has the fields in form order", () => {
    assert.deepEqual(contactDefinitionFor("").fields.map((f) => f.id), ["need", "name", "email", "business", "message", "tools", "website", "source"]);
    assert.deepEqual(contactDefinitionFor("website").fields.map((f) => f.id), contactDefinitionFor("").fields.map((f) => f.id));
  });
  test("the partner variant drops need", () => {
    assert.deepEqual(contactDefinitionFor("partner").fields.map((f) => f.id), ["name", "email", "business", "message", "tools", "website", "source"]);
  });
  test("a returned copy can be changed without changing the next one", () => {
    contactDefinitionFor("").fields.length = 0;
    assert.equal(contactDefinitionFor("").fields.length, 8);
  });
  test("the body limit stays 16 KB", () => assert.equal(CONTACT_BODY_BYTES, 16384));
});

describe("validateContact over the one validator", () => {
  const valid = { need: "both", name: "Ada Lovelace", email: "ada@example.org", message: "Hello", business: "", tools: "", website: "", source: "Google" };
  test("returns today's value shape", () => {
    assert.deepEqual(validateContact(valid), {
      ok: true,
      value: { need: "both", topic: "", name: "Ada Lovelace", email: "ada@example.org", business: "", message: "Hello", tools: "", website: "", source: "Google" },
    });
  });
  test("cleans text", () => {
    const result = validateContact({ need: "both", name: " Ada\nLovelace ", email: " ada@example.org ", message: "Line one\r\nLine two\u0007" });
    assert.ok(result.ok);
    if (result.ok) {
      assert.equal(result.value.name, "Ada Lovelace");
      assert.equal(result.value.email, "ada@example.org");
      assert.equal(result.value.message, "Line one\nLine two");
    }
  });
  test("lists missing fields in form order: need, name, email, message", () => {
    assert.deepEqual(validateContact({}), { ok: false, fields: ["need", "name", "email", "message"], malformed: false });
    assert.deepEqual(validateContact({ ...valid, email: "nope", need: "" }), { ok: false, fields: ["need", "email"], malformed: false });
  });
  test("this site has no partner topic: it is malformed, as any unknown topic is", () => {
    assert.deepEqual(validateContact({ ...valid, topic: "partner" }), { ok: false, fields: [], malformed: true });
  });
  test("a website or system topic is kept and does not change the need question; the old workflow value reads as system", () => {
    const result = validateContact({ ...valid, need: "system", topic: "system" });
    assert.ok(result.ok && result.value.topic === "system" && result.value.need === "system");
    const old = validateContact({ ...valid, need: "workflow", topic: "workflow" });
    assert.ok(old.ok && old.value.topic === "system" && old.value.need === "system");
  });
  test("malformed: wrong types, unknown options, over the limits, a bad topic", () => {
    assert.deepEqual(validateContact({ ...valid, name: 5 }), { ok: false, fields: ["name"], malformed: true });
    assert.deepEqual(validateContact({ ...valid, need: "everything" }), { ok: false, fields: ["need"], malformed: true });
    assert.deepEqual(validateContact({ ...valid, source: "Billboard" }), { ok: false, fields: [], malformed: true });
    assert.deepEqual(validateContact({ ...valid, topic: "other" }), { ok: false, fields: [], malformed: true });
    assert.deepEqual(validateContact({ ...valid, message: "x".repeat(fieldLimits.message + 1) }), { ok: false, fields: [], malformed: true });
    assert.deepEqual(validateContact({ ...valid, topic: "website", need: "everything" }), { ok: false, fields: ["need"], malformed: true });
    assert.deepEqual(validateContact({ ...valid, email: `${"a".repeat(fieldLimits.email)}@b.cd` }), { ok: false, fields: [], malformed: true });
    assert.deepEqual(validateContact({ ...valid, tools: "x".repeat(fieldLimits.tools + 1) }), { ok: false, fields: [], malformed: true });
  });
  test("tools keeps its one-line cleaning", () => {
    const result = validateContact({ ...valid, tools: "a\nb\tc" });
    assert.ok(result.ok && result.value.tools === "a b c");
  });
  test("null counts as missing; a message of the exact limit passes", () => {
    assert.ok(validateContact({ ...valid, business: null }).ok);
    assert.ok(validateContact({ ...valid, message: "x".repeat(fieldLimits.message) }).ok);
  });
});

describe("answers", () => {
  const def = contactDefinitionFor("");
  const result = validateSubmission(def, { need: "Both", name: "Ada", email: "a@b.co", business: "Analytical", message: "Hi", source: "" });
  test("given answers only, in field order", () => {
    assert.ok(result.ok);
    if (result.ok) {
      assert.deepEqual(answerLines(def, result.value).map((line) => line.label), ["What do you need?", "Your name", "Best email", "Business name (optional)", "What's going on?"]);
      assert.equal(nameOf(def, result.value), "Ada");
      assert.equal(emailOf(def, result.value), "a@b.co");
      assert.equal(organizationOf(def, result.value), "Analytical");
    }
  });
  test("checkboxes read Yes or No and the helpers give an empty string when there is no such field", () => {
    const result2 = validateSubmission(showcaseForm, { name: "Ada", email: "a@b.co", interest: "A website", message: "Hi", copy: true });
    assert.ok(result2.ok);
    if (result2.ok) {
      const lines = answerLines(showcaseForm, result2.value);
      assert.deepEqual(lines.slice(-2), [
        { label: "I have worked with you before.", text: "Yes" },
        { label: "You can email me now and then with news.", text: "No" },
      ]);
      assert.equal(organizationOf(showcaseForm, result2.value), "");
    }
  });
});

describe("showcase form and the words", () => {
  test("the showcase form is a good form, with every field type, live and with no download", () => {
    // A parsed definition carries the fixed limits of email and phone; a file may not.
    const file = { ...showcaseForm, fields: showcaseForm.fields.map(({ max, ...field }) => (field.type === "short-text" || field.type === "long-text" ? { ...field, max } : field)) };
    assert.deepEqual(formProblems("showcase-copy", file, ctx, DEFAULT_FORM_SETTINGS), []);
    assert.equal(showcaseForm.status, "live");
    assert.equal(showcaseForm.download, undefined);
    assert.deepEqual([...new Set(showcaseForm.fields.map((f) => f.type))].sort(), ["checkbox", "consent", "dropdown", "email", "long-text", "phone", "short-text"]);
  });
  test("formWords holds plain data, with the {title} marker in the download lines", () => {
    assert.equal(formWords.optional, "(optional)");
    assert.equal(formWords.download.subject, "Your copy of {title}");
    assert.ok(formWords.download.lines.every((line) => typeof line === "string"));
    assert.equal(formWords.errors.consent, "Please tick this box to go on.");
  });
});
