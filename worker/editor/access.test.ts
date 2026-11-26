import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { isOwner, ownerFromRequest, resetAccessKeyCache, verifyAccessJwt } from "./access.ts";

const TEAM = "example-team.cloudflareaccess.com";
const ISS = `https://${TEAM}`;
const AUD = "aud-tag-0123456789abcdef";
const NOW = Date.parse("2026-11-19T18:00:00.000Z");
const nowS = NOW / 1000;
const RS256 = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) } as const;

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");
const b64json = (value: unknown) => b64(new TextEncoder().encode(JSON.stringify(value)));

interface TestKey {
  kid: string;
  privateKey: CryptoKey;
  jwk: JsonWebKey & { kid: string; use: string; alg: string };
}

async function makeKey(kid: string): Promise<TestKey> {
  const pair = (await crypto.subtle.generateKey(RS256, true, ["sign", "verify"])) as CryptoKeyPair;
  const jwk = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as JsonWebKey;
  return { kid, privateKey: pair.privateKey, jwk: { ...jwk, kid, use: "sig", alg: "RS256" } };
}

async function sign(key: TestKey, claims: Record<string, unknown>, header: Record<string, unknown> = {}): Promise<string> {
  const head = b64json({ alg: "RS256", typ: "JWT", kid: key.kid, ...header });
  const body = b64json(claims);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key.privateKey, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${b64(new Uint8Array(signature))}`;
}

const claims = (over: Record<string, unknown> = {}) => ({
  iss: ISS,
  aud: [AUD],
  email: "Owner@Example.com",
  iat: nowS - 10,
  nbf: nowS - 10,
  exp: nowS + 600,
  ...over,
});

function jwksFetch(getKeys: () => TestKey[]) {
  const calls: string[] = [];
  const fn = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return Response.json({ keys: getKeys().map((key) => key.jwk) });
  }) as typeof fetch;
  return { fn, calls };
}

const failingFetch = (async () => {
  throw new Error("network down");
}) as typeof fetch;

beforeEach(() => resetAccessKeyCache());

async function verify(token: string, fetchFn: typeof fetch, now = NOW) {
  return verifyAccessJwt(token, { teamDomain: TEAM, aud: AUD, now, fetch: fetchFn });
}

test("a valid RS256 token gives its email, lowercased; the keys come from the team's certs URL", async () => {
  const key = await makeKey("kid-1");
  const server = jwksFetch(() => [key]);
  assert.deepEqual(await verify(await sign(key, claims()), server.fn), { ok: true, email: "owner@example.com" });
  assert.deepEqual(server.calls, [`${ISS}/cdn-cgi/access/certs`]);
  assert.deepEqual(await verify(await sign(key, claims({ aud: AUD })), server.fn), { ok: true, email: "owner@example.com" });
});

test("wrong aud, wrong iss and a missing email are refused", async () => {
  const key = await makeKey("kid-1");
  const server = jwksFetch(() => [key]);
  for (const over of [
    { aud: ["another-app"] },
    { aud: "another-app" },
    { aud: [] },
    { iss: "https://other-team.cloudflareaccess.com" },
    { iss: `${ISS}/` },
    { email: undefined },
    { email: "" },
  ]) {
    assert.deepEqual(await verify(await sign(key, claims(over)), server.fn), { ok: false, reason: "invalid" }, JSON.stringify(over));
  }
});

test("expired and not-yet-valid tokens are refused, with 60 seconds of skew; exp is required", async () => {
  const key = await makeKey("kid-1");
  const server = jwksFetch(() => [key]);
  const ok = async (over: Record<string, unknown>) => (await verify(await sign(key, claims(over)), server.fn)).ok;
  assert.equal(await ok({ exp: nowS - 61 }), false);
  assert.equal(await ok({ exp: nowS - 59 }), true);
  assert.equal(await ok({ nbf: nowS + 61 }), false);
  assert.equal(await ok({ nbf: nowS + 59 }), true);
  assert.equal(await ok({ exp: undefined }), false);
});

test("alg none, HS256, other algorithms, a bad signature and junk are refused before or without trusting the token", async () => {
  const key = await makeKey("kid-1");
  const other = await makeKey("kid-1");
  const server = jwksFetch(() => [key]);
  const head = (alg: string) => b64json({ alg, typ: "JWT", kid: "kid-1" });
  const body = b64json(claims());
  const hmac = await crypto.subtle.importKey("raw", new TextEncoder().encode("secret"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", hmac, new TextEncoder().encode(`${head("HS256")}.${body}`)));
  for (const token of [
    `${head("none")}.${body}.`,
    `${head("none")}.${body}.AAAA`,
    `${head("HS256")}.${body}.${b64(mac)}`,
    await sign(key, claims(), { alg: "RS512" }),
    await sign(other, claims()),
    "not-a-jwt",
    "a.b.c",
    "",
  ]) {
    assert.deepEqual(await verify(token, server.fn), { ok: false, reason: "invalid" }, token.slice(0, 40));
  }
  const noKeyFetch = jwksFetch(() => []);
  resetAccessKeyCache();
  await verify(`${head("HS256")}.${body}.${b64(mac)}`, noKeyFetch.fn);
  assert.equal(noKeyFetch.calls.length, 0, "a refused algorithm never reaches the key fetch");
});

test("an unknown kid refetches the keys at most once every 30 seconds", async () => {
  const first = await makeKey("kid-1");
  const rotated = await makeKey("kid-2");
  let keys = [first];
  const server = jwksFetch(() => keys);
  let now = NOW;
  const check = async (key: TestKey) => verify(await sign(key, claims({ exp: nowS + 900 })), server.fn, now);

  assert.equal((await check(first)).ok, true);
  assert.equal((await check(first)).ok, true);
  assert.equal(server.calls.length, 1, "keys are cached");

  keys = [first, rotated];
  now += 31_000;
  assert.equal((await check(rotated)).ok, true);
  assert.equal(server.calls.length, 2);

  const stranger = await makeKey("kid-3");
  now += 31_000;
  assert.equal((await check(stranger)).ok, false);
  assert.equal(server.calls.length, 3);
  assert.equal((await check(stranger)).ok, false);
  assert.equal(server.calls.length, 3, "no second fetch inside 30 seconds");
});

test("the cached keys expire after five minutes", async () => {
  const key = await makeKey("kid-1");
  const server = jwksFetch(() => [key]);
  let now = NOW;
  const token = await sign(key, claims({ exp: nowS + 3600 }));
  await verify(token, server.fn, now);
  now += 4 * 60_000;
  await verify(token, server.fn, now);
  assert.equal(server.calls.length, 1);
  now += 2 * 60_000;
  await verify(token, server.fn, now);
  assert.equal(server.calls.length, 2);
});

test("keys that can't be fetched are unavailable, not invalid", async () => {
  const key = await makeKey("kid-1");
  const token = await sign(key, claims());
  assert.deepEqual(await verify(token, failingFetch), { ok: false, reason: "unavailable" });
  const notOk = (async () => new Response("no", { status: 500 })) as typeof fetch;
  assert.deepEqual(await verify(token, notOk), { ok: false, reason: "unavailable" });
});

const config = (over: Partial<{ teamDomain: string | null; aud: string | null; ownerEmails: string[] }> = {}) => ({
  ownerEmails: over.ownerEmails ?? ["owner@example.com"],
  access: {
    teamDomain: over.teamDomain === undefined ? TEAM : over.teamDomain,
    aud: over.aud === undefined ? AUD : over.aud,
  },
});

const withToken = (token: string) => new Request("https://site.example/owner", { headers: { "Cf-Access-Jwt-Assertion": token } });

async function expectRefusal(result: { email: string } | Response, status: number, text: string) {
  assert.ok(result instanceof Response);
  assert.equal(result.status, status);
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.equal(result.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(await result.text(), text);
}

test("ownerFromRequest: a valid owner passes, from the header or the CF_Authorization cookie", async () => {
  const key = await makeKey("kid-1");
  const server = jwksFetch(() => [key]);
  const token = await sign(key, claims({ exp: Date.now() / 1000 + 600, nbf: Date.now() / 1000 - 10 }));
  assert.deepEqual(await ownerFromRequest(withToken(token), config(), server.fn), { email: "owner@example.com" });
  const cookie = new Request("https://site.example/owner", { headers: { Cookie: `a=b; CF_Authorization=${token}` } });
  assert.deepEqual(await ownerFromRequest(cookie, config(), server.fn), { email: "owner@example.com" });
});

test("ownerFromRequest: the owner list compares case-insensitively", async () => {
  const key = await makeKey("kid-1");
  const server = jwksFetch(() => [key]);
  const token = await sign(key, claims({ exp: Date.now() / 1000 + 600, nbf: Date.now() / 1000 - 10 }));
  const result = await ownerFromRequest(withToken(token), config({ ownerEmails: [" OWNER@Example.COM "] }), server.fn);
  assert.deepEqual(result, { email: "owner@example.com" });
});

test("ownerFromRequest: not set up is 500; no or bad token is 401; non-owner is 403; keys down is 503", async () => {
  const key = await makeKey("kid-1");
  const server = jwksFetch(() => [key]);
  const live = { exp: Date.now() / 1000 + 600, nbf: Date.now() / 1000 - 10 };
  const token = await sign(key, claims(live));
  const setUp = "Sign-in isn't set up yet.";
  await expectRefusal(await ownerFromRequest(withToken(token), config({ teamDomain: null }), server.fn), 500, setUp);
  await expectRefusal(await ownerFromRequest(withToken(token), config({ aud: null }), server.fn), 500, setUp);
  await expectRefusal(await ownerFromRequest(withToken(token), config({ ownerEmails: [] }), server.fn), 500, setUp);
  await expectRefusal(await ownerFromRequest(new Request("https://site.example/owner"), config(), server.fn), 401, "Please sign in.");
  await expectRefusal(await ownerFromRequest(withToken("junk"), config(), server.fn), 401, "Please sign in.");
  await expectRefusal(
    await ownerFromRequest(withToken(await sign(key, claims({ ...live, aud: ["other"] }))), config(), server.fn),
    401,
    "Please sign in.",
  );
  await expectRefusal(
    await ownerFromRequest(withToken(await sign(key, claims({ ...live, email: "stranger@example.com" }))), config(), server.fn),
    403,
    "This email can't manage this site.",
  );
  resetAccessKeyCache();
  await expectRefusal(
    await ownerFromRequest(withToken(token), config(), failingFetch),
    503,
    "Sign-in is unavailable right now. Try again in a minute.",
  );
});

test("isOwner compares without case or surrounding spaces", () => {
  const list = { ownerEmails: [" Owner@Example.com ", "two@example.com"] };
  assert.equal(isOwner(list, "owner@example.com"), true);
  assert.equal(isOwner(list, " TWO@example.com "), true);
  assert.equal(isOwner(list, "three@example.com"), false);
  assert.equal(isOwner({ ownerEmails: [] }, "owner@example.com"), false);
});
