import { log, TIMEOUT_MS } from "./env.ts";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult = { success: boolean; hostname?: string; action?: string };

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
      return { success: false };
    }
    const data = (await response.json()) as { success?: unknown; hostname?: unknown; action?: unknown };
    return {
      success: data.success === true,
      hostname: typeof data.hostname === "string" ? data.hostname : undefined,
      action: typeof data.action === "string" ? data.action : undefined,
    };
  } catch {
    log("turnstile_unreachable");
    return { success: false };
  }
}
