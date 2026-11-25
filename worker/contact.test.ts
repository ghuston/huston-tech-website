// Tests for the contact Worker, run with Node's built-in test runner (`npm run test:worker`). `fetch` is replaced by a
// recorder, so nothing reaches Turnstile, Resend or Google. A throwaway RSA key stands in for the service-account key.
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import worker from "./contact.ts";
import { providers } from "../src/content/providers.ts";
import type { ContactEnv } from "./env.ts";
import { resolveMode } from "./env.ts";
import { resetTokenCache, safeCell, signAssertion } from "./sheets.ts";
import { firstName } from "../src/lib/first-name.ts";
import { topicFromUrl } from "../src/content/contact-fields.ts";
import { validateContact } from "../src/lib/contact-validation.ts";
import { intakeMessage } from "./intake.ts";

type Call = { url: string; init: RequestInit; json: Record<string, unknown> | null };

const ORIGIN = "https://hustonlogic.com";
const INTAKE_SECRET = "intake-test-secret";
const VISITOR = { name: "Ada Lovelace", email: "ada@example.org", message: "Inquiries get lost between three inboxes." };

let calls: Call[] = [];
let logs: string[] = [];
let responders: Record<string, () => Response>;
const realFetch = globalThis.fetch;
const realLog = console.log;
let keyPair: CryptoKeyPair;
let serviceAccountKey = "";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function defaultResponders(): Record<string, () => Response> {
  return {
    siteverify: () => jsonResponse({ success: true, hostname: "hustonlogic.com", action: "contact" }),
    token: () => jsonResponse({ access_token: "test-access-token", expires_in: 3600 }),
    sheets: () => jsonResponse({ updates: { updatedRows: 1 } }),
    notify: () => jsonResponse({ id: "email-1" }),
    reply: () => jsonResponse({ id: "email-2" }),
    pipeline: () => jsonResponse({ ok: true }, 201),
  };
}

function route(url: string, init: RequestInit): string {
  if (url === "https://pipeline.hustonlogic.com/intake") return "pipeline";
  if (url.includes("turnstile/v0/siteverify")) return "siteverify";
  if (url.startsWith("https://oauth2.googleapis.com/token")) return "token";
  if (url.startsWith("https://sheets.googleapis.com/")) return "sheets";
  if (url === "https://api.resend.com/emails") {
    return String((init.headers as Record<string, string>)["idempotency-key"]).endsWith("-notify") ? "notify" : "reply";
  }
  throw new Error(`Unexpected fetch: ${url}`);
}

function toPem(der: ArrayBuffer): string {
  const base64 = Buffer.from(der).toString("base64").replace(/(.{64})/g, "$1\n");
  return `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----\n`;
}

function env(overrides: Partial<ContactEnv> = {}, allowed = true): ContactEnv {
  return {
    SITE_ENV: "production",
    RESEND_API_KEY: "re_test",
    TURNSTILE_SECRET_KEY: "turnstile-test-secret",
    GOOGLE_SERVICE_ACCOUNT_KEY: serviceAccountKey,
    GOOGLE_SHEET_ID: "sheet-123",
    CONTACT_RATE_LIMIT: { limit: async () => ({ success: allowed }) },
    ...overrides,
  };
}

function post(body: unknown, { origin = ORIGIN, contentType = "application/json", url = `${ORIGIN}/api/contact`, raw }: { origin?: string; contentType?: string; url?: string; raw?: string } = {}): Request {
  return new Request(url, {
    method: "POST",
    headers: { origin, "content-type": contentType, "sec-fetch-site": "same-origin", "cf-connecting-ip": "203.0.113.9" },
    body: raw ?? JSON.stringify(body),
  });
}

const valid = { need: "website", topic: "", name: VISITOR.name, email: VISITOR.email, business: "", message: VISITOR.message, tools: "", website: "", source: "Google", company_fax: "", turnstileToken: "token-abc" };

function called(kind: string): Call[] {
  return calls.filter((c) => route(c.url, c.init) === kind);
}

async function bodyOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

beforeEach(async () => {
  calls = [];
  logs = [];
  responders = defaultResponders();
  resetTokenCache();
  keyPair ??= (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  serviceAccountKey ||= JSON.stringify({ client_email: "writer@test.iam.gserviceaccount.com", private_key: toPem((await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)) as ArrayBuffer) });
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
  // No log line may ever hold what the visitor typed.
  for (const line of logs) {
    for (const secret of [VISITOR.name, VISITOR.email, VISITOR.message, "203.0.113.9", "re_test", "turnstile-test-secret", INTAKE_SECRET]) {
      assert.ok(!line.includes(secret), `log line leaked "${secret}": ${line}`);
    }
  }
});

describe("routing", () => {
  test("other paths are 404 and other methods are 405", async () => {
    assert.equal((await worker.fetch(new Request(`${ORIGIN}/api/other`), env())).status, 404);
    const get = await worker.fetch(new Request(`${ORIGIN}/api/contact`), env());
    assert.equal(get.status, 405);
    assert.equal(get.headers.get("allow"), "POST");
    assert.equal(get.headers.get("cache-control"), "no-store");
    assert.equal(calls.length, 0);
  });
});

describe("requests rejected before any outside call", () => {
  const cases: [string, () => Request, number, string][] = [
    ["another origin", () => post(valid, { origin: "https://evil.example" }), 403, "rejected"],
    ["form-encoded body", () => post(valid, { contentType: "application/x-www-form-urlencoded" }), 415, "rejected"],
    ["body over 16 KB", () => post({ ...valid, message: "x".repeat(17000) }), 413, "rejected"],
    ["broken JSON", () => post(null, { raw: "{" }), 400, "rejected"],
    ["unknown key", () => post({ ...valid, extra: "1" }), 400, "rejected"],
    ["filled honeypot", () => post({ ...valid, company_fax: "555-0100" }), 400, "rejected"],
    ["missing name", () => post({ ...valid, name: "  " }), 400, "invalid"],
    ["bad email", () => post({ ...valid, email: "ada@" }), 400, "invalid"],
    ["unknown need", () => post({ ...valid, need: "logo" }), 400, "rejected"],
    ["over-long business", () => post({ ...valid, business: "b".repeat(201) }), 400, "rejected"],
    ["missing token", () => post({ ...valid, turnstileToken: "" }), 403, "rejected"],
  ];
  for (const [label, request, status, error] of cases) {
    test(label, async () => {
      const response = await worker.fetch(request(), env());
      assert.equal(response.status, status);
      assert.equal((await bodyOf(response)).error, error);
      assert.equal(calls.length, 0);
    });
  }

  test("field errors name the fields", async () => {
    const response = await worker.fetch(post({ ...valid, need: "", name: "", email: "x", message: "" }), env());
    assert.deepEqual((await bodyOf(response)).fields, ["need", "name", "email", "message"]);
  });

  test("rate limited", async () => {
    const response = await worker.fetch(post(valid), env({}, false));
    assert.equal(response.status, 429);
    assert.equal((await bodyOf(response)).error, "rate_limited");
    assert.equal(calls.length, 0);
  });

  test("an unknown SITE_ENV fails closed", async () => {
    const response = await worker.fetch(post(valid), env({ SITE_ENV: "staging" }));
    assert.equal(response.status, 500);
    assert.equal(calls.length, 0);
  });
});

describe("Turnstile", () => {
  test("a failed check sends nothing", async () => {
    responders.siteverify = () => jsonResponse({ success: false, "error-codes": ["invalid-input-response"] });
    const response = await worker.fetch(post(valid), env());
    assert.equal(response.status, 403);
    assert.deepEqual(calls.map((c) => route(c.url, c.init)), ["siteverify"]);
  });

  test("a token from another hostname or action is refused", async () => {
    responders.siteverify = () => jsonResponse({ success: true, hostname: "other.example", action: "contact" });
    assert.equal((await worker.fetch(post(valid), env())).status, 403);
    responders.siteverify = () => jsonResponse({ success: true, hostname: "hustonlogic.com", action: "login" });
    assert.equal((await worker.fetch(post(valid), env())).status, 403);
    assert.ok(logs.some((l) => l.includes('"reason":"hostname_mismatch"')));
    assert.ok(logs.some((l) => l.includes('"reason":"action_mismatch"')));
  });

  test("a missing Turnstile secret is our failure (502), not the visitor's, and calls nothing", async () => {
    const response = await worker.fetch(post(valid), env({ TURNSTILE_SECRET_KEY: undefined }));
    assert.equal(response.status, 502);
    assert.equal((await bodyOf(response)).error, "failed");
    assert.equal(calls.length, 0);
    assert.ok(logs.some((l) => l.includes("turnstile_config_missing")));
  });

  test("a secret Cloudflare refuses, or an unreachable siteverify, is our failure (502)", async () => {
    responders.siteverify = () => jsonResponse({ success: false, "error-codes": ["invalid-input-secret"] });
    const refused = await worker.fetch(post(valid), env());
    assert.equal(refused.status, 502);
    assert.equal((await bodyOf(refused)).error, "failed");
    assert.ok(logs.some((l) => l.includes("turnstile_unavailable") && l.includes("invalid-input-secret")));
    responders.siteverify = () => jsonResponse({}, 500);
    assert.equal((await worker.fetch(post(valid), env())).status, 502);
    assert.deepEqual(calls.map((c) => route(c.url, c.init)), ["siteverify", "siteverify"]);
  });

  test("the secret, token and IP go to siteverify", async () => {
    await worker.fetch(post(valid), env());
    const [verify] = called("siteverify");
    assert.equal(verify.json?.secret, "turnstile-test-secret");
    assert.equal(verify.json?.response, "token-abc");
    assert.equal(verify.json?.remoteip, "203.0.113.9");
  });
});

describe("a good submission in production", () => {
  test("saves the row, emails Grant and sends the B7b auto-reply, all plain text", async () => {
    const response = await worker.fetch(post({ ...valid, business: "=HYPERLINK(\"x\")" }), env());
    assert.equal(response.status, 200);
    assert.deepEqual(await bodyOf(response), { ok: true, autoReply: true });

    const [append] = called("sheets");
    assert.match(append.url, /\/spreadsheets\/sheet-123\/values\/Submissions!A%3AK:append\?valueInputOption=RAW&insertDataOption=INSERT_ROWS$/);
    const row = (append.json?.values as string[][])[0];
    assert.equal(row.length, 11);
    assert.deepEqual(row.slice(1, 6), ["A website", "", VISITOR.name, VISITOR.email, "'=HYPERLINK(\"x\")"]);
    assert.equal(row[10], "production");

    const [notify] = called("notify");
    assert.deepEqual(notify.json?.to, ["grant@hustonlogic.com"]);
    assert.equal(notify.json?.from, "Huston Logic <grant@hustonlogic.com>");
    assert.equal(notify.json?.reply_to, VISITOR.email);
    assert.equal(notify.json?.subject, `New note: A website from ${VISITOR.name}`);
    assert.ok(String(notify.json?.text).includes("Sheet: saved"));
    assert.ok(String(notify.json?.text).includes(VISITOR.message));

    const [reply] = called("reply");
    assert.deepEqual(reply.json?.to, [VISITOR.email]);
    assert.equal(reply.json?.reply_to, "grant@hustonlogic.com");
    assert.equal(reply.json?.subject, "I got your note. Here's what happens next.");
    assert.ok(String(reply.json?.text).startsWith("Hi Ada,\n\nYou reached out!"));

    assert.ok(!("html" in (notify.json ?? {})), "the notification stays plain text");
    for (const email of [...called("notify"), ...called("reply")]) {
      assert.equal((email.init.headers as Record<string, string>).authorization, "Bearer re_test");
    }
  });

  describe("the automatic reply", () => {
    const BOOKING = providers.schedulerUrl as string;

    async function reply(overrides: Record<string, unknown> = {}, previewHost = false) {
      calls = [];
      if (previewHost) {
        const host = "feat-x-huston-site.acct.workers.dev";
        responders.siteverify = () => jsonResponse({ success: true, hostname: host, action: "contact" });
        await worker.fetch(post({ ...valid, ...overrides }, { origin: `https://${host}`, url: `https://${host}/api/contact` }), env({ SITE_ENV: "preview" }));
      } else {
        await worker.fetch(post({ ...valid, ...overrides }), env());
      }
      return called("reply")[0].json as Record<string, unknown>;
    }

    test("From, Reply-To and the two auto-responder headers", async () => {
      const r = await reply();
      assert.equal(r.from, "Grant Huston <grant@hustonlogic.com>");
      assert.equal(r.reply_to, "grant@hustonlogic.com");
      assert.deepEqual(r.headers, { "Auto-Submitted": "auto-replied", "X-Auto-Response-Suppress": "All" });
      assert.equal(called("notify")[0].json?.from, "Huston Logic <grant@hustonlogic.com>");
      assert.ok(!("headers" in (called("notify")[0].json ?? {})));
    });

    test("multipart: the HTML and the text carry the same words", async () => {
      const r = await reply();
      const text = String(r.text);
      const html = String(r.html);
      const stripped = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&rarr;/g, "→").replace(/&ldquo;|&rdquo;/g, '"').replace(/&rsquo;/g, "'").replace(/&#39;/g, "'").replace(/\s+/g, " ");
      for (const phrase of ["Hi Ada,", "You reached out! That's the first step", "(Consider this the demo!)", "write back within one business day.", "Talk soon,", "Founder, Huston Logic", "Please leave out passwords and client details."]) {
        assert.ok(text.includes(phrase), `text has: ${phrase}`);
        assert.ok(stripped.includes(phrase), `html has: ${phrase}`);
      }
      assert.ok(text.includes('Changed your mind? Reply "no thanks" and I won\'t write again.'));
      assert.ok(html.includes("Reply &ldquo;no thanks&rdquo; and I won&rsquo;t write again."));
      assert.ok(html.startsWith("<div"));
      assert.ok(!/<img|<script|<button|pixel|utm_/i.test(html), "no images, scripts, buttons or tracking");
    });

    test("the booking link is the config URL: own line in text, link text in HTML, and in the signature", async () => {
      const r = await reply();
      const lines = String(r.text).split("\n");
      const at = lines.indexOf("If you'd rather talk, pick a time for a free 20-minute call.");
      assert.ok(at >= 0);
      assert.equal(lines[at + 1], BOOKING);
      assert.ok(lines.includes(`Book a free 20-minute call: ${BOOKING}`));
      const html = String(r.html);
      assert.ok(html.includes(`<a href="${BOOKING}" style="color:#2B6455;">pick a time for a free 20-minute call</a>`));
      assert.ok(html.includes(`<a href="${BOOKING}" style="color:#2B6455;text-decoration:none;font-weight:bold;">Book a free 20-minute call &rarr;</a>`));
      assert.equal(html.split(BOOKING).length - 1, 2, "no bare URL in the HTML");
      assert.ok(!html.includes("{bookingUrl}") && !String(r.text).includes("{bookingUrl}"));
    });

    test("the booking link is the same in preview and never built from the request origin", async () => {
      const r = await reply({}, true);
      assert.ok(String(r.text).includes(BOOKING));
      assert.ok(String(r.html).includes(BOOKING));
      assert.ok(!String(r.html).includes("workers.dev") && !String(r.text).includes("workers.dev"));
    });

    test("a name that isn't a plain first name gets 'Hi there,' in both versions", async () => {
      for (const name of ["www.example.com/buy now", "J. Smith", "A".repeat(31), "<b>x</b>", "R2D2"]) {
        const r = await reply({ name });
        assert.ok(String(r.text).startsWith("Hi there,\n\n"), `text: ${name}`);
        assert.ok(String(r.html).includes(">Hi there,</p>"), `html: ${name}`);
      }
      const ok = await reply({ name: "  Mary-Anne O'Neil " });
      assert.ok(String(ok.text).startsWith("Hi Mary-Anne,\n\n"));
    });

    test("nothing else the visitor typed appears in the email", async () => {
      const r = await reply({ business: "Acme Plumbing", tools: "QuickBooks", website: "https://acme.example", message: "Secret message body 123" });
      for (const part of [String(r.text), String(r.html), String(r.subject)]) {
        for (const typed of ["Lovelace", VISITOR.email, "Acme Plumbing", "QuickBooks", "acme.example", "Secret message body 123"]) {
          assert.ok(!part.includes(typed), `leaked: ${typed}`);
        }
      }
    });
  });

  test('topic "workflow" is accepted and stored as "system"', async () => {
    const response = await worker.fetch(post({ ...valid, topic: "workflow" }), env());
    assert.equal(response.status, 200);
    const row = (called("sheets")[0].json?.values as string[][])[0];
    assert.equal(row[2], "system");
  });

  test('need "workflow" is accepted and labelled "An AI system for my business"', async () => {
    const response = await worker.fetch(post({ ...valid, need: "workflow" }), env());
    assert.equal(response.status, 200);
    assert.equal(called("notify")[0].json?.subject, `New note: An AI system for my business from ${VISITOR.name}`);
  });

  test('topic "partner" is rejected as malformed (400)', async () => {
    const response = await worker.fetch(post({ ...valid, need: "", topic: "partner" }), env());
    assert.equal(response.status, 400);
    assert.equal(called("notify").length, 0);
  });

  test("need is required even when topic is set", async () => {
    const response = await worker.fetch(post({ ...valid, need: "", topic: "system" }), env());
    assert.equal(response.status, 400);
    assert.deepEqual((await bodyOf(response)).fields, ["need"]);
  });

  test("a name that isn't a name gets no greeting name", async () => {
    await worker.fetch(post({ ...valid, name: "www.example.com/buy now" }), env());
    assert.ok(String(called("reply")[0].json?.text).startsWith("Hi there,"));
  });

  test("the service-account JWT is RS256 and verifies with the public key", async () => {
    const account = JSON.parse(serviceAccountKey) as { client_email: string; private_key: string };
    const jwt = await signAssertion(account, 1_700_000_000);
    const [header, claims, signature] = jwt.split(".");
    const decode = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>;
    assert.deepEqual(decode(header), { alg: "RS256", typ: "JWT" });
    assert.deepEqual(decode(claims), {
      iss: "writer@test.iam.gserviceaccount.com",
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    });
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", keyPair.publicKey, Buffer.from(signature, "base64url"), new TextEncoder().encode(`${header}.${claims}`));
    assert.ok(ok);
  });
});

describe("preview mode", () => {
  test("mail goes only to the site's address and the row goes to the Preview tab", async () => {
    const response = await worker.fetch(post(valid, { origin: "https://feat-x-huston-site.acct.workers.dev", url: "https://feat-x-huston-site.acct.workers.dev/api/contact" }), env({ SITE_ENV: "preview" }));
    assert.equal(response.status, 403, "the token's hostname must match the preview host");

    responders.siteverify = () => jsonResponse({ success: true, hostname: "feat-x-huston-site.acct.workers.dev", action: "contact" });
    calls = [];
    const ok = await worker.fetch(post(valid, { origin: "https://feat-x-huston-site.acct.workers.dev", url: "https://feat-x-huston-site.acct.workers.dev/api/contact" }), env({ SITE_ENV: "preview" }));
    assert.equal(ok.status, 200);
    assert.match(called("sheets")[0].url, /values\/Preview!A%3AK:append/);
    assert.ok(String(called("notify")[0].json?.subject).startsWith("[Preview] New note:"));
    const [reply] = called("reply");
    assert.deepEqual(reply.json?.to, ["grant@hustonlogic.com"]);
    assert.equal(reply.json?.subject, `[Preview → would go to ${VISITOR.email}] I got your note. Here's what happens next.`);
  });

  test("a workers.dev branch host counts as a preview even if SITE_ENV says production", () => {
    assert.equal(resolveMode("production", "feat-x-huston-site.acct.workers.dev"), "preview");
    assert.equal(resolveMode("production", "huston-site.acct.workers.dev"), "production");
    assert.equal(resolveMode("production", "hustonlogic.com"), "production");
    assert.equal(resolveMode("development", "hustonlogic.com"), null);
    assert.equal(resolveMode("development", "localhost"), "development");
    assert.equal(resolveMode(undefined, "hustonlogic.com"), null);
  });
});

describe("development mode", () => {
  test("verifies Turnstile with test keys, then sends nothing", async () => {
    responders.siteverify = () => jsonResponse({ success: true, hostname: "example.com" });
    const response = await worker.fetch(post(valid, { origin: "http://localhost:8787", url: "http://localhost:8787/api/contact" }), env({ SITE_ENV: "development" }));
    assert.equal(response.status, 200);
    assert.deepEqual(calls.map((c) => route(c.url, c.init)), ["siteverify"]);
  });
});

describe("failures", () => {
  test("Sheet fails, email works: success, and the email says to add the row by hand", async () => {
    responders.sheets = () => jsonResponse({ error: "forbidden" }, 403);
    const response = await worker.fetch(post(valid), env());
    assert.equal(response.status, 200);
    assert.equal(called("sheets").length, 1, "a 403 is not retried");
    assert.ok(String(called("notify")[0].json?.text).includes("Sheet: NOT saved - add this one by hand"));
    assert.ok(logs.some((line) => line.includes("sheet_append_failed")));
  });

  test("Sheet works, email fails: still success (the row is real), and it is logged", async () => {
    responders.notify = () => jsonResponse({ name: "internal_server_error" }, 500);
    const response = await worker.fetch(post(valid), env());
    assert.equal(response.status, 200);
    assert.equal(called("notify").length, 2, "a 500 is retried once");
    assert.ok(logs.some((line) => line.includes("notify_failed_sheet_saved")));
  });

  test("both fail: 502 and no auto-reply", async () => {
    responders.sheets = () => jsonResponse({}, 503);
    responders.notify = () => jsonResponse({}, 503);
    const response = await worker.fetch(post(valid), env());
    assert.equal(response.status, 502);
    assert.equal((await bodyOf(response)).error, "failed");
    assert.equal(called("reply").length, 0);
  });

  test("missing secrets fail cleanly with 502, never a success", async () => {
    const response = await worker.fetch(post(valid), env({ RESEND_API_KEY: undefined, GOOGLE_SERVICE_ACCOUNT_KEY: undefined }));
    assert.equal(response.status, 502);
  });

  test("auto-reply fails: success with autoReply false", async () => {
    responders.reply = () => jsonResponse({ name: "validation_error" }, 422);
    const response = await worker.fetch(post(valid), env());
    assert.deepEqual(await bodyOf(response), { ok: true, autoReply: false });
  });

  test("retries reuse the idempotency key", async () => {
    let first = true;
    responders.notify = () => {
      const response = first ? jsonResponse({}, 429) : jsonResponse({ id: "ok" });
      first = false;
      return response;
    };
    await worker.fetch(post(valid), env());
    const keys = called("notify").map((c) => (c.init.headers as Record<string, string>)["idempotency-key"]);
    assert.equal(keys.length, 2);
    assert.equal(keys[0], keys[1]);
  });
});

describe("the Pipeline app", () => {
  const withApp = () => env({ INTAKE_SECRET });
  const PIPELINE_URL = "https://pipeline.hustonlogic.com/intake";
  const notifyText = () => String(called("notify")[0].json?.text);

  test("without INTAKE_SECRET the app is never called and the Sheet is used", async () => {
    const response = await worker.fetch(post(valid), env());
    assert.equal(response.status, 200);
    assert.equal(called("pipeline").length, 0);
    assert.equal(called("sheets").length, 1);
    assert.ok(notifyText().includes("Saved to: the Google Sheet"));
    assert.ok(notifyText().includes("Pipeline app: not connected yet"));
  });

  test("with the secret, the app gets the lead server to server and the Sheet is skipped", async () => {
    const response = await worker.fetch(post({ ...valid, business: "Acme", tools: "QuickBooks", website: "https://acme.example", topic: "system" }), withApp());
    assert.deepEqual(await bodyOf(response), { ok: true, autoReply: true });
    const [intake] = called("pipeline");
    assert.equal(intake.url, PIPELINE_URL);
    assert.equal(intake.init.method, "POST");
    const headers = intake.init.headers as Record<string, string>;
    assert.equal(headers["x-intake-secret"], INTAKE_SECRET);
    assert.equal(headers["content-type"], "application/json");
    assert.deepEqual(Object.keys(intake.json ?? {}).sort(), ["business", "email", "message", "name", "source"]);
    assert.equal(intake.json?.name, VISITOR.name);
    assert.equal(intake.json?.email, VISITOR.email);
    assert.equal(intake.json?.business, "Acme");
    assert.equal(intake.json?.source, "hustonlogic.com contact form");
    const message = String(intake.json?.message);
    for (const line of ["Need: A website", "Topic link: system", "Uses today: QuickBooks", "Current website: https://acme.example", "Heard about Huston Logic: Google"]) {
      assert.ok(message.includes(line), line);
    }
    assert.ok(message.endsWith(VISITOR.message));
    assert.equal(called("sheets").length, 0);
    assert.ok(notifyText().includes("Saved to: the Pipeline app"));
    assert.ok(!notifyText().includes("NOT saved"));
    assert.ok(!JSON.stringify(called("notify")[0].json).includes(INTAKE_SECRET));
  });

  test("a repeat (200) counts as saved", async () => {
    responders.pipeline = () => jsonResponse({ ok: true }, 200);
    await worker.fetch(post(valid), withApp());
    assert.equal(called("sheets").length, 0);
    assert.ok(notifyText().includes("Saved to: the Pipeline app"));
  });

  test("a 500 from the app is retried once, then the Sheet takes it and the email says so", async () => {
    responders.pipeline = () => jsonResponse({ ok: false }, 500);
    const response = await worker.fetch(post(valid), withApp());
    assert.equal(response.status, 200);
    assert.equal(called("pipeline").length, 2);
    assert.equal(called("sheets").length, 1);
    assert.ok(notifyText().includes("Saved to: the Google Sheet (the Pipeline app did not take it)"));
    assert.ok(notifyText().includes("Sheet: saved"));
    assert.ok(logs.some((l) => l.includes("intake_failed")));
  });

  test("a 401 (wrong secret) is not retried and falls back to the Sheet", async () => {
    responders.pipeline = () => jsonResponse({ ok: false, error: "unauthorized" }, 401);
    const response = await worker.fetch(post(valid), withApp());
    assert.equal(response.status, 200);
    assert.equal(called("pipeline").length, 1);
    assert.equal(called("sheets").length, 1);
  });

  test("a redirect from the app is never followed (the secret and lead stay put) and counts as a failure", async () => {
    responders.pipeline = () => new Response(null, { status: 307, headers: { location: "https://elsewhere.example/intake" } });
    const response = await worker.fetch(post(valid), withApp());
    assert.equal(response.status, 200);
    assert.equal(called("pipeline").length, 1, "a 3xx is not retried");
    assert.equal(called("pipeline")[0].init.redirect, "manual");
    assert.equal(called("sheets").length, 1);
    assert.ok(notifyText().includes("Saved to: the Google Sheet (the Pipeline app did not take it)"));
  });

  test("an unreachable app falls back to the Sheet", async () => {
    responders.pipeline = () => {
      throw new TypeError("network down");
    };
    const response = await worker.fetch(post(valid), withApp());
    assert.equal(response.status, 200);
    assert.equal(called("sheets").length, 1);
    assert.ok(logs.some((l) => l.includes("intake_unreachable")));
  });

  test("app and Sheet both fail but the email works: success, and the email says to add it by hand", async () => {
    responders.pipeline = () => jsonResponse({}, 401);
    responders.sheets = () => jsonResponse({}, 403);
    const response = await worker.fetch(post(valid), withApp());
    assert.equal(response.status, 200);
    assert.ok(notifyText().includes("Saved to: NOWHERE - add this one by hand"));
    assert.ok(notifyText().includes("Sheet: NOT saved - add this one by hand"));
  });

  test("app, Sheet and email all fail: 502 and no automatic reply", async () => {
    responders.pipeline = () => jsonResponse({}, 503);
    responders.sheets = () => jsonResponse({}, 503);
    responders.notify = () => jsonResponse({}, 503);
    const response = await worker.fetch(post(valid), withApp());
    assert.equal(response.status, 502);
    assert.equal(called("reply").length, 0);
  });

  test("app saved, email failed: still success (the lead is real)", async () => {
    responders.notify = () => jsonResponse({}, 503);
    const response = await worker.fetch(post(valid), withApp());
    assert.equal(response.status, 200);
    assert.equal(called("sheets").length, 0);
    assert.ok(logs.some((l) => l.includes("notify_failed_app_saved")));
  });

  test("preview never calls the production app and keeps using the Preview tab", async () => {
    const host = "feat-x-huston-site.acct.workers.dev";
    responders.siteverify = () => jsonResponse({ success: true, hostname: host, action: "contact" });
    const response = await worker.fetch(post(valid, { origin: `https://${host}`, url: `https://${host}/api/contact` }), env({ SITE_ENV: "preview", INTAKE_SECRET }));
    assert.equal(response.status, 200);
    assert.equal(called("pipeline").length, 0);
    assert.match(called("sheets")[0].url, /values\/Preview!A%3AK:append/);
  });

  test("the app message is labelled, skips empty fields and stays within 5,000 characters", () => {
    const base = { need: "website" as const, topic: "" as const, name: "Ada", email: "ada@example.org", business: "", tools: "", website: "", source: "" };
    const short = intakeMessage({ ...base, message: "Hello" });
    assert.equal(short, "Need: A website\n\nHello");
    const long = intakeMessage({ ...base, tools: "t".repeat(500), website: "w".repeat(300), source: "Google", message: "m".repeat(5000) });
    assert.ok(long.length <= 5000);
    assert.ok(long.startsWith("Need: A website\nUses today: "));
    assert.ok(long.endsWith("…"));
  });
});

describe("shared helpers", () => {
  test("firstName", () => {
    assert.equal(firstName("  Grant Huston "), "Grant");
    assert.equal(firstName("Zoë"), "Zoë");
    assert.equal(firstName("O'Neil-Smith"), "O'Neil-Smith");
    assert.equal(firstName("J. Smith"), "J.");
    assert.equal(firstName("spam.com"), "");
    assert.equal(firstName("http://x"), "");
    assert.equal(firstName("R2D2"), "");
    assert.equal(firstName(""), "");
  });

  test("topicFromUrl maps the old and invalid topics", () => {
    assert.equal(topicFromUrl("workflow"), "system");
    assert.equal(topicFromUrl("partner"), "");
    assert.equal(topicFromUrl(null), "");
    assert.equal(topicFromUrl("website"), "website");
    assert.equal(topicFromUrl("system"), "system");
  });

  test("safeCell", () => {
    assert.equal(safeCell("=1+1"), "'=1+1");
    assert.equal(safeCell("+1 555"), "'+1 555");
    assert.equal(safeCell("@here"), "'@here");
    assert.equal(safeCell("plain"), "plain");
  });

  test("validateContact cleans text the way the form expects", () => {
    const result = validateContact({ need: "both", name: " Ada\nLovelace ", email: " ada@example.org ", message: "Line one\r\nLine two\u0007" });
    assert.ok(result.ok);
    if (result.ok) {
      assert.equal(result.value.name, "Ada Lovelace");
      assert.equal(result.value.email, "ada@example.org");
      assert.equal(result.value.message, "Line one\nLine two");
    }
  });
});
