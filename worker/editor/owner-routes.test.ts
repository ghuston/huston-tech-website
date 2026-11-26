import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { resetAccessKeyCache } from "./access.ts";
import { ownerKey } from "./owner-id.ts";
import { handleOwner, type OAuthHelpersLike, type OwnerContext } from "./owner-routes.ts";
import type { ChangeView, ProposalView, ThemeColors } from "./owner-page.ts";
import { makeTestEditor, testEditorConfig } from "./test-support.ts";
import type { Editor, ToolResult } from "./types.ts";

const TEAM = "example-team.cloudflareaccess.com";
const AUD = "aud-tag-0123456789abcdef";
const SITE = "https://example.test";
const THEME: ThemeColors = { white: "#ffffff", ink: "#1c1917", ink2: "#44403c", silver: "#f5f5f4", silver2: "#e7e5e4", green: "#1e4fa3", greenDeep: "#173b7a", rust: "#9a3412", line: "#d6d3d1", tint: "#e8eefa" };
const RS256 = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) } as const;
const b64json = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

const pair = (await crypto.subtle.generateKey(RS256, true, ["sign", "verify"])) as CryptoKeyPair;
const jwk = { ...((await crypto.subtle.exportKey("jwk", pair.publicKey)) as JsonWebKey), kid: "k1", use: "sig", alg: "RS256" };
const accessFetch = (async () => Response.json({ keys: [jwk] })) as typeof fetch;

async function token(email: string): Promise<string> {
  const head = b64json({ alg: "RS256", typ: "JWT", kid: "k1" });
  const now = Date.now() / 1000;
  const body = b64json({ iss: `https://${TEAM}`, aud: [AUD], email, nbf: now - 10, exp: now + 600 });
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${Buffer.from(sig).toString("base64url")}`;
}

const result = <T>(text: string, data: T, isError?: boolean): ToolResult<T> => ({ text, data, ...(isError ? { isError } : {}) });

interface Fake {
  editor: Editor;
  calls: string[];
  waiting: ToolResult<ProposalView[]>;
  recent: ToolResult<ChangeView[]>;
  undo: ToolResult;
}

function fakeEditor(): Fake {
  const state: Fake = {
    calls: [],
    waiting: result("", [{ id: "p1", summary: "Update the hours", createdAt: "2026-01-01T12:00:00.000Z", changeList: "Page /about: hours change", previewLink: "https://preview.example.test", uploads: [] }]),
    recent: result("", [{ change: 12, title: "Update hours", state: "live", publishedAt: "2026-01-01T10:00:00.000Z", liveAt: "2026-01-01T10:05:00.000Z" }]),
    undo: result("Proposal p9: Withdraw", { proposal_id: "p9" }),
    editor: undefined as unknown as Editor,
  };
  const note = (name: string) => state.calls.push(name);
  state.editor = {
    waiting: async () => (note("waiting"), state.waiting),
    recent: async () => (note("recent"), state.recent),
    uploads: async () => (note("uploads"), result("Uploads aren't set up on this site yet.", [], true)),
    publish: async (id: string, words: string) => (note(`publish:${id}:${words}`), result("Change 13 was opened.", {})),
    discard: async (id: string) => (note(`discard:${id}`), result("Proposal discarded.", {})),
    undo: async (n: number) => (note(`undo:${n}`), state.undo),
  } as unknown as Editor;
  return state;
}

interface OAuthFake {
  oauth: OAuthHelpersLike;
  calls: string[];
  fail: { value: boolean };
}

function fakeOAuth(overrides: { redirectUri?: string; loopback?: boolean; clientName?: string } = {}): OAuthFake {
  const calls: string[] = [];
  const fail = { value: false };
  const authRequest = { scope: ["editor"], clientId: "c1" };
  const oauth: OAuthHelpersLike = {
    parseAuthRequest: async () => (fail.value ? Promise.reject(new Error("bad")) : authRequest),
    describeConsent: async () => ({
      clientName: overrides.clientName ?? "Claude",
      redirectUri: overrides.redirectUri ?? "https://claude.ai/api/mcp/auth_callback",
      redirectHost: new URL(overrides.redirectUri ?? "https://claude.ai/api/mcp/auth_callback").hostname,
      redirectIsLoopback: overrides.loopback ?? false,
    }),
    beginConsent: async () => ({ handle: "h-123", headers: new Headers({ "set-cookie": "__Host-consent=abc; Secure" }) }),
    approveConsent: async (_r, handle) => {
      calls.push(`approve:${handle}`);
      if (fail.value) throw new Error("used");
      return { request: authRequest, headers: new Headers({ "set-cookie": "cleared=1" }) };
    },
    denyConsent: async (_r, handle) => {
      calls.push(`deny:${handle}`);
      if (fail.value) throw new Error("used");
      return { request: authRequest, redirectTo: "https://claude.ai/cb?error=access_denied", headers: new Headers({ "set-cookie": "denied=1" }) };
    },
    completeAuthorization: async (options) => {
      calls.push(`complete:${options.userId}:${JSON.stringify(options.metadata)}:${JSON.stringify(options.props)}`);
      return { redirectTo: "https://claude.ai/cb?code=xyz" };
    },
  };
  return { oauth, calls, fail };
}

function context(editor: Editor, oauth: OAuthHelpersLike, extra: Partial<OwnerContext> = {}): OwnerContext {
  return { editor, config: testEditorConfig({ access: { teamDomain: TEAM, aud: AUD } }), oauth, theme: THEME, fetch: accessFetch, ...extra };
}

async function call(ctx: OwnerContext, path: string, init: { method?: string; form?: Record<string, string>; headers?: Record<string, string>; email?: string | null } = {}): Promise<Response> {
  const headers: Record<string, string> = { ...(init.headers ?? {}) };
  if (init.email !== null) headers["Cf-Access-Jwt-Assertion"] = await token(init.email ?? "owner@example.test");
  let body: string | undefined;
  if (init.form) {
    body = new URLSearchParams(init.form).toString();
    headers["content-type"] ??= "application/x-www-form-urlencoded";
    headers.origin ??= SITE;
  }
  return handleOwner(new Request(`${SITE}${path}`, { method: init.method ?? (init.form ? "POST" : "GET"), headers, ...(body !== undefined ? { body } : {}) }), ctx);
}

beforeEach(() => resetAccessKeyCache());

test("every route needs the signed-in owner", async () => {
  const fake = fakeEditor();
  const ctx = context(fake.editor, fakeOAuth().oauth);
  for (const [path, method] of [["/owner", "GET"], ["/owner/publish?proposal=p1", "GET"], ["/owner/connect", "GET"], ["/owner/undo", "POST"], ["/owner/publish", "POST"], ["/owner/discard", "POST"], ["/owner/connect", "POST"]] as const) {
    assert.equal((await call(ctx, path, { method, email: null })).status, 401, `${method} ${path} without a token`);
    assert.equal((await call(ctx, path, { method, email: "stranger@example.test" })).status, 403, `${method} ${path} for a stranger`);
  }
  assert.deepEqual(fake.calls, []);
});

test("the home page renders from data, with the exact security headers, and a GET changes nothing", async () => {
  const fake = fakeEditor();
  const response = await call(context(fake.editor, fakeOAuth().oauth), "/owner");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(
    response.headers.get("content-security-policy"),
    "default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  );
  const page = await response.text();
  assert.doesNotMatch(page, /<script/, "no script tag while uploads are not set up");
  assert.match(page, /Uploads aren't set up on this site yet\./);
  assert.match(page, /Update the hours/);
  assert.match(page, /Change 12: Update hours/);
  assert.match(page, /owner@example\.test/);
  assert.deepEqual(fake.calls.sort(), ["recent", "uploads", "waiting"]);
});

test("a chunked POST body over 8 KB with no Content-Length is refused without being read whole", async () => {
  const ctx = context(fakeEditor().editor, fakeOAuth().oauth);
  let pulled = 0;
  const chunk = new TextEncoder().encode(`proposal=${"x".repeat(1023)}`);
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulled += 1;
      if (pulled > 1000) return controller.close();
      controller.enqueue(chunk);
    },
  });
  const request = new Request(`${SITE}/owner/publish`, {
    method: "POST",
    headers: { "Cf-Access-Jwt-Assertion": await token("owner@example.test"), "content-type": "application/x-www-form-urlencoded", origin: SITE },
    body,
    duplex: "half",
  } as RequestInit);
  assert.equal(request.headers.get("content-length"), null);
  const response = await handleOwner(request, ctx);
  assert.equal(response.status, 403);
  assert.ok(pulled < 20, `read ${pulled} chunks`);
});

test("home page with nothing shows the empty states (real editor)", async () => {
  const { editor } = makeTestEditor();
  const page = await (await call(context(editor, fakeOAuth().oauth), "/owner")).text();
  assert.match(page, /Nothing is waiting\./);
  assert.match(page, /No changes yet\./);
});

test("rate limit: keyed by the owner hash, and a refusal is 429", async () => {
  const keys: string[] = [];
  const ok = context(fakeEditor().editor, fakeOAuth().oauth, { rateLimit: { limit: async ({ key }) => (keys.push(key), { success: true }) } });
  assert.equal((await call(ok, "/owner")).status, 200);
  assert.deepEqual(keys, [`user:${await ownerKey("owner@example.test")}`]);
  const limited = context(fakeEditor().editor, fakeOAuth().oauth, { rateLimit: { limit: async () => ({ success: false }) } });
  assert.equal((await call(limited, "/owner")).status, 429);
});

test("unknown path is 404 and a wrong method is 405", async () => {
  const ctx = context(fakeEditor().editor, fakeOAuth().oauth);
  assert.equal((await call(ctx, "/owner/nothing")).status, 404);
  assert.equal((await call(ctx, "/owner", { method: "POST", form: { a: "b" } })).status, 405);
  assert.equal((await call(ctx, "/owner/undo")).status, 405);
  assert.equal((await call(ctx, "/owner/discard", { method: "DELETE" })).status, 405);
});

test("a POST needs the site's own Origin, a same-origin fetch, a form body and at most 8 KB", async () => {
  const fake = fakeEditor();
  const ctx = context(fake.editor, fakeOAuth().oauth);
  const form = { proposal: "p1" };
  const forbidden = async (init: Parameters<typeof call>[2]) => {
    const response = await call(ctx, "/owner/publish", init);
    assert.equal(response.status, 403);
    assert.match(await response.text(), /That form didn&#39;t come from this page\./);
  };
  await forbidden({ form, headers: { origin: "https://evil.test" } });
  await forbidden({ form, headers: { "sec-fetch-site": "cross-site" } });
  await forbidden({ form, headers: { "content-type": "application/json" } });
  await forbidden({ form: { proposal: "x".repeat(9000) } });
  const noOrigin = await handleOwner(
    new Request(`${SITE}/owner/publish`, { method: "POST", headers: { "Cf-Access-Jwt-Assertion": await token("owner@example.test"), "content-type": "application/x-www-form-urlencoded" }, body: "proposal=p1" }),
    ctx,
  );
  assert.equal(noOrigin.status, 403);
  assert.deepEqual(fake.calls, []);
  assert.equal((await call(ctx, "/owner/publish", { form, headers: { "sec-fetch-site": "same-origin" } })).status, 200);
});

test("Publish and Undo go through a confirm page: GETs never act, the confirm page shows the list and two forms", async () => {
  const fake = fakeEditor();
  const ctx = context(fake.editor, fakeOAuth().oauth);
  const page = await (await call(ctx, "/owner/publish?proposal=p1")).text();
  assert.match(page, /<h1>Publish this change\?<\/h1>/);
  assert.match(page, /Page \/about: hours change/);
  assert.match(page, /action="\/owner\/publish"/);
  assert.match(page, /action="\/owner\/discard"/);
  assert.equal((await call(ctx, "/owner/publish?proposal=missing")).status, 404);
  assert.deepEqual(fake.calls, ["waiting", "waiting"]);

  const undo = await call(ctx, "/owner/undo", { form: { change: "12" } });
  assert.equal(undo.status, 303);
  assert.equal(undo.headers.get("location"), "/owner/publish?proposal=p9");
  assert.ok(!fake.calls.some((c) => c.startsWith("publish")), "undo only prepares the proposal");

  fake.undo = result("Change 12 can't be undone.", {}, true);
  const failed = await call(ctx, "/owner/undo", { form: { change: "12" } });
  assert.equal(failed.status, 400);
  assert.match(await failed.text(), /Change 12 can&#39;t be undone\./);
});

test("Publish passes the owner's approval wording; Discard discards", async () => {
  const fake = fakeEditor();
  const ctx = context(fake.editor, fakeOAuth().oauth);
  const published = await call(ctx, "/owner/publish", { form: { proposal: "p1" } });
  assert.equal(published.status, 200);
  assert.match(await published.text(), /Change 13 was opened\./);
  await call(ctx, "/owner/discard", { form: { proposal: "p1" } });
  assert.deepEqual(fake.calls, ["publish:p1:Approved on the owner page by the signed-in owner.", "discard:p1"]);
});

test("text from the owner's own proposals is escaped", async () => {
  const fake = fakeEditor();
  fake.waiting = result("", [{ id: "p1", summary: "<img src=x onerror=alert(1)>", createdAt: "2026-01-01T12:00:00.000Z", changeList: "<script>alert(2)</script>", previewLink: null, uploads: [] }]);
  const ctx = context(fake.editor, fakeOAuth().oauth);
  for (const path of ["/owner", "/owner/publish?proposal=p1"]) {
    const page = await (await call(ctx, path)).text();
    assert.ok(!page.includes("<img src=x"), path);
    assert.ok(!page.includes("<script>alert"), path);
    assert.match(page, /&lt;img src=x onerror=alert\(1\)&gt;/);
  }
});

test("consent page shows the client name and redirect host, and sends the library's headers", async () => {
  const fake = fakeOAuth({ clientName: "Evil <b>App</b>" });
  const response = await call(context(fakeEditor().editor, fake.oauth), "/owner/connect?client_id=c1");
  assert.equal(response.status, 200);
  const page = await response.text();
  assert.match(page, /Allow Evil &lt;b&gt;App&lt;\/b&gt; to edit Example Co\?/);
  assert.match(page, /It will send its sign-in to claude\.ai\./);
  assert.match(page, /name="handle" value="h-123"/);
  assert.equal(response.headers.get("set-cookie"), "__Host-consent=abc; Secure");
  assert.match(response.headers.get("content-security-policy") ?? "", /form-action 'self' https:\/\/claude\.ai;/);
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
});

test("consent page warns about a loopback redirect and allows exactly that origin", async () => {
  const fake = fakeOAuth({ redirectUri: "http://127.0.0.1:33418/callback", loopback: true });
  const response = await call(context(fakeEditor().editor, fake.oauth), "/owner/connect");
  assert.match(await response.text(), /running on this computer/);
  assert.match(response.headers.get("content-security-policy") ?? "", /form-action 'self' http:\/\/127\.0\.0\.1:33418;/);
  const plain = fakeOAuth({ redirectUri: "http://example.org/cb" });
  const other = await call(context(fakeEditor().editor, plain.oauth), "/owner/connect");
  assert.doesNotMatch(other.headers.get("content-security-policy") ?? "", /example\.org/);
});

test("consent GET with a bad request is a 400 page", async () => {
  const fake = fakeOAuth();
  fake.fail.value = true;
  assert.equal((await call(context(fakeEditor().editor, fake.oauth), "/owner/connect")).status, 400);
});

test("Allow completes the authorization for the hashed owner and redirects with the library's headers", async () => {
  const fake = fakeOAuth();
  const response = await call(context(fakeEditor().editor, fake.oauth), "/owner/connect", { form: { handle: "h-123", decision: "allow" } });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://claude.ai/cb?code=xyz");
  assert.equal(response.headers.get("set-cookie"), "cleared=1");
  assert.deepEqual(fake.calls, ["approve:h-123", `complete:${await ownerKey("owner@example.test")}:{"label":"Claude"}:{"email":"owner@example.test"}`]);
});

test("Don't allow redirects to the client's error URL with the library's headers", async () => {
  const fake = fakeOAuth();
  const response = await call(context(fakeEditor().editor, fake.oauth), "/owner/connect", { form: { handle: "h-123", decision: "deny" } });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://claude.ai/cb?error=access_denied");
  assert.equal(response.headers.get("set-cookie"), "denied=1");
  assert.deepEqual(fake.calls, ["deny:h-123"]);
});

test("an expired or reused handle is the 400 page, and a cross-origin consent POST is refused before the library", async () => {
  const fake = fakeOAuth();
  const ctx = context(fakeEditor().editor, fake.oauth);
  fake.fail.value = true;
  const expired = await call(ctx, "/owner/connect", { form: { handle: "h-123", decision: "allow" } });
  assert.equal(expired.status, 400);
  assert.match(await expired.text(), /This sign-in link has expired or was already used\. Start again from your AI app\./);
  fake.calls.length = 0;
  const cross = await call(ctx, "/owner/connect", { form: { handle: "h", decision: "allow" }, headers: { origin: "https://evil.test" } });
  assert.equal(cross.status, 403);
  assert.deepEqual(fake.calls, []);
});
