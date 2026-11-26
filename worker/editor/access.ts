// Owner sign-in for /owner*: Cloudflare Access signs the owner in and adds a signed token; this checks the token
// itself (RS256 only, issuer, audience, expiry) and that its email is on the site's owner list. Ported from the
// Pipeline app's auth code. Failure responses never say why a token failed.
import type { EditorConfig } from "../config.ts";
import { plainText } from "../http.ts";
import type { Owner } from "./types.ts";

export type AccessVerdict = { ok: true; email: string } | { ok: false; reason: "invalid" | "unavailable" };

export interface VerifyOptions {
  teamDomain: string;
  aud: string;
  /** Milliseconds since the epoch; tests pass a fixed clock. */
  now?: number;
  fetch?: typeof fetch;
}

const CLOCK_SKEW_SECONDS = 60;
const KEYS_TTL_MS = 5 * 60_000;
const REFETCH_MIN_MS = 30_000;
const RS256 = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" } as const;
const SEGMENT = /^[A-Za-z0-9_-]+$/;
const TEAM_HOST = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.cloudflareaccess\.com$/;

class InvalidToken extends Error {}

type KeySet = { keys: Map<string, CryptoKey>; fetchedAt: number };

// Per isolate, keyed by certs URL.
const keyCache = new Map<string, KeySet>();

/** Empties the signing-key cache. For tests only. */
export function resetAccessKeyCache(): void {
  keyCache.clear();
}

function issuerFor(teamDomain: string): string | null {
  const host = teamDomain.trim().toLowerCase().replace(/^https:\/\//, "").replace(/\/$/, "");
  return TEAM_HOST.test(host) ? `https://${host}` : null;
}

async function importKeys(document: unknown): Promise<Map<string, CryptoKey>> {
  const list = typeof document === "object" && document !== null ? (document as { keys?: unknown }).keys : undefined;
  if (!Array.isArray(list)) throw new Error("no keys");
  const keys = new Map<string, CryptoKey>();
  for (const entry of list as unknown[]) {
    if (typeof entry !== "object" || entry === null) continue;
    const jwk = entry as Record<string, unknown>;
    if (jwk.kty !== "RSA" || typeof jwk.kid !== "string" || typeof jwk.n !== "string" || typeof jwk.e !== "string") continue;
    if (jwk.use !== undefined && jwk.use !== "sig") continue;
    if (jwk.alg !== undefined && jwk.alg !== "RS256") continue;
    try {
      keys.set(jwk.kid, await crypto.subtle.importKey("jwk", { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true }, RS256, false, ["verify"]));
    } catch {
      // A key this runtime can't import can't have signed a token we accept.
    }
  }
  return keys;
}

async function signingKey(kid: string, url: string, fetchFn: typeof fetch, now: number): Promise<CryptoKey | undefined> {
  const refresh = async (): Promise<KeySet> => {
    const res = await fetchFn(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      await res.body?.cancel();
      throw new Error("keys unavailable");
    }
    const set = { keys: await importKeys(await res.json()), fetchedAt: now };
    keyCache.set(url, set);
    return set;
  };
  let set = keyCache.get(url);
  if (!set || now - set.fetchedAt >= KEYS_TTL_MS) set = await refresh();
  if (!set.keys.has(kid) && now - set.fetchedAt >= REFETCH_MIN_MS) set = await refresh();
  return set.keys.get(kid);
}

function decodeSegment(segment: string): Uint8Array {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4)), (c) => c.charCodeAt(0));
}

function decodeJson(segment: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(decodeSegment(segment)));
  } catch {
    throw new InvalidToken();
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new InvalidToken();
  return value as Record<string, unknown>;
}

async function verifyClaims(token: string, issuer: string, aud: string, fetchFn: typeof fetch, now: number): Promise<string> {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts.every((part) => SEGMENT.test(part))) throw new InvalidToken();
  const [headerPart, payloadPart, signaturePart] = parts as [string, string, string];
  const header = decodeJson(headerPart);
  if (header.alg !== "RS256") throw new InvalidToken();
  if (typeof header.kid !== "string" || header.kid === "") throw new InvalidToken();
  const claims = decodeJson(payloadPart);

  const key = await signingKey(header.kid, `${issuer}/cdn-cgi/access/certs`, fetchFn, now);
  if (!key) throw new InvalidToken();
  let signature: Uint8Array;
  try {
    signature = decodeSegment(signaturePart);
  } catch {
    throw new InvalidToken();
  }
  const signed = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
  if (!(await crypto.subtle.verify(RS256, key, signature, signed))) throw new InvalidToken();

  if (claims.iss !== issuer) throw new InvalidToken();
  const audiences = typeof claims.aud === "string" ? [claims.aud] : Array.isArray(claims.aud) ? claims.aud : [];
  if (!audiences.includes(aud)) throw new InvalidToken();
  const seconds = now / 1000;
  if (typeof claims.exp !== "number" || seconds > claims.exp + CLOCK_SKEW_SECONDS) throw new InvalidToken();
  if (claims.nbf !== undefined && (typeof claims.nbf !== "number" || seconds < claims.nbf - CLOCK_SKEW_SECONDS)) throw new InvalidToken();
  const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
  if (email === "") throw new InvalidToken();
  return email;
}

export async function verifyAccessJwt(token: string, opts: VerifyOptions): Promise<AccessVerdict> {
  const issuer = issuerFor(opts.teamDomain);
  const aud = opts.aud.trim();
  if (!issuer || aud === "") return { ok: false, reason: "invalid" };
  try {
    const email = await verifyClaims(token, issuer, aud, opts.fetch ?? fetch, opts.now ?? Date.now());
    return { ok: true, email };
  } catch (error) {
    return { ok: false, reason: error instanceof InvalidToken ? "invalid" : "unavailable" };
  }
}

/** True when the email is on the site's owner list (compared without case or surrounding spaces). */
export function isOwner(config: Pick<EditorConfig, "ownerEmails">, email: string): boolean {
  const wanted = email.trim().toLowerCase();
  return config.ownerEmails.some((owner) => owner.trim().toLowerCase() === wanted);
}

/** The Access token from the Cf-Access-Jwt-Assertion header, or else the CF_Authorization cookie. */
function accessToken(request: Request): string | null {
  const header = request.headers.get("Cf-Access-Jwt-Assertion")?.trim();
  if (header) return header;
  for (const part of (request.headers.get("Cookie") ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator !== -1 && part.slice(0, separator).trim() === "CF_Authorization") {
      const value = part.slice(separator + 1).trim();
      if (value) return value;
    }
  }
  return null;
}

function refusal(status: number, message: string): Response {
  return plainText(status, message);
}

/** The signed-in owner's email, or the response to send instead (500, 401, 403 or 503). */
export async function ownerFromRequest(
  request: Request,
  config: Pick<EditorConfig, "ownerEmails" | "access">,
  fetchFn?: typeof fetch,
): Promise<Owner | Response> {
  const { teamDomain, aud } = config.access;
  if (!teamDomain || !aud || config.ownerEmails.length === 0 || !issuerFor(teamDomain)) {
    return refusal(500, "Sign-in isn't set up yet.");
  }
  const token = accessToken(request);
  if (!token) return refusal(401, "Please sign in.");
  const verdict = await verifyAccessJwt(token, { teamDomain, aud, ...(fetchFn ? { fetch: fetchFn } : {}) });
  if (!verdict.ok) {
    return verdict.reason === "unavailable"
      ? refusal(503, "Sign-in is unavailable right now. Try again in a minute.")
      : refusal(401, "Please sign in.");
  }
  if (!isOwner(config, verdict.email)) {
    return refusal(403, "This email can't manage this site.");
  }
  return { email: verdict.email };
}
