// Checks that old-site URLs redirect (301) to pages that exist (200).
// Usage: node scripts/check-redirects.mjs <list-file> <base-url>
//   list-file  one old URL per line: a path (/old-page) or a full URL (only its path and query are used).
//              Blank lines and lines starting with # are ignored.
//   base-url   the site to test, such as a preview URL or https://example.com (http or https only).
// Exit code: 0 all passed, 1 a check failed or the list is empty/unreadable, 2 bad arguments.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const MAX_HOPS = 5;
export const TIMEOUT_MS = 10_000;
export const USAGE = "Usage: node scripts/check-redirects.mjs <list-file> <base-url>";

/** Returns the base URL's origin for an http(s) URL, or null. Any path on the base URL is ignored. */
export function parseBaseUrl(input) {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

/** Turns list-file text into entries: { raw, path } or { raw, error }. */
export function parseList(text) {
  const entries = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    if (/\s/.test(line)) {
      entries.push({ raw: line, error: "expected one URL or path per line (found whitespace)" });
    } else if (line.startsWith("/")) {
      entries.push({ raw: line, path: line.split("#")[0] });
    } else if (/^https?:\/\//i.test(line)) {
      try {
        const url = new URL(line);
        entries.push({ raw: line, path: url.pathname + url.search });
      } catch {
        entries.push({ raw: line, error: "not a valid URL" });
      }
    } else {
      entries.push({ raw: line, error: "not a path starting with / or an http(s) URL" });
    }
  }
  return entries;
}

/** Resolves a Location header against the URL that sent it. Returns an http(s) URL string or null. */
export function resolveLocation(location, currentUrl) {
  try {
    const next = new URL(location, currentUrl);
    return next.protocol === "http:" || next.protocol === "https:" ? next.href : null;
  } catch {
    return null;
  }
}

const isRedirect = (status) => status >= 300 && status < 400;

/**
 * Follows one old URL by hand. Passes only when the first response is a 301 with a Location and the
 * chain of 3xx responses (at most maxHops) ends in a 200. Resolves to { ok, reason, hops }.
 */
export async function checkUrl(startUrl, { fetchImpl = fetch, maxHops = MAX_HOPS, timeoutMs = TIMEOUT_MS } = {}) {
  const visited = new Set([startUrl]);
  let current = startUrl;
  for (let hop = 1; ; hop++) {
    let status;
    let location;
    try {
      const res = await fetchImpl(current, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
      status = res.status;
      location = res.headers.get("location");
      await res.body?.cancel();
    } catch (err) {
      const timedOut = err?.name === "TimeoutError" || err?.name === "AbortError";
      const detail = timedOut ? `timed out after ${timeoutMs / 1000} s` : (err?.cause?.code ?? err?.message ?? String(err));
      return { ok: false, reason: `network error: ${detail} (${current})`, hops: hop - 1 };
    }

    if (hop === 1) {
      if (!isRedirect(status)) return { ok: false, reason: `not a redirect (status ${status})`, hops: 0 };
      if (status !== 301) return { ok: false, reason: `${status} instead of 301`, hops: 0 };
    }

    if (!isRedirect(status)) {
      return status === 200
        ? { ok: true, reason: `${current} (200)`, hops: hop - 1 }
        : { ok: false, reason: `final status ${status} at ${current}`, hops: hop - 1 };
    }

    if (!location) return { ok: false, reason: `no Location header (status ${status} at ${current})`, hops: hop };
    if (hop > maxHops) return { ok: false, reason: `too many hops (more than ${maxHops})`, hops: hop };
    const next = resolveLocation(location, current);
    if (!next) return { ok: false, reason: `invalid Location "${location}" from ${current}`, hops: hop };
    if (visited.has(next)) return { ok: false, reason: `redirect loop back to ${next}`, hops: hop };
    visited.add(next);
    current = next;
  }
}

/** One report line: "PASS /old -> final (200), 2 hops" or "FAIL /old: reason". */
export function formatLine(entry, result) {
  if (!result.ok) return `FAIL ${entry.raw}: ${result.reason}`;
  const hops = `${result.hops} ${result.hops === 1 ? "hop" : "hops"}`;
  return `PASS ${entry.raw} -> ${result.reason}, ${hops}`;
}

/** Runs every entry in order. Returns { lines, passed, failed }. */
export async function checkAll(entries, baseOrigin, options) {
  const lines = [];
  let passed = 0;
  let failed = 0;
  for (const entry of entries) {
    const result = entry.error
      ? { ok: false, reason: entry.error, hops: 0 }
      : await checkUrl(baseOrigin + entry.path, options);
    if (result.ok) passed++;
    else failed++;
    lines.push(formatLine(entry, result));
  }
  return { lines, passed, failed };
}

/** The command-line part. Returns the exit code; io is injectable for tests. */
export async function main(argv, { log = console.log, error = console.error, options } = {}) {
  const [listFile, baseInput, ...extra] = argv;
  if (!listFile || !baseInput || extra.length > 0) {
    error(USAGE);
    return 2;
  }
  const baseOrigin = parseBaseUrl(baseInput);
  if (!baseOrigin) {
    error(`Invalid base URL "${baseInput}": use an http:// or https:// address.\n${USAGE}`);
    return 2;
  }
  let text;
  try {
    text = readFileSync(listFile, "utf8");
  } catch (err) {
    error(`Cannot read the list file "${listFile}": ${err.code ?? err.message}`);
    return 1;
  }
  const entries = parseList(text);
  if (entries.length === 0) {
    error(`No URLs found in "${listFile}". Add one old URL per line.`);
    return 1;
  }
  const { lines, passed, failed } = await checkAll(entries, baseOrigin, options);
  for (const line of lines) log(line);
  log(`${passed} passed, ${failed} failed, ${entries.length} total`);
  return failed > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await main(process.argv.slice(2));
}
