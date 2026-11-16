import { log, TIMEOUT_MS } from "./env.ts";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * `unavailable`: the check couldn't run because of our side (siteverify unreachable, or Cloudflare refused our
 * secret), so the visitor did nothing wrong. `errorCodes` are Cloudflare's fixed codes, safe to log.
 */
export type TurnstileResult = { success: boolean; hostname?: string; action?: string; errorCodes: string[]; unavailable: boolean };

/** Siteverify codes that mean our configuration is wrong, not the visitor's token. */
const CONFIG_ERRORS = new Set(["missing-input-secret", "invalid-input-secret"]);

function codes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((c): c is string => typeof c === "string" && /^[a-z0-9-]{1,40}$/.test(c)).slice(0, 5);
}

/** Server-side check of a Turnstile token. Any network or parse problem counts as a failure. */
export async function verifyTurnstile(secret: string, token: string, remoteip: string | null): Promise<TurnstileResult> {
  try {
    const response = await fetch(SITEVERIFY, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: remoteip ?? undefined, idempotency_key: crypto.randomUUID() }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      log("turnstile_http_error", { status: response.status });
      return { success: false, errorCodes: [], unavailable: true };
    }
    const data = (await response.json()) as { success?: unknown; hostname?: unknown; action?: unknown; "error-codes"?: unknown };
    const errorCodes = codes(data["error-codes"]);
    return {
      success: data.success === true,
      hostname: typeof data.hostname === "string" ? data.hostname : undefined,
      action: typeof data.action === "string" ? data.action : undefined,
      errorCodes,
      unavailable: errorCodes.some((c) => CONFIG_ERRORS.has(c)),
    };
  } catch {
    log("turnstile_unreachable");
    return { success: false, errorCodes: [], unavailable: true };
  }
}
