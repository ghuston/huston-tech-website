import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { SHOWCASE_FORM_ID } from "../forms/schema.ts";
import type { FormDefinition } from "../forms/schema.ts";
import { formById, loadForms, viewProps } from "./forms.ts";

const withDownload: FormDefinition = {
  name: "Checklist",
  status: "live",
  fields: [{ id: "email", type: "email", label: "Email", required: true, max: 254 }],
  button: "Send it",
  thanks: "Thanks.",
  download: { href: "/files/buyers-checklist-k3x9q2mz.pdf", title: "The Buyer's Checklist" },
};

describe("what the form block hands the browser", () => {
  test("holds no download link, however it is serialized", () => {
    const props = viewProps("checklist", withDownload);
    const sent = JSON.stringify(props);
    assert.equal(sent.includes("/files/"), false);
    assert.equal(sent.includes("download"), false);
    assert.equal(sent.includes("buyers-checklist"), false);
    assert.deepEqual(Object.keys(props.form).sort(), ["button", "delivers", "fields", "name", "status", "thanks"]);
    assert.equal(props.form.delivers, true);
  });

  test("a form with no download says it does not deliver", () => {
    assert.equal(viewProps("x", { ...withDownload, download: undefined }).form.delivers, false);
  });
});

describe("finding a form", () => {
  test("the showcase example is answered from code", () => assert.equal(formById(SHOWCASE_FORM_ID)?.name, "Enquiry"));
  test("an unknown id is null", () => assert.equal(formById("no-such-form"), null));
  test("the contact form is never answered by id", () => assert.equal(formById("contact"), null));
  test("the registry's forms parse", () => assert.ok(loadForms().some((form) => form.id === "contact")));
});
