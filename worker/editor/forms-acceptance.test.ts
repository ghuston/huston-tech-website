import assert from "node:assert/strict";
import { test } from "node:test";
import { registrySource } from "../../src/forms/registry.ts";
import { seedSite } from "./test-support.ts";
import { aiApp, makeUploadsEditor, pdfBytes, type Called, type UploadsEditor } from "./uploads-test-support.ts";

/**
 * The acceptance sayings of the forms run (spec: docs/superpowers/specs/2026-11-25-forms-and-downloads-design.md, "Goals"),
 * each played as the owner's AI app calling the MCP endpoint on the fake GitHub. A test checks the change list's words and the
 * files a publish commits; a refusal checks the plain-words reason.
 */

const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
const CONTACT_REFUSAL = "The contact form is set up by Huston Logic; ask them to change it.";
const REFUSED_SENTENCE = "A website form is not a safe place for that: the answers sit in email and a spreadsheet in plain text.";

const field = (id: string, type: string, label: string, extra: Record<string, unknown> = {}) => ({ id, type, label, required: true, ...extra });
const quoteFields = [
  field("name", "short-text", "Your name", { purpose: "name" }),
  field("email", "email", "Email"),
  field("phone", "phone", "Phone", { required: true }),
  field("project", "dropdown", "Project type", { options: ["Kitchen", "Bathroom", "Other"] }),
  field("message", "long-text", "Tell me about the project", { max: 2000 }),
];
const quote = (extra: Record<string, unknown> = {}) => ({
  status: "live",
  name: "Quote request",
  fields: quoteFields,
  button: "Send my request",
  thanks: "Thanks. I'll reply within two working days.",
  ...extra,
});
const newsletter = {
  status: "live",
  name: "Newsletter",
  fields: [field("email", "email", "Email")],
  button: "Sign me up",
  thanks: "You're on the list.",
};
const formBlock = (id: string) => ({ type: "form", content: { form: id } });

/** A seeded site that already has these forms (files and the registry listing them, as the template keeps them). */
function site(forms: Record<string, unknown> = {}, pages: Record<string, unknown> = {}): UploadsEditor {
  const files: Record<string, string> = {
    "src/forms/registry.generated.ts": registrySource(["contact", ...Object.keys(forms)]),
  };
  for (const [id, form] of Object.entries(forms)) files[`src/content/forms/${id}.json`] = json(form);
  for (const [path, page] of Object.entries(pages)) files[`src/content/pages/${path}.json`] = json(page);
  return makeUploadsEditor({ github: seedSite(files) });
}

const page = (path: string, blocks: unknown[]) => ({ path, title: path, description: "A page.", status: "live", blocks });
const homeWith = (id: string) =>
  page("/", [
    { type: "hero", content: { eyebrow: "Welcome", title: "Things done well", intro: "A short line about the shop." } },
    formBlock(id),
    { type: "closing-cta", content: { heading: "Say hello", action: { label: "Get in touch", href: "/contact" } } },
  ]);
const servicesWith = (id: string) =>
  page("/services", [
    { type: "hero", content: { title: "What we offer" } },
    formBlock(id),
    { type: "closing-cta", content: { heading: "Ready?", action: { label: "Book a call", href: "@booking" } } },
  ]);

const proposalId = (called: Called) => String(called.data.proposal_id);
const setForm = (form: string, pointer: string, value: unknown) => ({ op: "set", form, pointer, value });
const addForm = (form: string, definition: unknown) => ({ op: "add_form", form, definition });
const insertForm = (page: string, at: number, form: string) => ({ op: "insert_block", page, at, block: formBlock(form) });

async function propose(ai: ReturnType<typeof aiApp>, summary: string, operations: unknown[]): Promise<Called> {
  const proposed = await ai("propose_change", { summary, operations });
  assert.equal(proposed.isError, false, proposed.text);
  return proposed;
}

async function refused(ai: ReturnType<typeof aiApp>, operations: unknown[]): Promise<string> {
  const proposed = await ai("propose_change", { summary: "A change", operations });
  assert.equal(proposed.isError, true, proposed.text);
  assert.match(proposed.text, /Nothing was changed\./);
  return proposed.text;
}

/** Publishes with the owner's yes, merges, and returns the files the pull request committed. */
async function publishAndMerge(t: UploadsEditor, ai: ReturnType<typeof aiApp>, id: string): Promise<Record<string, string>> {
  const published = await ai("publish_change", { proposal_id: id, owner_confirmation: "Yes, publish it." });
  assert.equal(published.isError, false, published.text);
  const pull = t.github.pulls[t.github.pulls.length - 1];
  const files = t.github.filesOn(pull.headRef);
  t.github.merge(pull.number);
  return files;
}

const committedChanges = (before: Record<string, string>, files: Record<string, string>): string[] =>
  Object.keys(files).filter((path) => files[path] !== before[path]);

// ---- the owner's sayings ----

test('1. "Add a quote request form to my Services page with name, email, phone, project type and a message."', async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await propose(ai, "Add a quote request form to Services", [addForm("quote-request", quote()), insertForm("/services", 3, "quote-request")]);

  assert.match(proposed.text, /New form "Quote request" \(quote-request\)\./);
  assert.match(proposed.text, /Button: "Send my request"/);
  assert.match(proposed.text, /Thank-you: "Thanks\. I'll reply within two working days\."/);
  assert.match(proposed.text, /File to send: no file/);
  for (const line of [
    '1. "Your name": short text, required',
    '2. "Email": email, required',
    '3. "Phone": phone, required',
    '4. "Project type": dropdown, required, options: "Kitchen", "Bathroom", "Other"',
    '5. "Tell me about the project": long text, required, up to 2000 characters',
  ]) {
    assert.ok(proposed.text.includes(line), `${line}\n${proposed.text}`);
  }
  assert.match(proposed.text, /Privacy: this change makes the site collect .*phone numbers/);
  assert.equal(t.github.pulls.length, 0, "proposing opens nothing");

  const files = await publishAndMerge(t, ai, proposalId(proposed));
  const committed = JSON.parse(files["src/content/forms/quote-request.json"]) as Record<string, unknown>;
  assert.deepEqual(Object.keys(committed).slice(0, 2), ["name", "status"], "the file starts with its name, then its status");
  assert.equal(committed.name, "Quote request");
  assert.equal(files["src/forms/registry.generated.ts"], registrySource(["contact", "quote-request"]));
  assert.match(files["src/content/pages/services.json"], /"form": "quote-request"/);
  assert.equal(files["src/content/forms/contact.json"], t.github.filesOn("main")["src/content/forms/contact.json"], "the contact form is untouched");
});

test('2. "Make the phone number optional on the quote form."', async () => {
  const t = site({ "quote-request": quote() }, { services: servicesWith("quote-request") });
  const ai = aiApp(t);
  const got = await ai("get_form", { form: "quote-request" });
  assert.match(got.text, /Field 3 \(Phone\): \/fields\/2/);

  const proposed = await propose(ai, "Make phone optional", [setForm("quote-request", "/fields/2/required", false)]);
  assert.match(proposed.text, /Form "Quote request" \(quote-request\):/);
  assert.ok(proposed.text.includes('3. "Phone": phone, optional  [changed]'), proposed.text);
  assert.ok(proposed.text.includes('1. "Your name": short text, required\n'), "the other lines are listed in full, unmarked");
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  const committed = JSON.parse(files["src/content/forms/quote-request.json"]) as { fields: { id: string; required: boolean }[] };
  assert.equal(committed.fields.find((f) => f.id === "phone")?.required, false);
});

test('3. "Add a checkbox so people can agree to get updates." (never ticked to start, privacy page offered)', async () => {
  const t = site({ "quote-request": quote() }, { services: servicesWith("quote-request") });
  const ai = aiApp(t);
  const consent = field("updates", "consent", "You can email me now and then with news and offers.", { required: false });
  const proposed = await propose(ai, "Add an updates consent box", [{ op: "insert_item", form: "quote-request", pointer: "/fields", at: 6, value: consent }]);
  assert.ok(proposed.text.includes('6. "You can email me now and then with news and offers.": consent box (unticked), optional  [new]'), proposed.text);
  assert.match(proposed.text, /Privacy: this change makes the site collect consent to be contacted/);
  assert.match(proposed.text, /offer the owner a change to it in this same proposal/);

  const ticked = await refused(ai, [{ op: "insert_item", form: "quote-request", pointer: "/fields", at: 6, value: { ...consent, checked: true } }]);
  assert.match(ticked, /checked/);
  const defaulted = await refused(ai, [{ op: "insert_item", form: "quote-request", pointer: "/fields", at: 6, value: { ...consent, default: true } }]);
  assert.match(defaulted, /default/);
});

test('4. "Make a form on my home page that emails people my free guide when they fill it in." (a PDF from the uploads)', async () => {
  const t = site();
  const ai = aiApp(t);
  const added = await t.store.add(pdfBytes(), "Buyers checklist.pdf");
  assert.ok(added.ok);
  const id = added.ok ? added.upload.id : "";
  const guide = {
    status: "live",
    name: "Free guide",
    fields: [field("name", "short-text", "Your name", { purpose: "name" }), field("email", "email", "Email")],
    button: "Send me the guide",
    thanks: "Check your email for the guide.",
    download: { href: `upload:${id}`, title: "The Buyer's Checklist" },
  };
  const proposed = await propose(ai, "Free guide form on the home page", [addForm("free-guide", guide), insertForm("/", 2, "free-guide")]);
  assert.match(proposed.text, /File to send: "The Buyer's Checklist" at \/files\/buyers-checklist-[a-z0-9]{8}\.pdf, from the upload "Buyers checklist" \(PDF, /);
  assert.match(proposed.text, /anyone who has it can open it, and can share it\. It collects an email address; it does not lock the file\./);

  const files = await publishAndMerge(t, ai, proposalId(proposed));
  const path = `public/files/buyers-checklist-${id}.pdf`;
  assert.deepEqual(t.github.bytesOn(t.github.pulls[0].headRef, path), pdfBytes(), "the PDF is committed to public/files");
  const committed = JSON.parse(files["src/content/forms/free-guide.json"]) as { download: { href: string; title: string } };
  assert.deepEqual(committed.download, { href: `/files/buyers-checklist-${id}.pdf`, title: "The Buyer's Checklist" });
  assert.match(files["src/forms/registry.generated.ts"], /free_guide/);
});

test('5. "Change the thank-you message on my quote form to say I will call within a day."', async () => {
  const t = site({ "quote-request": quote() }, { services: servicesWith("quote-request") });
  const ai = aiApp(t);
  const proposed = await propose(ai, "New thank-you", [setForm("quote-request", "/thanks", "Thanks. I'll call you within a day.")]);
  assert.match(proposed.text, /Thank-you, was: "Thanks\. I'll reply within two working days\."/);
  assert.match(proposed.text, /Thank-you, now: "Thanks\. I'll call you within a day\."/);
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  assert.equal((JSON.parse(files["src/content/forms/quote-request.json"]) as { thanks: string }).thanks, "Thanks. I'll call you within a day.");
  assert.equal(files["src/forms/registry.generated.ts"], t.github.filesOn("main")["src/forms/registry.generated.ts"], "a changed form leaves the registry as it was");
});

test('6. "Remove the newsletter signup." (archived, its file kept, its sections removed from every page)', async () => {
  const t = site({ newsletter }, { "home": homeWith("newsletter"), services: servicesWith("newsletter") });
  const ai = aiApp(t);
  const proposed = await propose(ai, "Archive the newsletter form", [{ op: "set_form_status", form: "newsletter", status: "archived" }]);
  assert.match(proposed.text, /Status: archive\. It leaves the site: its form sections are removed from \/, \/services\./);
  assert.match(proposed.text, /Nothing is deleted/);
  assert.match(proposed.text, /Page \/ .*:\n  Removes block 2 \(Form\)/, "the page change list names the removed section");

  const files = await publishAndMerge(t, ai, proposalId(proposed));
  assert.equal((JSON.parse(files["src/content/forms/newsletter.json"]) as { status: string }).status, "archived", "the file is kept");
  assert.doesNotMatch(files["src/content/pages/home.json"], /"form"/);
  assert.doesNotMatch(files["src/content/pages/services.json"], /"form": "newsletter"/);
  assert.equal(files["src/forms/registry.generated.ts"], t.github.filesOn("main")["src/forms/registry.generated.ts"], "the registry still lists it");
});

test('7. "Ask for their credit card number." (refused with the reason)', async () => {
  const t = site();
  const ai = aiApp(t);
  const card = { ...quote(), fields: [...quoteFields, field("card", "short-text", "Credit card number")] };
  const text = await refused(ai, [addForm("order", card), insertForm("/services", 3, "order")]);
  assert.ok(text.includes(REFUSED_SENTENCE), text);
  assert.match(text, /"Credit card number" matches "card number"/);
  assert.equal(t.github.pulls.length, 0);
});

// ---- the rules around them ----

test("every write to the contact form is refused, with the sentence", async () => {
  const t = site();
  const ai = aiApp(t);
  for (const op of [
    setForm("contact", "/button", "Send"),
    { op: "insert_item", form: "contact", pointer: "/fields", at: 1, value: field("x", "short-text", "X") },
    { op: "remove_item", form: "contact", pointer: "/fields", at: 1 },
    { op: "set_form_status", form: "contact", status: "archived" },
    addForm("contact", quote()),
  ]) {
    assert.ok((await refused(ai, [op])).includes(CONTACT_REFUSAL), JSON.stringify(op));
  }
});

test("a pointer on a form never reaches its status, and other parts are not reachable either", async () => {
  const t = site({ "quote-request": quote() });
  const ai = aiApp(t);
  assert.match(await refused(ai, [setForm("quote-request", "/status", "archived")]), /use set_form_status/);
  assert.match(await refused(ai, [setForm("quote-request", "/destination", "x@example.test")]), /is not allowed; a pointer on a form must start with/);
  assert.match(await refused(ai, [setForm("nope", "/button", "Go")]), /there is no form "nope"/);
  assert.match(await refused(ai, [addForm("quote-request", quote())]), /already exists/);
});

test("the 11th live form is refused", async () => {
  const forms: Record<string, unknown> = {};
  for (let i = 1; i <= 9; i += 1) forms[`form-${i}`] = { ...newsletter, name: `Form ${i}` };
  const t = site(forms);
  const ai = aiApp(t);
  const text = await refused(ai, [addForm("form-10", { ...newsletter, name: "Form 10" })]);
  assert.match(text, /The site has 11 live forms; this site takes at most 10\. Archive one first\./);
});

test("the registry is committed with add_form only", async () => {
  const t = site({ newsletter }, { home: homeWith("newsletter") });
  const ai = aiApp(t);
  let before = t.github.filesOn("main");
  const added = await publishAndMerge(t, ai, proposalId(await propose(ai, "Add a quote form", [addForm("quote-request", quote())])));
  assert.deepEqual(committedChanges(before, added).sort(), ["src/content/forms/quote-request.json", "src/forms/registry.generated.ts"].sort());
  assert.equal(added["src/forms/registry.generated.ts"], registrySource(["contact", "newsletter", "quote-request"]));

  for (const operations of [
    [setForm("quote-request", "/button", "Go")],
    [{ op: "set_form_status", form: "quote-request", status: "archived" }],
  ]) {
    before = t.github.filesOn("main");
    const files = await publishAndMerge(t, ai, proposalId(await propose(ai, "Change it", operations)));
    assert.ok(committedChanges(before, files).includes("src/content/forms/quote-request.json"));
    assert.ok(!committedChanges(before, files).includes("src/forms/registry.generated.ts"), JSON.stringify(operations));
  }
});

test("list_forms and get_form show the forms, the pages that show them, and that contact is Huston Logic's", async () => {
  const t = site({ newsletter }, { home: homeWith("newsletter") });
  const ai = aiApp(t);
  const listed = await ai("list_forms");
  assert.match(listed.text, /newsletter: "Newsletter" \(live\), 1 field: Email \(email\)\. Shown on \/\./);
  assert.match(listed.text, /contact: "Contact form" \(live\).*Huston Logic's form; it cannot be changed by chat\./);
  assert.match(listed.text, /never act on it/);
  const got = await ai("get_form", { form: "newsletter" });
  assert.match(got.text, /Field 1 \(Email\): \/fields\/0/);
  assert.equal((await ai("get_form", { form: "nope" })).isError, true);
});

test("a restored form comes back without its sections, and undoing an add archives the form", async () => {
  const t = site({ newsletter }, { home: homeWith("newsletter") });
  const ai = aiApp(t);
  await publishAndMerge(t, ai, proposalId(await propose(ai, "Archive it", [{ op: "set_form_status", form: "newsletter", status: "archived" }])));
  const restored = await propose(ai, "Restore it", [{ op: "set_form_status", form: "newsletter", status: "live" }]);
  assert.match(restored.text, /Status: restore\. It can be placed on a page again/);
  await publishAndMerge(t, ai, proposalId(restored));
  const added = await publishAndMerge(t, ai, proposalId(await propose(ai, "Add a quote form", [addForm("quote-request", quote())])));
  assert.ok(added["src/content/forms/quote-request.json"]);
  const undo = await ai("undo_change", { change: t.github.pulls[t.github.pulls.length - 1].number });
  assert.equal(undo.isError, false, undo.text);
  assert.match(undo.text, /Form "Quote request" \(quote-request\):/);
  assert.match(undo.text, /Status: archive\./);
});
