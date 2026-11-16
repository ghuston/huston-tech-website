// Tests for the contact Worker, run with Node's built-in test runner (`npm run test:worker`). `fetch` is replaced by a
// recorder, so nothing reaches Turnstile, Resend or Google. A throwaway RSA key stands in for the service-account key.
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import worker from "./contact.ts";
import type { ContactEnv } from "./env.ts";
import { resolveMode } from "./env.ts";
import { resetTokenCache, safeCell, signAssertion } from "./sheets.ts";
import { firstName } from "../src/lib/first-name.ts";
import { validateContact } from "../src/lib/contact-validation.ts";

type Call = { url: string; init: RequestInit; json: Record<string, unknown> | null };

const ORIGIN = "https://hustonlogic.com";
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
  };
}

function route(url: string, init: RequestInit): string {
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
    for (const secret of [VISITOR.name, VISITOR.email, VISITOR.message, "203.0.113.9", "re_test", "turnstile-test-secret"]) {
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
    assert.deepEqual(notify.json?.to, ["info@hustonlogic.com"]);
    assert.equal(notify.json?.from, "Huston Logic <info@hustonlogic.com>");
    assert.equal(notify.json?.reply_to, VISITOR.email);
    assert.equal(notify.json?.subject, `New note: A website from ${VISITOR.name}`);
    assert.ok(String(notify.json?.text).includes("Sheet: saved"));
    assert.ok(String(notify.json?.text).includes(VISITOR.message));

    const [reply] = called("reply");
    assert.deepEqual(reply.json?.to, [VISITOR.email]);
    assert.equal(reply.json?.reply_to, "info@hustonlogic.com");
    assert.equal(reply.json?.subject, "Got it, thanks");
    assert.equal(
      reply.json?.text,
      "Hi Ada, your note reached me. I read every message myself and will reply within one business day. If it's easier to talk, you can pick a time here: https://calendar.app.google/ZEcZAf9NdPn59i579.\n\n— Grant, Huston Logic",
    );
    assert.ok(!String(reply.json?.text).includes(VISITOR.message), "the auto-reply never echoes the message");

    for (const email of [...called("notify"), ...called("reply")]) {
      assert.ok(!("html" in (email.json ?? {})), "emails are plain text only");
      assert.equal((email.init.headers as Record<string, string>).authorization, "Bearer re_test");
    }
  });

  test("the partner variant needs no need field", async () => {
    const response = await worker.fetch(post({ ...valid, need: "", topic: "partner" }), env());
    assert.equal(response.status, 200);
    assert.equal(called("notify")[0].json?.subject, `New note: Zoho partner from ${VISITOR.name}`);
  });

  test("a name that isn't a name gets no greeting name", async () => {
    await worker.fetch(post({ ...valid, name: "www.example.com/buy now" }), env());
    assert.ok(String(called("reply")[0].json?.text).startsWith("Hi, your note reached me."));
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
    assert.deepEqual(reply.json?.to, ["info@hustonlogic.com"]);
    assert.equal(reply.json?.subject, `[Preview → would go to ${VISITOR.email}] Got it, thanks`);
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
