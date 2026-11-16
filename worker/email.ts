import { log, retryable, TIMEOUT_MS } from "./env.ts";

const RESEND = "https://api.resend.com/emails";

export type OutgoingEmail = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  /** Plain text only. The Worker never sends HTML, so nothing a visitor types can become markup. */
  text: string;
};

/**
 * Sends one email through Resend. Retries once on a rate limit, server error or network failure; the idempotency key
 * makes sure a retry can't send the same email twice. Returns whether Resend accepted it.
 */
export async function sendEmail(apiKey: string | undefined, email: OutgoingEmail, idempotencyKey: string, kind: string): Promise<boolean> {
  if (!apiKey) {
    log("email_config_missing", { kind });
    return false;
  }
  const body = JSON.stringify({ from: email.from, to: [email.to], reply_to: email.replyTo, subject: email.subject, text: email.text });
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(RESEND, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": idempotencyKey },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.ok) return true;
      log("email_failed", { kind, status: response.status, attempt });
      if (!retryable(response.status)) return false;
    } catch {
      log("email_unreachable", { kind, attempt });
    }
  }
  return false;
}
