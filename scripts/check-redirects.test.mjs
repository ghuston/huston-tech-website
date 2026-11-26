// Tests for scripts/check-redirects.mjs. Not wired into `npm run` scripts; run them with:
//   node --test scripts/check-redirects.test.mjs
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test, before, after } from "node:test";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkUrl, checkAll, main, parseBaseUrl, parseList, resolveLocation } from "./check-redirects.mjs";

let server;
let base;
const routes = {
  "/ok": [301, "/page"],
  "/page": [200],
  "/found": [302, "/page"],
  "/to-missing": [301, "/missing"],
  "/missing": [404],
  "/loop-a": [301, "/loop-b"],
  "/loop-b": [301, "/loop-a"],
  "/chain-1": [301, "/chain-2"],
  "/chain-2": [301, "/page"],
  "/relative": [301, "../relative-target"],
  "/relative-target": [200],
  "/no-location": [301],
  "/long-1": [301, "/long-2"],
  "/long-2": [301, "/long-3"],
  "/long-3": [301, "/long-4"],
  "/long-4": [301, "/long-5"],
  "/long-5": [301, "/long-6"],
  "/long-6": [301, "/page"],
  "/five-1": [301, "/five-2"],
  "/five-2": [301, "/five-3"],
  "/five-3": [301, "/five-4"],
  "/five-4": [301, "/five-5"],
  "/five-5": [301, "/page"],
  "/slow": "hang",
};
const seen = [];

before(async () => {
  server = createServer((req, res) => {
    seen.push(req.url);
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/search") {
      // A query string must survive the trip: redirect only when ?q=old is present.
      if (url.searchParams.get("q") === "old") return res.writeHead(301, { location: "/page?from=search" }).end();
      return res.writeHead(404).end();
    }
    if (url.pathname === "/page" && url.search === "?from=search") return res.writeHead(200).end("ok");
    const route = routes[url.pathname];
    if (route === "hang") return; // never answers
    if (!route) return res.writeHead(404).end();
    const [status, location] = route;
    res.writeHead(status, location ? { location } : {}).end();
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.closeAllConnections();
  server.close();
});

test("301 to a 200 page passes", async () => {
  const r = await checkUrl(`${base}/ok`);
  assert.equal(r.ok, true);
  assert.equal(r.hops, 1);
});

test("302 fails with the status named", async () => {
  const r = await checkUrl(`${base}/found`);
  assert.equal(r.ok, false);
  assert.match(r.reason, /302 instead of 301/);
});

test("a page that is not a redirect fails", async () => {
  const r = await checkUrl(`${base}/page`);
  assert.equal(r.ok, false);
  assert.match(r.reason, /not a redirect \(status 200\)/);
});

test("301 to a 404 fails with the final status", async () => {
  const r = await checkUrl(`${base}/to-missing`);
  assert.equal(r.ok, false);
  assert.match(r.reason, /final status 404/);
});

test("a redirect loop fails", async () => {
  const r = await checkUrl(`${base}/loop-a`);
  assert.equal(r.ok, false);
  assert.match(r.reason, /redirect loop/);
});

test("301 then 301 then 200 passes", async () => {
  const r = await checkUrl(`${base}/chain-1`);
  assert.equal(r.ok, true);
  assert.equal(r.hops, 2);
});

test("a relative Location is resolved against the current URL", async () => {
  const r = await checkUrl(`${base}/relative`);
  assert.equal(r.ok, true);
  assert.match(r.reason, /\/relative-target \(200\)/);
});

test("a 301 without Location fails", async () => {
  const r = await checkUrl(`${base}/no-location`);
  assert.equal(r.ok, false);
  assert.match(r.reason, /no Location header/);
});

test("five redirects pass, six are too many", async () => {
  const five = await checkUrl(`${base}/five-1`);
  assert.equal(five.ok, true);
  assert.equal(five.hops, 5);
  const six = await checkUrl(`${base}/long-1`);
  assert.equal(six.ok, false);
  assert.match(six.reason, /too many hops/);
});

test("the query string is sent to the server", async () => {
  const r = await checkUrl(`${base}/search?q=old`);
  assert.equal(r.ok, true);
  assert.ok(seen.includes("/search?q=old"));
  assert.match(r.reason, /\/page\?from=search \(200\)/);
});

test("a server that never answers fails after the timeout", async () => {
  const r = await checkUrl(`${base}/slow`, { timeoutMs: 100 });
  assert.equal(r.ok, false);
  assert.match(r.reason, /network error: timed out/);
});

test("a closed port is a network error", async () => {
  const r = await checkUrl("http://127.0.0.1:1/x");
  assert.equal(r.ok, false);
  assert.match(r.reason, /network error/);
});

test("checkAll counts passes and failures and keeps the query from a full URL", async () => {
  const entries = parseList(`${base}/search?q=old\n/found\n`);
  const { lines, passed, failed } = await checkAll(entries, base);
  assert.equal(passed, 1);
  assert.equal(failed, 1);
  assert.match(lines[0], /^PASS /);
  assert.match(lines[1], /^FAIL \/found: 302 instead of 301/);
});

test("parseList ignores blanks and comments and flags bad lines", () => {
  const entries = parseList("# note\n\n  /a  \nhttps://old.example/b?x=1#frag\nnot-a-path\n/has space\n");
  assert.deepEqual(entries.map((e) => e.path), ["/a", "/b?x=1", undefined, undefined]);
  assert.ok(entries[2].error);
  assert.ok(entries[3].error);
});

test("parseBaseUrl accepts only http(s)", () => {
  assert.equal(parseBaseUrl("https://example.com/ignored"), "https://example.com");
  assert.equal(parseBaseUrl("http://localhost:4822"), "http://localhost:4822");
  assert.equal(parseBaseUrl("ftp://example.com"), null);
  assert.equal(parseBaseUrl("example.com"), null);
});

test("resolveLocation handles relative, absolute and non-http values", () => {
  assert.equal(resolveLocation("/b", "https://x.test/a/c"), "https://x.test/b");
  assert.equal(resolveLocation("d", "https://x.test/a/c"), "https://x.test/a/d");
  assert.equal(resolveLocation("https://y.test/z", "https://x.test/a"), "https://y.test/z");
  assert.equal(resolveLocation("javascript:alert(1)", "https://x.test/a"), null);
});

test("main exit codes: 0 on pass, 1 on failure or empty list, 2 on bad arguments", async () => {
  const dir = mkdtempSync(join(tmpdir(), "check-redirects-"));
  try {
    const quiet = { log() {}, error() {} };
    const good = join(dir, "good.txt");
    const bad = join(dir, "bad.txt");
    const empty = join(dir, "empty.txt");
    writeFileSync(good, "/ok\n/chain-1\n");
    writeFileSync(bad, "/ok\n/found\n");
    writeFileSync(empty, "# nothing yet\n\n");
    assert.equal(await main([good, base], quiet), 0);
    assert.equal(await main([bad, base], quiet), 1);
    assert.equal(await main([empty, base], quiet), 1);
    assert.equal(await main([join(dir, "missing.txt"), base], quiet), 1);
    assert.equal(await main([good], quiet), 2);
    assert.equal(await main([good, "ftp://example.com"], quiet), 2);
    assert.equal(await main([], quiet), 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
