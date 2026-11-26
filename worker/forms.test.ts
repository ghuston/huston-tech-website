// Tests for the forms route (POST /api/forms/<id>). Never real mail or data: `fetch` is mocked, the Worker is built from a
// fixture config (obviously fake values) and fixture form definitions, never the real registry. The save chain is this
// site's: the Pipeline app first (production, INTAKE_SECRET set), the Sheet as the fallback.
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { buildWorkerConfig, type WorkerSiteConfig } from "./config.ts";
import { handleApi } from "./api.ts";
import contactWorker from "./contact.ts";
import { createFormsWorker } from "./forms.ts";
import type { ContactEnv } from "./env.ts";
import { formSheetRow } from "./form-messages.ts";
import { safeCell } from "./sheets.ts";
import { resetTokenCache } from "./sheets.ts";

type Call = { url: string; init: RequestInit; json: Record<string, unknown> | null };

const BASE: WorkerSiteConfig = {
  business: { name: "Example Co", tagline: "Plain words for plain work" },
  domain: { url: "https://example.test", workerName: "example-site", previewHostSuffix: ".workers.dev" },
  forms: { maxForms: 10, maxFields: 12, maxAnswerChars: 20000, maxBodyBytes: 32768 },
  contact: {
    siteEmail: "hello@example.test",
    fromName: "Example Co",
    replyFromName: "Pat Example",
    pipelineUrl: "https://pipeline.example.test",
    sheetTabs: { forms: "Forms", formsPreview: "Forms preview" },
  },
};

const FORMS = [
  {
    id: "quote",
    data: {
      name: "Quote request",
      status: "live",
      fields: [
        { id: "name", type: "short-text", label: "Your name", purpose: "name", required: true },
        { id: "email", type: "email", label: "Email", required: true },
        { id: "company", type: "short-text", label: "Company", purpose: "organization", required: false },
        { id: "project", type: "dropdown", label: "Project type", options: ["Kitchen", "Bathroom", "Other"], required: true },
        { id: "message", type: "long-text", label: "Tell me about the project", required: true, max: 5000 },
        { id: "focus", type: "long-text", label: "Review Focus", required: false, max: 5000 },
        { id: "terms", type: "consent", label: "I agree to be contacted about this request.", required: true },
        { id: "updates", type: "checkbox", label: "Send me news.", required: false },
      ],
      button: "Send my request",
      thanks: "Thanks. I'll reply within two working days.",
    },
  },
  {
    id: "guide",
    data: {
      name: "Buyer's guide",
      status: "live",
      fields: [{ id: "email", type: "email", label: "Email", required: true }],
      button: "Send me the guide",
      thanks: "Thanks. Check your email.",
      download: { href: "/files/buyers-checklist-k3x9q2mz.pdf", title: "The Buyer's Checklist" },
    },
  },
  { id: "old", data: { name: "Old form", status: "archived", fields: [{ id: "email", type: "email", label: "Email", required: true }], button: "Send", thanks: "Thanks." } },
  { id: "broken", data: { name: "Broken", status: "live", fields: [], button: "Send", thanks: "Thanks." } },
];

const ORIGIN = "https://example.test";
const PREVIEW_HOST = "feat-x-example-site.acct.workers.dev";
const PIPELINE_URL = "https://pipeline.example.test";
const INTAKE_SECRET = "intake-test-secret";
const PIPELINE_ENV = { INTAKE_SECRET } as const;
const NAME = "Ada Lovelace";
const EMAIL = "ada@example.org";
const MESSAGE = "Please quote the kitchen.";

function makeWorker(contact: Partial<NonNullable<WorkerSiteConfig["contact"]>> = {}, forms = FORMS) {
  return createFormsWorker(buildWorkerConfig({ ...BASE, contact: { ...BASE.contact!, ...contact } }), forms);
}

let calls: Call[] = [];
let logs: string[] = [];
let responders: Record<string, () => Response>;
let turnstileAction = "form";
const realFetch = globalThis.fetch;
const realLog = console.log;
let serviceAccountKey = "";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function route(url: string, init: RequestInit): string {
  if (url.includes("turnstile/v0/siteverify")) return "siteverify";
  if (url.startsWith("https://oauth2.googleapis.com/token")) return "token";
  if (url.startsWith("https://sheets.googleapis.com/")) return "sheets";
  if (url.startsWith(`${PIPELINE_URL}/`)) return "intake";
  if (url === "https://api.resend.com/emails") {
    const key = String((init.headers as Record<string, string>)["idempotency-key"]);
    return key.endsWith("-notify") ? "notify" : key.endsWith("-download") ? "download" : "reply";
  }
  throw new Error(`Unexpected fetch: ${url}`);
}

function env(overrides: Partial<ContactEnv> = {}, limit?: (key: string) => void): ContactEnv {
  return {
    SITE_ENV: "production",
    RESEND_API_KEY: "re_test",
    TURNSTILE_SECRET_KEY: "turnstile-test-secret",
    GOOGLE_SERVICE_ACCOUNT_KEY: serviceAccountKey,
    GOOGLE_SHEET_ID: "sheet-123",
    CONTACT_RATE_LIMIT: {
      limit: async ({ key }: { key: string }) => {
        limit?.(key);
        return { success: true };
      },
    },
    ...overrides,
  };
}

function post(body: unknown, { id = "quote", origin = ORIGIN, host = ORIGIN, raw }: { id?: string; origin?: string; host?: string; raw?: string } = {}): Request {
  return new Request(`${host}/api/forms/${id}`, {
    method: "POST",
    headers: { origin, "content-type": "application/json", "sec-fetch-site": "same-origin", "cf-connecting-ip": "203.0.113.9" },
    body: raw ?? JSON.stringify(body),
  });
}

const quote = { name: NAME, email: EMAIL, company: "", project: "Kitchen", message: MESSAGE, focus: "", terms: true, updates: false, company_fax: "", turnstileToken: "token-abc" };
const guide = { email: EMAIL, turnstileToken: "token-abc" };

function called(kind: string): Call[] {
  return calls.filter((c) => route(c.url, c.init) === kind);
}

async function bodyOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

/** The row the Sheets API got. */
function rowOf(): { tab: string; row: string[] } {
  const sheets = called("sheets")[0];
  assert.ok(sheets, "no Sheet call");
  const tab = decodeURIComponent(new URL(sheets.url).pathname.split("/values/")[1] ?? "").split("!")[0] ?? "";
  return { tab, row: (sheets.json?.values as string[][])[0] ?? [] };
}

beforeEach(async () => {
  calls = [];
  logs = [];
  turnstileAction = "form";
  resetTokenCache();
  const keyPair = (await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const der = (await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)) as ArrayBuffer;
  const pem = `-----BEGIN PRIVATE KEY-----\n${Buffer.from(der).toString("base64").replace(/(.{64})/g, "$1\n")}\n-----END PRIVATE KEY-----\n`;
  serviceAccountKey = JSON.stringify({ client_email: "writer@test.iam.gserviceaccount.com", private_key: pem });
  responders = {
    siteverify: () => jsonResponse({ success: true, hostname: "example.test", action: turnstileAction }),
    token: () => jsonResponse({ access_token: "test-access-token", expires_in: 3600 }),
    sheets: () => jsonResponse({ updates: { updatedRows: 1 } }),
    intake: () => jsonResponse({ ok: true }, 201),
    notify: () => jsonResponse({ id: "email-1" }),
    download: () => jsonResponse({ id: "email-3" }),
    reply: () => jsonResponse({ id: "email-2" }),
  };
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    let json: Record<string, unknown> | null = null;
    if (typeof init.body === "string") {
      try {
        json = JSON.parse(init.body) as Record<string, unknown>;
      } catch {
        json = null;
      }
    }
    calls.push({ url, init, json });
    return responders[route(url, init)]();
  }) as typeof fetch;
  console.log = (...args: unknown[]) => logs.push(args.join(" "));
});

afterEach(() => {
  globalThis.fetch = realFetch;
  console.log = realLog;
  for (const line of logs) {
    for (const secret of [NAME, EMAIL, MESSAGE, "203.0.113.9", "re_test", "turnstile-test-secret", INTAKE_SECRET, "pipeline.example.test", "buyers-checklist"]) {
      assert.ok(!line.includes(secret), `log line leaked "${secret}": ${line}`);
    }
  }
});

describe("routing", () => {
  test("an unknown, archived or contact id is a 404 before anything is read or called", async () => {
    let limited = 0;
    for (const id of ["nope", "old", "contact", "Bad_Id"]) {
      const response = await makeWorker().fetch(post(quote, { id }), env({}, () => limited++));
      assert.equal(response.status, 404, id);
    }
    assert.equal(limited, 0);
    assert.equal(calls.length, 0);
  });

  test("a bundled definition that fails the shared check is refused with a fixed log", async () => {
    const response = await makeWorker().fetch(post(quote, { id: "broken" }), env());
    assert.equal(response.status, 500);
    assert.ok(logs.some((line) => line.includes("form_definition_invalid")));
    assert.equal(calls.length, 0);
  });

  test("other methods are 405", async () => {
    const response = await makeWorker().fetch(new Request(`${ORIGIN}/api/forms/quote`), env());
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
  });
});

describe("requests rejected before any outside call", () => {
  const cases: [string, () => Request, number, string][] = [
    ["another origin", () => post(quote, { origin: "https://evil.example" }), 403, "rejected"],
    ["broken JSON", () => post(null, { raw: "{" }), 400, "rejected"],
    ["unknown key", () => post({ ...quote, extra: "1" }), 400, "rejected"],
    ["the contact-only topic key", () => post({ ...quote, topic: "website" }), 400, "rejected"],
    ["filled honeypot", () => post({ ...quote, company_fax: "555-0100" }), 400, "rejected"],
    ["body over 32 KB", () => post({ ...quote, message: "x".repeat(33000) }), 413, "rejected"],
    ["a required consent unticked", () => post({ ...quote, terms: false }), 400, "invalid"],
    ["a required field missing", () => post({ ...quote, message: " " }), 400, "invalid"],
    ["bad email", () => post({ ...quote, email: "ada@" }), 400, "invalid"],
    ["unknown option", () => post({ ...quote, project: "Pool" }), 400, "rejected"],
    ["a number for a text field", () => post({ ...quote, message: 42 }), 400, "rejected"],
    ["true for a dropdown", () => post({ ...quote, project: true }), 400, "rejected"],
    ["a word for a checkbox", () => post({ ...quote, terms: "yes" }), 400, "rejected"],
    ["missing token", () => post({ ...quote, turnstileToken: "" }), 403, "rejected"],
  ];
  for (const [label, request, status, error] of cases) {
    test(label, async () => {
      const response = await makeWorker().fetch(request(), env());
      assert.equal(response.status, status);
      assert.equal((await bodyOf(response)).error, error);
      assert.equal(calls.length, 0);
    });
  }

  test("an unticked consent names its field", async () => {
    const response = await makeWorker().fetch(post({ ...quote, terms: false }), env());
    assert.deepEqual((await bodyOf(response)).fields, ["terms"]);
  });

  test("a 10 KB body is fine for a form (the contact form stops at 16 KB, tested in contact.test.ts)", async () => {
    const big = { ...quote, message: "x".repeat(4900), focus: "y".repeat(4900) };
    const response = await makeWorker().fetch(post(big), env());
    assert.equal(response.status, 200);
  });
});

describe("rate limit", () => {
  test("the forms key is <id>:<ip>, and the contact form (its own handler) keeps the bare ip", async () => {
    const keys: string[] = [];
    await makeWorker().fetch(post(quote), env({}, (key) => keys.push(key)));
    // This site's own contact Worker, untouched: its key stays the bare IP. It stops later (Turnstile), which is enough here.
    await contactWorker.fetch(
      new Request(`${ORIGIN}/api/contact`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json", "sec-fetch-site": "same-origin", "cf-connecting-ip": "203.0.113.9" },
        body: JSON.stringify({ need: "website", topic: "", name: NAME, email: EMAIL, business: "", message: MESSAGE, tools: "", website: "", source: "", company_fax: "", turnstileToken: "t" }),
      }),
      env({}, (key) => keys.push(key)),
    );
    assert.deepEqual(keys, ["quote:203.0.113.9", "203.0.113.9"]);
  });

  test("a refusal is 429", async () => {
    const response = await makeWorker().fetch(post(quote), env({ CONTACT_RATE_LIMIT: { limit: async () => ({ success: false }) } }));
    assert.equal(response.status, 429);
    assert.equal(calls.length, 0);
  });
});

describe("Turnstile", () => {
  test("the action must be form (the contact action is refused)", async () => {
    turnstileAction = "contact";
    const response = await makeWorker().fetch(post(quote), env());
    assert.equal(response.status, 403);
    assert.equal(called("sheets").length + called("notify").length, 0);
  });
});

describe("a valid quote request", () => {
  {
    test("writes the Forms row through the service account (the Pipeline app is not set up)", async () => {
      const response = await makeWorker().fetch(post(quote), env());
      assert.equal(response.status, 200);
      assert.deepEqual(await bodyOf(response), { ok: true });
      const { tab, row } = rowOf();
      assert.equal(tab, "Forms");
      assert.equal(row.length, 6);
      assert.match(row[0] ?? "", /^\d{4}-\d\d-\d\dT/);
      assert.deepEqual(row.slice(1, 4), ["Quote request", NAME, EMAIL]);
      assert.equal(row[4], `Your name: ${NAME}\nEmail: ${EMAIL}\nProject type: Kitchen\nTell me about the project: ${MESSAGE}\nI agree to be contacted about this request.: Yes\nSend me news.: No`);
      assert.equal(row[5], "production");
    });
  }

  test("a preview writes the Forms preview tab and emails only the site", async () => {
    responders.siteverify = () => jsonResponse({ success: true, hostname: PREVIEW_HOST, action: "form" });
    const response = await makeWorker().fetch(post(quote, { host: `https://${PREVIEW_HOST}`, origin: `https://${PREVIEW_HOST}` }), env());
    assert.equal(response.status, 200);
    const { tab, row } = rowOf();
    assert.equal(tab, "Forms preview");
    assert.equal(row[5], "preview");
    for (const mail of called("notify")) assert.deepEqual((mail.json as { to: string[] }).to, ["hello@example.test"]);
  });

  test("the notification is plain text with every answer and the save line", async () => {
    await makeWorker().fetch(post(quote), env());
    const mail = called("notify")[0]?.json as { subject: string; text: string; to: string[]; reply_to: string; html?: string };
    assert.equal(mail.subject, "New Quote request from Ada Lovelace");
    assert.deepEqual(mail.to, ["hello@example.test"]);
    assert.equal(mail.reply_to, EMAIL);
    assert.equal(mail.html, undefined);
    assert.ok(mail.text.includes(`Project type: Kitchen`));
    assert.ok(mail.text.includes("Sheet: saved"));
    assert.equal(called("reply").length + called("download").length, 0, "a non-download form sends no visitor email");
  });

  test("a long answer keeps its line breaks in the Sheet and the notification", async () => {
    await makeWorker().fetch(post({ ...quote, focus: "one\ntwo\n\n\nfive" }), env());
    const { row } = rowOf();
    assert.ok((row[4] ?? "").includes("Review Focus:\none\ntwo\n\n\nfive"));
    const mail = called("notify")[0]?.json as { text: string };
    assert.ok(mail.text.includes("Review Focus:\none\ntwo"));
  });

  test("the answers cell is cut at 6000 with the fixed ending, and the notification has everything", async () => {
    const long = { ...quote, message: "a".repeat(4000), focus: "b".repeat(4000) };
    await makeWorker().fetch(post(long), env());
    const cell = rowOf().row[4] ?? "";
    assert.equal(cell.length, 6000);
    assert.ok(cell.endsWith("(cut; the notification email has every answer)"));
    const mail = called("notify")[0]?.json as { text: string };
    assert.ok(mail.text.includes("b".repeat(4000)));
  });

  test("an answers cell that safeCell prefixes still fits the Apps Script's 6000", () => {
    const def = {
      name: "Q",
      status: "live" as const,
      button: "Send",
      thanks: "Thanks.",
      fields: [
        { id: "total", type: "long-text" as const, label: "=Total", required: true, max: 5000 },
        { id: "more", type: "long-text" as const, label: "More", required: false, max: 5000 },
      ],
    };
    const row = formSheetRow(def, { total: "a".repeat(4000), more: "b".repeat(4000) }, "production", "2026-01-01T00:00:00Z");
    const sent = safeCell(row[4] ?? "");
    assert.ok(sent.startsWith("'="));
    assert.ok(sent.length <= 6000, String(sent.length));
    assert.ok(sent.endsWith("(cut; the notification email has every answer)"));
  });

  test("a formula-looking answer is made safe by the Sheet writer", async () => {
    await makeWorker().fetch(post({ ...quote, name: "=HYPERLINK(1)" }), env());
    const cell = (called("sheets")[0]?.json?.values as string[][])[0]?.[2];
    assert.equal(cell, "'=HYPERLINK(1)");
  });
});

describe("the Pipeline app, then the Sheet", () => {
  const withApp = () => env(PIPELINE_ENV);
  const preview = { host: `https://${PREVIEW_HOST}`, origin: `https://${PREVIEW_HOST}` };

  test("with INTAKE_SECRET set, the app takes the lead and the Sheet is not written", async () => {
    const response = await makeWorker().fetch(post({ ...quote, company: "Acme" }), withApp());
    assert.equal(response.status, 200);
    const [call] = called("intake");
    assert.equal(call?.url, "https://pipeline.example.test/intake");
    assert.equal((call?.init.headers as Record<string, string>)["x-intake-secret"], INTAKE_SECRET);
    assert.equal(call?.init.redirect, "manual");
    const lead = call?.json as { name: string; email: string; message: string; business: string; source: string };
    assert.equal(lead.name, NAME);
    assert.equal(lead.email, EMAIL);
    assert.equal(lead.business, "Acme");
    assert.equal(lead.source, "example.test form");
    assert.ok(lead.message.startsWith("Form: Quote request\n\n"));
    assert.equal(called("sheets").length + called("token").length, 0);
    const mail = called("notify")[0]?.json as { text: string };
    assert.ok(mail.text.includes("Saved to: the Pipeline app"));
  });

  test("the Sheet is the fallback when the app refuses (a 4xx is not retried)", async () => {
    responders.intake = () => jsonResponse({}, 401);
    const response = await makeWorker().fetch(post(quote), withApp());
    assert.equal(response.status, 200);
    assert.equal(called("intake").length, 1);
    assert.equal(rowOf().tab, "Forms");
    const mail = called("notify")[0]?.json as { text: string };
    assert.ok(mail.text.includes("Saved to: the Google Sheet (the Pipeline app did not take it)"));
    assert.ok(mail.text.includes("Pipeline app: NOT saved"));
  });

  test("a server error is retried once, then the Sheet takes it", async () => {
    responders.intake = () => jsonResponse({}, 503);
    const response = await makeWorker().fetch(post(quote), withApp());
    assert.equal(response.status, 200);
    assert.equal(called("intake").length, 2);
    assert.equal(rowOf().tab, "Forms");
  });

  test("an unreachable app falls back to the Sheet", async () => {
    responders.intake = () => {
      throw new Error("network down");
    };
    const response = await makeWorker().fetch(post(quote), withApp());
    assert.equal(response.status, 200);
    assert.equal(rowOf().tab, "Forms");
  });

  test("a redirect from the app is a failure and the secret is not sent on", async () => {
    responders.intake = () => new Response(null, { status: 302, headers: { location: "https://evil.example/" } });
    const response = await makeWorker().fetch(post(quote), withApp());
    assert.equal(response.status, 200);
    assert.equal(called("intake").length, 1);
    assert.equal(rowOf().tab, "Forms");
  });

  test("without INTAKE_SECRET the app is not called and the Sheet takes it", async () => {
    await makeWorker().fetch(post(quote), env());
    assert.equal(called("intake").length, 0);
    assert.equal(rowOf().tab, "Forms");
    assert.ok(logs.some((line) => line.includes("intake_not_configured")));
    const mail = called("notify")[0]?.json as { text: string };
    assert.ok(mail.text.includes("Pipeline app: not connected yet"));
  });

  test("when both the app and the Sheet fail, the notification email still counts as received", async () => {
    responders.intake = () => jsonResponse({}, 400);
    responders.sheets = () => jsonResponse({}, 400);
    const response = await makeWorker().fetch(post(quote), withApp());
    assert.equal(response.status, 200);
    const mail = called("notify")[0]?.json as { text: string };
    assert.ok(mail.text.includes("Saved to: NOWHERE"));
  });

  test("when the app, the Sheet and the email all fail the visitor is told it failed", async () => {
    responders.intake = () => jsonResponse({}, 400);
    responders.sheets = () => jsonResponse({}, 400);
    responders.notify = () => jsonResponse({}, 422);
    const response = await makeWorker().fetch(post(quote), withApp());
    assert.equal(response.status, 502);
    assert.ok(logs.some((line) => line.includes("capture_failed")));
  });

  test("the name falls back to the email address, and no business is sent without one", async () => {
    await makeWorker().fetch(post(guide, { id: "guide" }), withApp());
    const lead = called("intake")[0]?.json as { name: string; email: string; business?: string };
    assert.equal(lead.name, EMAIL);
    assert.equal(lead.business, undefined);
  });

  test("the message is capped at 5000 characters", async () => {
    await makeWorker().fetch(post({ ...quote, message: "a".repeat(4000), focus: "b".repeat(4000) }), withApp());
    const lead = called("intake")[0]?.json as { message: string };
    assert.equal(lead.message.length, 5000);
  });

  test("a preview never posts to the app, even with the secret set", async () => {
    responders.siteverify = () => jsonResponse({ success: true, hostname: PREVIEW_HOST, action: "form" });
    await makeWorker().fetch(post(quote, preview), withApp());
    assert.equal(called("intake").length, 0);
    assert.equal(rowOf().tab, "Forms preview");
    const mail = called("notify")[0]?.json as { text: string };
    assert.ok(mail.text.includes("Pipeline app: not used in previews"));
  });

  test("an app address that is not a bare https origin is refused without a call", async () => {
    const response = await makeWorker({ pipelineUrl: "http://pipeline.example.test/x" }).fetch(post(quote), withApp());
    assert.equal(response.status, 200);
    assert.equal(called("intake").length, 0);
    assert.equal(rowOf().tab, "Forms");
  });
});

describe("a download form", () => {
  test("sends one plain-text email with no visitor input, after the save", async () => {
    const response = await makeWorker().fetch(post(guide, { id: "guide" }), env());
    assert.deepEqual(await bodyOf(response), { ok: true, delivered: true });
    const mails = called("download");
    assert.equal(mails.length, 1);
    const mail = mails[0]?.json as { from: string; to: string[]; reply_to: string; subject: string; text: string; html?: string };
    assert.deepEqual(mail.to, [EMAIL]);
    assert.equal(mail.from, "Pat Example <hello@example.test>");
    assert.equal(mail.reply_to, "hello@example.test");
    assert.equal(mail.html, undefined);
    assert.equal(mail.subject, "Your copy of The Buyer's Checklist");
    assert.ok(mail.text.includes("https://example.test/files/buyers-checklist-k3x9q2mz.pdf"));
    assert.ok(mail.text.includes("Example Co"));
    assert.ok(!mail.text.includes(EMAIL) && !mail.subject.includes(EMAIL));
    assert.equal(called("reply").length, 0);
  });

  test("the link never comes from the request", async () => {
    await makeWorker().fetch(post(guide, { id: "guide" }), env());
    responders.siteverify = () => jsonResponse({ success: true, hostname: PREVIEW_HOST, action: "form" });
    await makeWorker().fetch(post(guide, { id: "guide", host: `https://${PREVIEW_HOST}`, origin: `https://${PREVIEW_HOST}` }), env());
    for (const mail of called("download")) assert.ok(!(mail.json as { text: string }).text.includes(PREVIEW_HOST));
  });

  test("in a preview it goes to the site's own address", async () => {
    responders.siteverify = () => jsonResponse({ success: true, hostname: PREVIEW_HOST, action: "form" });
    await makeWorker().fetch(post(guide, { id: "guide", host: `https://${PREVIEW_HOST}`, origin: `https://${PREVIEW_HOST}` }), env());
    const mail = called("download")[0]?.json as { to: string[]; subject: string };
    assert.deepEqual(mail.to, ["hello@example.test"]);
    assert.ok(mail.subject.startsWith("[Preview"));
  });

  test("delivered is false when the email fails, and the submission still succeeds", async () => {
    responders.download = () => jsonResponse({}, 422);
    const response = await makeWorker().fetch(post(guide, { id: "guide" }), env());
    assert.equal(response.status, 200);
    assert.deepEqual(await bodyOf(response), { ok: true, delivered: false });
  });

  test("it is sent when the Sheet failed but the notification arrived", async () => {
    responders.sheets = () => jsonResponse({}, 400);
    const response = await makeWorker().fetch(post(guide, { id: "guide" }), env());
    assert.equal(response.status, 200);
    assert.equal(called("download").length, 1);
    const mail = called("notify")[0]?.json as { text: string };
    assert.ok(mail.text.includes("NOT saved"));
  });

  test("it is sent when the notification failed but the Sheet saved", async () => {
    responders.notify = () => jsonResponse({}, 422);
    const response = await makeWorker().fetch(post(guide, { id: "guide" }), env());
    assert.equal(response.status, 200);
    assert.equal(called("download").length, 1);
  });

  test("nothing is sent when neither the save nor the notification worked", async () => {
    responders.sheets = () => jsonResponse({}, 400);
    responders.notify = () => jsonResponse({}, 422);
    const response = await makeWorker().fetch(post(guide, { id: "guide" }), env());
    assert.equal(response.status, 502);
    assert.equal(called("download").length, 0);
  });
});

describe("config_incomplete", () => {
  test("a missing site email refuses before any save or mail", async () => {
    const response = await makeWorker({ siteEmail: null }).fetch(post(quote), env());
    assert.equal(response.status, 502);
    assert.ok(logs.some((line) => line.includes("config_incomplete")));
    assert.equal(called("sheets").length + called("notify").length, 0);
  });

  test("the contact form's booking link is not needed: nothing in a form reads it", async () => {
    const response = await makeWorker().fetch(post(quote), env());
    assert.equal(response.status, 200);
  });
});

describe("development mode", () => {
  test("a dry run sends and saves nothing", async () => {
    responders.siteverify = () => jsonResponse({ success: true, hostname: "example.com" });
    const dev = createFormsWorker(buildWorkerConfig(BASE), FORMS);
    const response = await dev.fetch(post(guide, { id: "guide", host: "http://localhost:8787", origin: "http://localhost:8787" }), env({ SITE_ENV: "development" }));
    assert.equal(response.status, 200);
    assert.deepEqual(await bodyOf(response), { ok: true, delivered: true });
    assert.equal(called("sheets").length + called("notify").length + called("download").length, 0);
  });
});

describe("the /api dispatch (worker/api.ts)", () => {
  test("/api/forms/<id> goes to the forms route; the real registry has no form file but contact, so it is a 404", async () => {
    const response = await handleApi(post(quote), env());
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "not_found" });
    assert.equal(calls.length, 0);
  });

  test("/api/contact, other /api paths and /api/forms (no slash) are answered by the contact Worker as before", async () => {
    const other = await handleApi(new Request(`${ORIGIN}/api/other`), env());
    assert.equal(other.status, 404);
    assert.deepEqual(await other.json(), { error: "not_found" });
    const bare = await handleApi(new Request(`${ORIGIN}/api/forms`), env());
    assert.equal(bare.status, 404);
    const contact = await handleApi(new Request(`${ORIGIN}/api/contact`), env());
    assert.equal(contact.status, 405);
    assert.equal(contact.headers.get("allow"), "POST");
    assert.equal(calls.length, 0);
  });
});
