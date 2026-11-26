import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DEFAULT_FORM_SETTINGS } from "./schema.ts";
import type { FormDefinition, FormSettings } from "./schema.ts";
import { formProblems, formWarnings, parseForm, publicForm, validateForms, validateSubmission } from "./validate.ts";

const ctx = { fileExists: (href: string) => href === "/files/buyers-checklist-k3x9q2mz.pdf" };
const settings = DEFAULT_FORM_SETTINGS;

const good = () => ({
  name: "Quote request",
  status: "live",
  fields: [
    { id: "name", type: "short-text", label: "Your name", purpose: "name", required: true },
    { id: "email", type: "email", label: "Email", required: true },
    { id: "phone", type: "phone", label: "Phone", required: false },
    { id: "project", type: "dropdown", label: "Project type", options: ["Kitchen", "Bathroom", "Other"], required: true },
    { id: "message", type: "long-text", label: "Tell me about the project", required: true, max: 2000 },
    { id: "updates", type: "consent", label: "You can email me now and then with news and offers.", required: false },
  ],
  button: "Send my request",
  thanks: "Thanks. I'll reply within two working days.",
  download: { href: "/files/buyers-checklist-k3x9q2mz.pdf", title: "The Buyer's Checklist" },
});
type Raw = ReturnType<typeof good>;
const problems = (data: unknown, over: Partial<FormSettings> = {}) => formProblems("quote", data, ctx, { ...settings, ...over });
const has = (list: string[], text: string) => assert.ok(list.some((line) => line.includes(text)), `expected a problem with "${text}" in:\n${list.join("\n")}`);
const withField = (field: Record<string, unknown>, index = 0): Raw => {
  const form = good();
  (form.fields as Record<string, unknown>[])[index] = field;
  return form;
};

describe("a good form", () => {
  test("passes with no problems", () => assert.deepEqual(problems(good()), []));
  test("names the file in every sentence", () => {
    for (const line of problems({ ...good(), button: "" })) assert.ok(line.startsWith("src/content/forms/quote.json"), line);
  });
});

describe("form-level rules", () => {
  test("name, button and thanks limits", () => {
    has(problems({ ...good(), name: "" }), '"name" is empty');
    has(problems({ ...good(), name: "x".repeat(61) }), '"name" is 61 characters');
    has(problems({ ...good(), button: "x".repeat(41) }), '"button" is 41 characters');
    has(problems({ ...good(), thanks: "x".repeat(401) }), '"thanks" is 401 characters');
    assert.deepEqual(problems({ ...good(), name: "x".repeat(60), button: "x".repeat(40), thanks: "x".repeat(400) }), []);
  });
  test("text is plain", () => {
    has(problems({ ...good(), thanks: "Thanks <b>so</b> much" }), "HTML tag");
    has(problems({ ...good(), button: "Go [here](https://x.test)" }), "markdown link");
  });
  test("status is required and one of live or archived", () => {
    const rest: Record<string, unknown> = { ...good() };
    delete rest.status;
    has(problems(rest), '"status" is required');
    has(problems({ ...good(), status: "draft" }), '"status" must be one of live, archived');
    assert.deepEqual(problems({ ...good(), status: "archived" }), []);
  });
  test("an unknown form key is refused", () => {
    has(problems({ ...good(), destination: "x" }), '"destination" is not a form setting');
    has(problems({ ...good(), style: "x" }), '"style" is not allowed');
  });
  test("a bad form id is refused", () => {
    has(formProblems("Bad_Id", good(), ctx, settings), "must be lowercase words and digits");
  });
  test("a file named like the showcase example is refused, so it can never be shadowed", () => {
    has(formProblems("showcase-example", good(), ctx, settings), "block showcase's example form");
  });
});

describe("fields", () => {
  test("a form needs between 1 and maxFields fields", () => {
    has(problems({ ...good(), fields: [] }), "0 fields");
    const fields = Array.from({ length: 4 }, (_, i) => ({ id: `q${i}`, type: "short-text", label: `Q${i}`, max: 10 }));
    has(problems({ ...good(), fields: [{ id: "email", type: "email", label: "Email" }, ...fields] }, { maxFields: 4 }), "5 fields; this site takes at most 4");
    assert.deepEqual(problems({ ...good(), fields: [{ id: "email", type: "email", label: "Email" }, ...fields] }, { maxFields: 5 }), []);
  });
  test("ids are unique slugs and never topic", () => {
    has(problems(withField({ id: "Your Name", type: "short-text", label: "Name" })), "must be lowercase words and digits");
    has(problems(withField({ id: "topic", type: "short-text", label: "Name" })), '"topic" is reserved');
    has(problems(withField({ id: "constructor", type: "short-text", label: "Name" })), '"constructor" is reserved');
    has(problems(withField({ id: "email", type: "short-text", label: "Name" })), "already used by field 1");
    has(problems(withField({ id: "x".repeat(41), type: "short-text", label: "Name" })), "1 to 40 characters");
    has(problems(withField({ id: "turnstileToken", type: "short-text", label: "Name" })), "must be lowercase words");
  });
  test("type must be one of the seven", () => {
    has(problems(withField({ id: "n", type: "date", label: "Name" })), '"type" must be one of: short-text');
  });
  test("short-text: max 1 to 300, default 200", () => {
    has(problems(withField({ id: "n", type: "short-text", label: "Name", max: 301 })), '"max" must be a whole number from 1 to 300');
    has(problems(withField({ id: "n", type: "short-text", label: "Name", max: 0 })), '"max" must be a whole number from 1 to 300');
    assert.deepEqual(problems(withField({ id: "n", type: "short-text", label: "Name", max: 300 })), []);
    const def = parseForm(good(), settings) as FormDefinition;
    assert.equal(def.fields[0]?.max, 200);
  });
  test("long-text: max 1 to 5000, default 2000", () => {
    has(problems(withField({ id: "m", type: "long-text", label: "Message", max: 5001 }, 4)), '"max" must be a whole number from 1 to 5000');
    const form = good();
    (form.fields[4] as Record<string, unknown>)["max"] = undefined;
    delete (form.fields[4] as Record<string, unknown>)["max"];
    assert.equal((parseForm(form, settings) as FormDefinition).fields[4]?.max, 2000);
  });
  test("email and phone limits are fixed, so max is refused", () => {
    has(problems(withField({ id: "email", type: "email", label: "Email", max: 100 }, 1)), '"max" does not apply to an email field');
    has(problems(withField({ id: "phone", type: "phone", label: "Phone", max: 10 }, 2)), '"max" does not apply to a phone field');
    const def = parseForm(good(), settings) as FormDefinition;
    assert.equal(def.fields[1]?.max, 254);
    assert.equal(def.fields[2]?.max, 30);
  });
  test("labels: 1 to 80, but 1 to 300 for a checkbox or consent", () => {
    has(problems(withField({ id: "n", type: "short-text", label: "x".repeat(81) })), '"label" is 81 characters');
    has(problems(withField({ id: "n", type: "short-text", label: "" })), '"label" is empty');
    has(problems(withField({ id: "n", type: "short-text" })), '"label" is missing');
    assert.deepEqual(problems(withField({ id: "updates", type: "consent", label: "x".repeat(300) }, 5)), []);
    has(problems(withField({ id: "updates", type: "consent", label: "x".repeat(301) }, 5)), '"label" is 301 characters');
    assert.deepEqual(problems(withField({ id: "ok", type: "checkbox", label: "x".repeat(300) }, 5)), []);
  });
  test("help is 1 to 200 and error is 1 to 120", () => {
    has(problems(withField({ id: "n", type: "short-text", label: "Name", help: "x".repeat(201) })), '"help" is 201 characters');
    has(problems(withField({ id: "n", type: "short-text", label: "Name", error: "x".repeat(121) })), '"error" is 121 characters');
    assert.deepEqual(problems(withField({ id: "n", type: "short-text", label: "Name", help: "x".repeat(200), error: "x".repeat(120) })), []);
  });
  test("required is true or false; the email is always required", () => {
    has(problems(withField({ id: "n", type: "short-text", label: "Name", required: "yes" })), '"required" must be true or false');
    has(problems(withField({ id: "email", type: "email", label: "Email", required: false }, 1)), "always required");
  });
  test("required defaults: true for text, email, dropdown; false for checkbox, consent, phone", () => {
    const form = {
      ...good(),
      fields: [
        { id: "a", type: "short-text", label: "A" },
        { id: "b", type: "long-text", label: "B" },
        { id: "email", type: "email", label: "E" },
        { id: "d", type: "dropdown", label: "D", options: ["x", "y"] },
        { id: "p", type: "phone", label: "P" },
        { id: "c", type: "checkbox", label: "C" },
        { id: "k", type: "consent", label: "K" },
      ],
    };
    const def = parseForm(form, settings) as FormDefinition;
    assert.deepEqual(
      def.fields.map((f) => f.required),
      [true, true, true, true, false, false, false],
    );
  });
  test("dropdown: 2 to 20 unique options of 1 to 80, display menu or buttons", () => {
    const dropdown = (extra: Record<string, unknown>) => withField({ id: "d", type: "dropdown", label: "D", ...extra });
    has(problems(dropdown({ options: ["only"] })), "takes 2 to 20");
    has(problems(dropdown({ options: Array.from({ length: 21 }, (_, i) => `o${i}`) })), "21 choices");
    has(problems(dropdown({ options: ["a", "a"] })), 'option 2 ("a") is listed twice');
    has(problems(dropdown({ options: ["a", "x".repeat(81)] })), "option 2 is 81 characters");
    has(problems(dropdown({ options: ["a", ""] })), "option 2 is empty");
    has(problems(dropdown({})), '"options" must be a list');
    has(problems(dropdown({ options: ["a", "b"], display: "radio" })), '"display" must be one of: menu, buttons');
    assert.deepEqual(problems(dropdown({ options: ["a", "b"], display: "buttons" })), []);
    assert.equal((parseForm({ ...good(), fields: [{ id: "email", type: "email", label: "E" }, { id: "d", type: "dropdown", label: "D", options: ["a", "b"] }] }, settings) as FormDefinition).fields[1]?.display, "menu");
  });
  test("options belong only to a dropdown, purpose only to a short-text", () => {
    has(problems(withField({ id: "n", type: "short-text", label: "Name", options: ["a", "b"] })), '"options" does not apply to a short-text field');
    has(problems(withField({ id: "m", type: "long-text", label: "Name", purpose: "name" }, 4)), '"purpose" does not apply to a long-text field');
    has(problems(withField({ id: "n", type: "short-text", label: "Name", purpose: "phone" })), '"purpose" must be one of: name, organization, website, address');
  });
  test("purposes are used at most once", () => {
    const form = good();
    form.fields.splice(1, 0, { id: "name2", type: "short-text", label: "Other name", purpose: "name", required: false } as never);
    has(problems(form), 'the purpose "name" is already used by field 1');
  });
  test("exactly one email field", () => {
    has(problems({ ...good(), fields: [{ id: "name", type: "short-text", label: "Name" }] }), "no email field");
    has(problems({ ...good(), fields: [{ id: "e1", type: "email", label: "E" }, { id: "e2", type: "email", label: "E2" }] }), "2 email fields");
  });
  test("a field must be an object", () => {
    has(problems({ ...good(), fields: ["x"] }), "must be an object");
  });
});

describe("keys that can never appear", () => {
  for (const [key, value, reason] of [
    ["checked", true, "cannot start ticked"],
    ["default", "x", "cannot start with an answer"],
    ["value", "x", "cannot start with an answer"],
    ["hidden", true, "hidden fields are not available"],
    ["pattern", "^a$", "owner-written validation rules"],
    ["style", "color:red", "takes no styling"],
    ["class", "big", "takes no styling"],
  ] as const) {
    test(`"${key}" is refused with a named sentence`, () => {
      const list = problems(withField({ id: "updates", type: "consent", label: "Agree", [key]: value }, 5));
      has(list, `"${key}" is not allowed: `);
      has(list, reason);
    });
  }
  test("any other key names what a field accepts", () => {
    has(problems(withField({ id: "n", type: "short-text", label: "Name", color: "red" })), '"color" is not a field setting. A field accepts: id, type, label');
  });
});

describe("caps", () => {
  test("the total of all text limits is at most maxAnswerChars", () => {
    const form = { ...good(), fields: [{ id: "email", type: "email", label: "Email" }, { id: "a", type: "long-text", label: "A", max: 3000 }, { id: "b", type: "long-text", label: "B", max: 3000 }] };
    assert.deepEqual(problems(form, { maxAnswerChars: 6254 }), []);
    has(problems(form, { maxAnswerChars: 6253 }), "6254 characters of answers in all; this site takes at most 6253");
  });
  test("maxForms counts live files only", () => {
    const file = (id: string, status: string) => ({ id, data: { ...good(), status } });
    const live = Array.from({ length: 3 }, (_, i) => file(`f${i}`, "live"));
    const archived = Array.from({ length: 5 }, (_, i) => file(`a${i}`, "archived"));
    const ok = validateForms([...live, ...archived], ctx, { ...settings, maxForms: 3 });
    assert.deepEqual(ok.problems, []);
    const over = validateForms([...live, file("f3", "live"), ...archived], ctx, { ...settings, maxForms: 3 });
    has(over.problems, "4 live forms; this site takes at most 3");
  });
  test("a form file that could not be read is reported by name", () => {
    const { problems: list } = validateForms([{ id: "broken", data: undefined, error: "is not valid JSON (x)." }], ctx, settings);
    assert.deepEqual(list, ["src/content/forms/broken.json: is not valid JSON (x)."]);
  });
  test("the registry lists exactly the form files", () => {
    const files = [{ id: "a", data: good() }, { id: "b", data: good() }];
    assert.deepEqual(validateForms(files, { ...ctx, registryIds: ["b", "a"] }, settings).problems, []);
    has(validateForms(files, { ...ctx, registryIds: ["a"] }, settings).problems, "missing: b");
    has(validateForms(files, { ...ctx, registryIds: ["a", "b", "z"] }, settings).problems, "has no form file: z");
    assert.deepEqual(validateForms(files, ctx, settings).problems, []);
  });
});

describe("download", () => {
  test("a /files/ PDF that exists is accepted", () => assert.deepEqual(problems(good()), []));
  test("a /files/ PDF that does not exist is refused", () => {
    has(problems({ ...good(), download: { href: "/files/other-k3x9q2mz.pdf", title: "T" } }), "is not a file in public/files/");
  });
  test("an upload reference is accepted", () => {
    assert.deepEqual(problems({ ...good(), download: { href: "upload:k3x9q2mz", title: "T" } }), []);
  });
  test("anything else is refused", () => {
    for (const href of ["https://evil.test/a.pdf", "/files/Bad Name.pdf", "/images/a.jpg", "upload:SHORT", "/files/a.exe", "javascript:alert(1)"]) {
      has(problems({ ...good(), download: { href, title: "T" } }), "must be a PDF link like /files/");
    }
  });
  test("the title is 1 to 80 characters and the keys are fixed", () => {
    has(problems({ ...good(), download: { href: "upload:k3x9q2mz", title: "x".repeat(81) } }), '"title" is 81 characters');
    has(problems({ ...good(), download: { href: "upload:k3x9q2mz" } }), '"title" is missing');
    has(problems({ ...good(), download: { href: "upload:k3x9q2mz", title: "T", extra: 1 } }), '"extra" is not a download setting');
    has(problems({ ...good(), download: "x" }), '"download" must be an object');
  });
});

describe("personal data (Review Focus line 4)", () => {
  test("a field with checked: true is refused with the named sentence", () => {
    has(problems(withField({ id: "updates", type: "consent", label: "Agree", checked: true }, 5)), '"checked" is not allowed: a field cannot start ticked');
  });
  test("a label asking for a card number is refused, with the reason", () => {
    const list = problems(withField({ id: "card", type: "short-text", label: "Card number" }));
    has(list, 'the label "Card number" matches "card number"');
    has(list, "not a safe place");
  });
  test("help text asking for an SSN is refused", () => {
    has(problems(withField({ id: "n", type: "short-text", label: "Name", help: "Add your SSN" })), 'the help text "Add your SSN" matches "SSN"');
  });
  test("an option named Password is refused", () => {
    has(problems(withField({ id: "d", type: "dropdown", label: "D", options: ["Password", "Other"] })), 'the option "Password" matches "password"');
  });
  test("the form name is judged too", () => {
    has(problems({ ...good(), name: "Passport number check" }), 'matches "passport number"');
  });
  test("the contact form is Huston Logic's and is not judged by the wording rules", () => {
    const form = withField({ id: "message", type: "long-text", label: "Message", help: "Please don't send passwords or card numbers." }, 4);
    assert.deepEqual(formProblems("contact", form, ctx, settings), []);
  });
  test("a health word is a warning, not a problem", () => {
    const form = withField({ id: "n", type: "short-text", label: "Any allergies?" });
    assert.deepEqual(problems(form), []);
    const warnings = formWarnings("quote", form);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0] as string, /mentions "allergies"\. This site is not set up for health details/);
    const result = validateForms([{ id: "quote", data: form }], ctx, settings);
    assert.deepEqual(result.problems, []);
    assert.equal(result.warnings.length, 1);
  });
  test("no warnings for a clean form", () => assert.deepEqual(formWarnings("quote", good()), []));
});

describe("parseForm", () => {
  test("returns the definition with defaults, or null on any problem", () => {
    const def = parseForm(good(), settings) as FormDefinition;
    assert.equal(def.name, "Quote request");
    assert.equal(def.download?.title, "The Buyer's Checklist");
    assert.equal(parseForm({ ...good(), button: "" }, settings), null);
    assert.equal(parseForm(null, settings), null);
    assert.equal(parseForm({ ...good(), fields: [{ id: "x", type: "short-text", label: "X", checked: true }] }, settings), null);
  });
  test("an upload reference parses (the editor resolves it)", () => {
    assert.ok(parseForm({ ...good(), download: { href: "upload:k3x9q2mz", title: "T" } }, settings));
  });
});

describe("publicForm", () => {
  test("drops the download link and says whether the form delivers a file", () => {
    const def = parseForm(good(), settings) as FormDefinition;
    const pub = publicForm(def);
    assert.equal(pub.delivers, true);
    assert.ok(!("download" in pub));
    assert.ok(!JSON.stringify(pub).includes("/files/"));
    const noFile = parseForm({ ...good(), download: undefined }, settings) as FormDefinition;
    assert.equal(publicForm(noFile).delivers, false);
  });
});

describe("validateSubmission", () => {
  const def = parseForm(good(), settings) as FormDefinition;
  const answers = { name: " Ada\nLovelace ", email: " ada@example.org ", phone: "+1 (555) 123-4567", project: "Kitchen", message: "Line one\r\nLine two\u0007", updates: true };

  test("cleans text, keeps field order and gives every field a value", () => {
    const result = validateSubmission(def, answers);
    assert.ok(result.ok);
    if (result.ok) {
      assert.deepEqual(Object.keys(result.value), ["name", "email", "phone", "project", "message", "updates"]);
      assert.equal(result.value["name"], "Ada Lovelace");
      assert.equal(result.value["email"], "ada@example.org");
      assert.equal(result.value["message"], "Line one\nLine two");
      assert.equal(result.value["updates"], true);
    }
  });
  test("checkbox values are booleans and false equals missing", () => {
    const a = validateSubmission(def, { ...answers, updates: false });
    const b = validateSubmission(def, { ...answers, updates: undefined });
    const c = validateSubmission(def, { ...answers, updates: null });
    for (const r of [a, b, c]) assert.ok(r.ok && r.value["updates"] === false);
  });
  test("a required consent that is not ticked is a fixable problem", () => {
    const required = parseForm(withField({ id: "terms", type: "consent", label: "I agree", required: true }, 5), settings) as FormDefinition;
    const rest: Record<string, unknown> = { ...answers };
    delete rest.updates;
    assert.deepEqual(validateSubmission(required, { ...rest, terms: false }), { ok: false, fields: ["terms"], malformed: false });
    assert.ok(validateSubmission(required, { ...rest, terms: true }).ok);
  });
  test("missing or bad answers list field ids in form order", () => {
    assert.deepEqual(validateSubmission(def, {}), { ok: false, fields: ["name", "email", "project", "message"], malformed: false });
    assert.deepEqual(validateSubmission(def, { ...answers, email: "nope", phone: "12" }), { ok: false, fields: ["email", "phone"], malformed: false });
    assert.deepEqual(validateSubmission(def, { ...answers, name: "   " }), { ok: false, fields: ["name"], malformed: false });
  });
  test("phone takes digits, spaces and + ( ) - . with 7 to 20 digits", () => {
    for (const ok of ["5551234", "+44 20 7946 0958", "555.123.4567", "(555) 123-4567"]) assert.ok(validateSubmission(def, { ...answers, phone: ok }).ok, ok);
    for (const bad of ["555123", "call me", "5551234x5", "1".repeat(21)]) {
      assert.deepEqual(validateSubmission(def, { ...answers, phone: bad }), { ok: false, fields: ["phone"], malformed: false }, bad);
    }
    assert.ok(validateSubmission(def, { ...answers, phone: "" }).ok);
  });
  test("malformed (Review Focus line 1): an extra key, a number for text, true for a dropdown, an unknown option, over a limit", () => {
    assert.equal((validateSubmission(def, { ...answers, extra: "x" }) as { malformed: boolean }).malformed, true);
    assert.equal((validateSubmission(def, { ...answers, name: 5 }) as { malformed: boolean }).malformed, true);
    assert.equal((validateSubmission(def, { ...answers, project: true }) as { malformed: boolean }).malformed, true);
    assert.equal((validateSubmission(def, { ...answers, project: "Garage" }) as { malformed: boolean }).malformed, true);
    assert.equal((validateSubmission(def, { ...answers, message: "x".repeat(2001) }) as { malformed: boolean }).malformed, true);
    assert.equal((validateSubmission(def, { ...answers, name: "x".repeat(201) }) as { malformed: boolean }).malformed, true);
    assert.equal((validateSubmission(def, { ...answers, email: `${"x".repeat(250)}@a.bc` }) as { malformed: boolean }).malformed, true);
    assert.equal((validateSubmission(def, { ...answers, updates: "yes" }) as { malformed: boolean }).malformed, true);
    assert.equal((validateSubmission(def, JSON.parse('{"__proto__": "x"}') as Record<string, unknown>) as { malformed: boolean }).malformed, true);
  });
  test("a limit is judged on what was sent, before cleaning", () => {
    assert.ok(validateSubmission(def, { ...answers, name: `${"x".repeat(200)}` }).ok);
    assert.equal((validateSubmission(def, { ...answers, name: `${"x".repeat(200)} ` }) as { malformed: boolean }).malformed, true);
  });
  test("an unknown option is both malformed and, when required, a fixable problem", () => {
    assert.deepEqual(validateSubmission(def, { ...answers, project: "Garage" }), { ok: false, fields: ["project"], malformed: true });
  });
});

describe("an answer is read from the visitor's own keys only", () => {
  test("an inherited property is not an answer", () => {
    const def = parseForm(good(), settings) as FormDefinition;
    const field = { id: "constructor", type: "short-text", label: "Q", required: true, max: 10 } as const;
    const withProto: FormDefinition = { ...def, fields: [{ ...field }] };
    const result = validateSubmission(withProto, {});
    assert.equal(result.ok, false);
    if (!result.ok) assert.deepEqual(result.fields, ["constructor"]);
    const own = validateSubmission(withProto, { constructor: "yes" });
    assert.ok(own.ok);
  });
});
