import assert from "node:assert/strict";
import { test } from "node:test";
import { FakeGitHub } from "./fake-github.ts";
import { createGitHub, GitHubError, signAppJwt } from "./github.ts";

const RS256 = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) } as const;
const NOW = Date.parse("2026-11-25T12:00:00.000Z");

function pem(label: string, der: Uint8Array): string {
  const body = Buffer.from(der).toString("base64").replace(/(.{64})/g, "$1\n");
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----\n`;
}

/** Strips the PKCS#8 envelope (header up to and including the OCTET STRING length) to get the PKCS#1 key. */
function pkcs1From(pkcs8: Uint8Array): Uint8Array {
  const marker = [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00, 0x04];
  let at = 0;
  for (let i = 0; i < pkcs8.length; i++) if (marker.every((byte, j) => pkcs8[i + j] === byte)) at = i + marker.length;
  const lengthBytes = pkcs8[at] === 0x82 ? 3 : pkcs8[at] === 0x81 ? 2 : 1;
  return pkcs8.slice(at + lengthBytes);
}

const pair = (await crypto.subtle.generateKey(RS256, true, ["sign", "verify"])) as CryptoKeyPair;
const pkcs8 = new Uint8Array((await crypto.subtle.exportKey("pkcs8", pair.privateKey)) as ArrayBuffer);
const PKCS8_PEM = pem("PRIVATE KEY", pkcs8);
const PKCS1_PEM = pem("RSA PRIVATE KEY", pkcs1From(pkcs8));

interface Call {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}
type Reply = { status?: number; json?: unknown };

function mock(routes: Record<string, Reply | Reply[]>) {
  const calls: Call[] = [];
  const queues = new Map(Object.entries(routes).map(([key, value]) => [key, Array.isArray(value) ? [...value] : [value]]));
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const headers = Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>));
    calls.push({ method, url, headers, body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined });
    const key = `${method} ${url.replace("https://api.github.com", "")}`;
    const queue = queues.get(key);
    const reply = queue && (queue.length > 1 ? queue.shift() : queue[0]);
    if (!reply) return new Response(JSON.stringify({ message: "unrouted secret-body" }), { status: 599 });
    return new Response(reply.status === 204 ? null : JSON.stringify(reply.json ?? {}), { status: reply.status ?? 200 });
  };
  return { calls, fetcher };
}

const TOKEN_ROUTE = { "POST /app/installations/77/access_tokens": { status: 201, json: { token: "ghs_secrettoken", expires_at: "2026-11-25T13:00:00Z" } } };
const BASE = { appId: "123", installationId: "77", owner: "acme", repo: "site", userAgent: "site-editor", now: () => NOW };

test("signAppJwt signs RS256 with iat now-60 and exp +540, for PKCS#8 and PKCS#1 keys", async () => {
  for (const key of [PKCS8_PEM, PKCS1_PEM]) {
    const jwt = await signAppJwt("123", key, NOW);
    const [head, claims, sig] = jwt.split(".");
    assert.deepEqual(JSON.parse(Buffer.from(head, "base64url").toString()), { alg: "RS256", typ: "JWT" });
    const body = JSON.parse(Buffer.from(claims, "base64url").toString());
    assert.deepEqual(body, { iat: NOW / 1000 - 60, exp: NOW / 1000 + 540, iss: "123" });
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", pair.publicKey, Buffer.from(sig, "base64url"), new TextEncoder().encode(`${head}.${claims}`));
    assert.equal(ok, true);
  }
});

test("token request names the one repo and permissions; the token is reused", async () => {
  const { calls, fetcher } = mock({
    ...TOKEN_ROUTE,
    "GET /repos/acme/site/git/ref/heads/main": { json: { object: { sha: "c1" } } },
    "GET /repos/acme/site/git/commits/c1": { json: { tree: { sha: "t1" }, parents: [{ sha: "c0" }] } },
  });
  const gh = createGitHub({ ...BASE, privateKeyPem: PKCS1_PEM, fetch: fetcher });
  assert.deepEqual(await gh.headOfMain(), { commit: "c1", tree: "t1" });
  assert.equal(await gh.commitParent("c1"), "c0");
  const tokenCalls = calls.filter((c) => c.url.endsWith("/access_tokens"));
  assert.equal(tokenCalls.length, 1);
  assert.deepEqual(tokenCalls[0].body, {
    repositories: ["site"],
    permissions: { contents: "write", pull_requests: "write", issues: "write", checks: "read", metadata: "read" },
  });
  assert.match(tokenCalls[0].headers.authorization, /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
  const api = calls.find((c) => c.url.includes("/git/ref/"));
  assert.equal(api?.headers.authorization, "Bearer ghs_secrettoken");
  assert.equal(api?.headers.accept, "application/vnd.github+json");
  assert.equal(api?.headers["x-github-api-version"], "2022-11-28");
  assert.equal(api?.headers["user-agent"], "site-editor");
});

test("a token within five minutes of expiry is replaced", async () => {
  let clock = NOW;
  const { calls, fetcher } = mock({ ...TOKEN_ROUTE, "GET /repos/acme/site/git/commits/c1": { json: { parents: [{ sha: "c0" }] } } });
  const gh = createGitHub({ ...BASE, now: () => clock, privateKeyPem: PKCS8_PEM, fetch: fetcher });
  await gh.commitParent("c1");
  clock = NOW + 54 * 60 * 1000;
  await gh.commitParent("c1");
  assert.equal(calls.filter((c) => c.url.endsWith("/access_tokens")).length, 1);
  clock = NOW + 56 * 60 * 1000;
  await gh.commitParent("c1");
  assert.equal(calls.filter((c) => c.url.endsWith("/access_tokens")).length, 2);
});

test("enableAutoMerge sends the squash mutation and maps the clean-status answer", async () => {
  const queued = mock({ ...TOKEN_ROUTE, "POST /graphql": { json: { data: {} } } });
  const gh = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: queued.fetcher });
  assert.equal(await gh.enableAutoMerge("PR_node"), "queued");
  const sent = queued.calls.find((c) => c.url.endsWith("/graphql"))?.body as { query: string; variables: unknown };
  assert.match(sent.query, /enablePullRequestAutoMerge\(input: \{ pullRequestId: \$pullRequestId, mergeMethod: SQUASH \}\)/);
  assert.deepEqual(sent.variables, { pullRequestId: "PR_node" });

  const clean = mock({ ...TOKEN_ROUTE, "POST /graphql": { json: { errors: [{ message: "Pull request is in clean status" }] } } });
  const gh2 = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: clean.fetcher });
  assert.equal(await gh2.enableAutoMerge("PR_node"), "clean");

  const off = mock({ ...TOKEN_ROUTE, "POST /graphql": { json: { errors: [{ message: "Auto merge is not allowed for this repository" }] } } });
  const gh4 = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: off.fetcher });
  assert.equal(await gh4.enableAutoMerge("PR_node"), "not_allowed");

  const other = mock({ ...TOKEN_ROUTE, "POST /graphql": { json: { errors: [{ message: "Something else went wrong" }] } } });
  const gh3 = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: other.fetcher });
  await assert.rejects(gh3.enableAutoMerge("PR_node"), (e: unknown) => e instanceof GitHubError && !e.message.includes("wrong"));
});

test("a 404 becomes a GitHubError whose message holds no secret, URL or body", async () => {
  const { fetcher } = mock({ ...TOKEN_ROUTE, "GET /repos/acme/site/git/commits/c1": { status: 404, json: { message: "Not Found secret-body" } } });
  const gh = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: fetcher });
  await assert.rejects(gh.commitParent("c1"), (e: unknown) => {
    assert.ok(e instanceof GitHubError);
    assert.equal(e.status, 404);
    assert.equal(e.message, "GitHub read commit failed (404)");
    for (const secret of ["ghs_secrettoken", "PRIVATE KEY", "secret-body", "api.github.com", "acme"]) assert.ok(!e.message.includes(secret));
    return true;
  });
});

test("a failed token request throws without leaking", async () => {
  const { fetcher } = mock({ "POST /app/installations/77/access_tokens": { status: 401, json: { message: "Bad credentials" } } });
  const gh = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: fetcher });
  await assert.rejects(gh.headOfMain(), (e: unknown) => e instanceof GitHubError && e.message === "GitHub installation token failed (401)");
});

test("one retry on a server error, then success", async () => {
  const { calls, fetcher } = mock({
    ...TOKEN_ROUTE,
    "GET /repos/acme/site/git/commits/c1": [{ status: 502 }, { json: { parents: [{ sha: "c0" }] } }],
  });
  const gh = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: fetcher });
  assert.equal(await gh.commitParent("c1"), "c0");
  assert.equal(calls.filter((c) => c.url.includes("/git/commits/c1")).length, 2);
});

test("a write is never sent twice: a 5xx on POST /pulls is tried once", async () => {
  const { calls, fetcher } = mock({ ...TOKEN_ROUTE, "POST /repos/acme/site/pulls": [{ status: 502 }, { status: 201, json: { number: 4 } }] });
  const gh = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: fetcher });
  await assert.rejects(gh.openPull({ head: "change/owner-a", title: "t", body: "b" }), (e: unknown) => e instanceof GitHubError && e.status === 502);
  assert.equal(calls.filter((c) => c.url.endsWith("/pulls")).length, 1);
});

test("the token request is retried like a read", async () => {
  const { calls, fetcher } = mock({
    "POST /app/installations/77/access_tokens": [{ status: 502 }, { status: 201, json: { token: "ghs_x", expires_at: "2026-11-25T13:00:00Z" } }],
    "GET /repos/acme/site/git/commits/c1": { json: { parents: [{ sha: "c0" }] } },
  });
  const gh = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: fetcher });
  assert.equal(await gh.commitParent("c1"), "c0");
  assert.equal(calls.filter((c) => c.url.endsWith("/access_tokens")).length, 2);
});

test("branchHead and listBranches read refs; listPulls reads 100 a page and up to 3 pages of open ones", async () => {
  const hundred = Array.from({ length: 100 }, (_, i) => ({ number: i + 1, state: "open" }));
  const { calls, fetcher } = mock({
    ...TOKEN_ROUTE,
    "GET /repos/acme/site/git/ref/heads/change/owner-a": { json: { object: { sha: "s1" } } },
    "GET /repos/acme/site/git/ref/heads/change/owner-b": { status: 404 },
    "GET /repos/acme/site/git/matching-refs/heads/change/owner-": { json: [{ ref: "refs/heads/change/owner-a", object: { sha: "s1" } }, { ref: "refs/heads/change/owner-c", object: { sha: "s2" } }] },
    "GET /repos/acme/site/pulls?state=open&sort=created&direction=desc&per_page=100&page=1": { json: hundred },
    "GET /repos/acme/site/pulls?state=open&sort=created&direction=desc&per_page=100&page=2": { json: hundred },
    "GET /repos/acme/site/pulls?state=open&sort=created&direction=desc&per_page=100&page=3": { json: hundred },
  });
  const gh = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: fetcher });
  assert.equal(await gh.branchHead("change/owner-a"), "s1");
  assert.equal(await gh.branchHead("change/owner-b"), null);
  assert.deepEqual(await gh.listBranches("change/owner-"), [
    { name: "change/owner-a", sha: "s1" },
    { name: "change/owner-c", sha: "s2" },
  ]);
  assert.equal((await gh.listPulls("open")).length, 300);
  assert.equal(calls.filter((c) => c.url.includes("/pulls?state=open")).length, 3);
});

test("fileAt decodes UTF-8 base64 and returns null on 404", async () => {
  const content = Buffer.from('{"title":"Café — open"}\n').toString("base64").replace(/(.{20})/g, "$1\n");
  const { calls, fetcher } = mock({
    ...TOKEN_ROUTE,
    "GET /repos/acme/site/contents/src/content/pages/home.json?ref=c1": { json: { content, encoding: "base64" } },
    "GET /repos/acme/site/contents/src/content/pages/gone.json?ref=c1": { status: 404 },
  });
  const gh = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: fetcher });
  assert.equal(await gh.fileAt("c1", "src/content/pages/home.json"), '{"title":"Café — open"}\n');
  assert.equal(await gh.fileAt("c1", "src/content/pages/gone.json"), null);
  assert.equal(calls.length, 3);
});

test("createCommit builds a tree on the base tree, then the commit; setBranch falls back to a forced update", async () => {
  const { calls, fetcher } = mock({
    ...TOKEN_ROUTE,
    "GET /repos/acme/site/git/commits/c1": { json: { tree: { sha: "t1" } } },
    "POST /repos/acme/site/git/trees": { status: 201, json: { sha: "t2" } },
    "POST /repos/acme/site/git/commits": { status: 201, json: { sha: "c2" } },
    "POST /repos/acme/site/git/refs": { status: 422, json: { message: "Reference already exists" } },
    "PATCH /repos/acme/site/git/refs/heads/change/owner-1": { json: {} },
  });
  const gh = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: fetcher });
  const sha = await gh.createCommit({ baseCommit: "c1", files: [{ path: "a/b.json", content: "{}" }], message: "content: x" });
  assert.equal(sha, "c2");
  assert.deepEqual(calls.find((c) => c.url.endsWith("/git/trees"))?.body, {
    base_tree: "t1",
    tree: [{ path: "a/b.json", mode: "100644", type: "blob", content: "{}" }],
  });
  assert.deepEqual(calls.find((c) => c.url.endsWith("/git/commits") && c.method === "POST")?.body, { message: "content: x", tree: "t2", parents: ["c1"] });
  await gh.setBranch("change/owner-1", "c2");
  assert.deepEqual(calls.find((c) => c.method === "PATCH")?.body, { sha: "c2", force: true });
});

test("openPull maps fields and a merged pull request keeps its merge commit", async () => {
  const raw = {
    number: 5,
    node_id: "PR_5",
    title: "change: hours",
    state: "closed",
    merged_at: "2026-11-25T10:00:00Z",
    created_at: "2026-11-25T09:00:00Z",
    closed_at: "2026-11-25T10:00:00Z",
    head: { ref: "change/owner-1", sha: "h1" },
    merge_commit_sha: "m1",
    user: { login: "editor[bot]" },
    body: null,
    html_url: "https://github.com/acme/site/pull/5",
  };
  const { calls, fetcher } = mock({
    ...TOKEN_ROUTE,
    "POST /repos/acme/site/pulls": { status: 201, json: { ...raw, state: "open", merged_at: null, merge_commit_sha: "test-merge" } },
    "GET /repos/acme/site/pulls/5": { json: raw },
    "GET /repos/acme/site/pulls/6": { status: 404 },
  });
  const gh = createGitHub({ ...BASE, branch: "trunk", privateKeyPem: PKCS8_PEM, fetch: fetcher });
  const opened = await gh.openPull({ head: "change/owner-1", title: "change: hours", body: "b" });
  assert.equal(opened.mergeCommitSha, null);
  assert.equal(opened.merged, false);
  assert.deepEqual(calls.find((c) => c.url.endsWith("/pulls"))?.body, { title: "change: hours", head: "change/owner-1", base: "trunk", body: "b" });
  const merged = await gh.getPull(5);
  assert.equal(merged?.merged, true);
  assert.equal(merged?.mergeCommitSha, "m1");
  assert.equal(merged?.body, "");
  assert.equal(await gh.getPull(6), null);
});

test("compare, checkRuns, pullFiles, listPulls and openIssue use the right requests", async () => {
  const { calls, fetcher } = mock({
    ...TOKEN_ROUTE,
    "GET /repos/acme/site/compare/a...b": { json: { status: "ahead" } },
    "GET /repos/acme/site/commits/b/check-runs?per_page=100": { json: { check_runs: [{ name: "check", status: "completed", conclusion: "success" }, { name: "a11y", status: "in_progress", conclusion: null }] } },
    "GET /repos/acme/site/pulls/5/files?per_page=100": { json: [{ filename: "x.json", status: "modified" }] },
    "GET /repos/acme/site/pulls?state=all&sort=created&direction=desc&per_page=100&page=1": { json: [] },
    "POST /repos/acme/site/issues": { status: 201, json: { number: 9, html_url: "https://github.com/acme/site/issues/9" } },
  });
  const gh = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: fetcher });
  assert.equal(await gh.compare("a", "b"), "ahead");
  assert.deepEqual(await gh.checkRuns("b"), [
    { name: "check", status: "completed", conclusion: "success" },
    { name: "a11y", status: "in_progress", conclusion: null },
  ]);
  assert.deepEqual(await gh.pullFiles(5), [{ path: "x.json", status: "modified" }]);
  assert.deepEqual(await gh.listPulls("all"), []);
  assert.deepEqual(await gh.openIssue({ title: "t", body: "b", labels: ["owner-request"] }), { number: 9, url: "https://github.com/acme/site/issues/9" });
  assert.deepEqual(calls.find((c) => c.url.endsWith("/issues"))?.body, { title: "t", body: "b", labels: ["owner-request"] });
});

test("tree lists blobs and folders; headOfMain reads the configured branch", async () => {
  const { calls, fetcher } = mock({
    ...TOKEN_ROUTE,
    "GET /repos/acme/site/git/ref/heads/trunk": { json: { object: { sha: "c1" } } },
    "GET /repos/acme/site/git/commits/c1": { json: { tree: { sha: "t1" } } },
    "GET /repos/acme/site/git/trees/t1?recursive=1": { json: { tree: [{ path: "src", sha: "s", type: "tree" }, { path: "src/a.json", sha: "b", type: "blob" }, { path: "sub", sha: "x", type: "commit" }] } },
  });
  const gh = createGitHub({ ...BASE, branch: "trunk", privateKeyPem: PKCS8_PEM, fetch: fetcher });
  assert.equal((await gh.headOfMain()).tree, "t1");
  assert.deepEqual(await gh.tree("t1"), [
    { path: "src", sha: "s", type: "tree" },
    { path: "src/a.json", sha: "b", type: "blob" },
  ]);
  assert.ok(calls.length > 0);
});

test("FakeGitHub: folder tree SHAs change exactly when a file under them changes", async () => {
  const fake = new FakeGitHub({ "src/content/pages/home.json": "{}", "public/images/a.png": "img", "README.md": "hi" });
  const shaOf = async (commit: string, path: string) => (await fake.tree(`tree:${commit}`)).find((e) => e.path === path)?.sha;
  const { commit } = await fake.headOfMain();
  const next = await fake.createCommit({ baseCommit: commit, files: [{ path: "src/content/pages/home.json", content: '{"a":1}' }], message: "m" });
  assert.notEqual(await shaOf(next, "src/content/pages"), await shaOf(commit, "src/content/pages"));
  assert.notEqual(await shaOf(next, "src"), await shaOf(commit, "src"));
  assert.equal(await shaOf(next, "public/images"), await shaOf(commit, "public/images"));
  assert.equal((await fake.tree(`tree:${commit}`)).find((e) => e.path === "README.md")?.type, "blob");
});

test("FakeGitHub: pull request lifecycle, merge, status and compare", async () => {
  const fake = new FakeGitHub({ "src/content/pages/home.json": "{}", "src/content/pages/faq.json": "[]" });
  const { commit } = await fake.headOfMain();
  const next = await fake.createCommit({ baseCommit: commit, files: [{ path: "src/content/pages/home.json", content: '{"a":1}' }], message: "content: a" });
  await fake.setBranch("change/owner-1", next);
  const pull = await fake.openPull({ head: "change/owner-1", title: "change: a", body: "b" });
  assert.equal(pull.headSha, next);
  assert.deepEqual(await fake.pullFiles(pull.number), [{ path: "src/content/pages/home.json", status: "modified" }]);
  assert.equal(await fake.enableAutoMerge(pull.nodeId), "queued");
  fake.setChecks(next, [{ name: "check", status: "completed", conclusion: "success" }]);
  assert.equal((await fake.checkRuns(next)).length, 1);
  assert.equal(await fake.compare(commit, next), "ahead");

  fake.merge(pull.number);
  const merged = await fake.getPull(pull.number);
  assert.equal(merged?.merged, true);
  assert.equal(merged?.state, "closed");
  assert.ok(merged?.mergeCommitSha);
  assert.equal(await fake.fileAt(merged.mergeCommitSha, "src/content/pages/home.json"), '{"a":1}');
  assert.equal(await fake.fileAt(merged.mergeCommitSha, "src/content/pages/faq.json"), "[]");
  assert.equal(await fake.commitParent(merged.mergeCommitSha), commit);
  assert.equal(await fake.compare(merged.mergeCommitSha, commit), "behind");
  assert.equal(await fake.compare(commit, commit), "identical");
  assert.equal(await fake.compare(next, merged.mergeCommitSha), "diverged");
  assert.equal(fake.filesOn("main")["src/content/pages/home.json"], '{"a":1}');
  assert.deepEqual((await fake.listPulls("open")).length, 0);
  assert.equal((await fake.listPulls("all")).length, 1);
  assert.equal(await fake.getPull(99), null);
});

test("FakeGitHub: close, issues and the clean auto-merge answer", async () => {
  const fake = new FakeGitHub({ "a.json": "1" });
  const { commit } = await fake.headOfMain();
  await fake.setBranch("change/owner-2", commit);
  const pull = await fake.openPull({ head: "change/owner-2", title: "t", body: "" });
  fake.autoMergeClean = true;
  assert.equal(await fake.enableAutoMerge(pull.nodeId), "clean");
  await fake.closePull(pull.number);
  assert.equal((await fake.getPull(pull.number))?.state, "closed");
  assert.equal((await fake.getPull(pull.number))?.merged, false);
  await fake.deleteBranch("change/owner-2");
  assert.deepEqual(await fake.openIssue({ title: "Owner request: x", body: "b", labels: ["owner-request"] }), { number: 1, url: "https://github.com/fake/fake/issues/1" });
  assert.equal(fake.issues[0].labels[0], "owner-request");
});

test("createCommit sends a binary file as a base64 blob first and puts its sha in the tree", async () => {
  const { calls, fetcher } = mock({
    ...TOKEN_ROUTE,
    "GET /repos/acme/site/git/commits/c1": { json: { tree: { sha: "t1" } } },
    "POST /repos/acme/site/git/blobs": { status: 201, json: { sha: "b1" } },
    "POST /repos/acme/site/git/trees": { status: 201, json: { sha: "t2" } },
    "POST /repos/acme/site/git/commits": { status: 201, json: { sha: "c2" } },
  });
  const gh = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: fetcher });
  const bytes = Uint8Array.from({ length: 300_000 }, (_, i) => i % 251);
  await gh.createCommit({ baseCommit: "c1", files: [{ path: "a.json", content: "{}" }, { path: "public/images/uploads/x.webp", bytes }], message: "m" });
  const order = calls.filter((c) => c.method === "POST" && /\/git\/(blobs|trees|commits)$/.test(c.url)).map((c) => c.url.split("/").pop());
  assert.deepEqual(order, ["blobs", "trees", "commits"]);
  const blob = calls.find((c) => c.url.endsWith("/git/blobs"))?.body as { content: string; encoding: string };
  assert.equal(blob.encoding, "base64");
  assert.deepEqual(new Uint8Array(Buffer.from(blob.content, "base64")), bytes, "a large file survives the chunked base64");
  assert.deepEqual(calls.find((c) => c.url.endsWith("/git/trees"))?.body, {
    base_tree: "t1",
    tree: [
      { path: "a.json", mode: "100644", type: "blob", content: "{}" },
      { path: "public/images/uploads/x.webp", mode: "100644", type: "blob", sha: "b1" },
    ],
  });
});

test("a failed blob upload fails the commit without a tree", async () => {
  const { calls, fetcher } = mock({
    ...TOKEN_ROUTE,
    "GET /repos/acme/site/git/commits/c1": { json: { tree: { sha: "t1" } } },
    "POST /repos/acme/site/git/blobs": { status: 422, json: {} },
  });
  const gh = createGitHub({ ...BASE, privateKeyPem: PKCS8_PEM, fetch: fetcher });
  await assert.rejects(gh.createCommit({ baseCommit: "c1", files: [{ path: "x.webp", bytes: Uint8Array.of(1) }], message: "m" }), /create blob failed/);
  assert.ok(!calls.some((c) => c.url.endsWith("/git/trees")));
});
