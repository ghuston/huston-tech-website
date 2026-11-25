import type { ContactSubmission } from "../src/lib/contact-validation.ts";
import { log, retryable, TIMEOUT_MS } from "./env.ts";
import { needLabel } from "./messages.ts";

/**
 * Sends one submission to Grant's Pipeline app (`POST /intake`, the Pipeline README's "Connect a website form"). It is
 * server to server: the secret goes in the `X-Intake-Secret` header from this Worker and never reaches browser code.
 * The app wants name, email and message; its optional `business` and `source` are filled, and the form's other
 * answers go into the message text, labelled. Any 2xx means the lead is saved (201 added, 200 repeat).
 */

const INTAKE_URL = "https://pipeline.hustonlogic.com/intake";
const SOURCE = "hustonlogic.com contact form";
/** The app's limit for `message`, in characters (Pipeline README). Kept apart from the form's limit: the labels add to it. */
const MAX_MESSAGE = 5000;
const CUT_NOTE = "… [cut here; the full text is in the email to Grant]";

/** The app's `message`: the form's labelled extras (empty ones left out), a blank line, then what the visitor wrote. */
export function intakeMessage(s: ContactSubmission): string {
  const extras = [
    `Need: ${needLabel(s)}`,
    s.topic ? `Topic link: ${s.topic}` : "",
    s.tools ? `Uses today: ${s.tools}` : "",
    s.website ? `Current website: ${s.website}` : "",
    s.source ? `Heard about Huston Logic: ${s.source}` : "",
  ].filter(Boolean);
  const head = `${extras.join("\n")}\n\n`;
  const room = MAX_MESSAGE - head.length;
  if (s.message.length <= room) return `${head}${s.message}`;
  let cut = s.message.slice(0, Math.max(room - CUT_NOTE.length, 0));
  // Never end on half of an emoji: a lone surrogate is not valid text for the app's JSON reader.
  if (/[\ud800-\udbff]$/.test(cut)) cut = cut.slice(0, -1);
  return `${head}${cut}${CUT_NOTE}`;
}

/** Posts the submission. Retries once on a rate limit, server error or network failure; the app ignores an exact repeat. */
export async function sendToPipeline(secret: string, s: ContactSubmission): Promise<boolean> {
  const body = JSON.stringify({ name: s.name, email: s.email, ...(s.business ? { business: s.business } : {}), message: intakeMessage(s), source: SOURCE });
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(INTAKE_URL, {
        method: "POST",
        // Never follow a redirect: it would resend the secret and the visitor's details to wherever it points. A 3xx is a failure.
        redirect: "manual",
        headers: { "content-type": "application/json", "x-intake-secret": secret },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.ok) return true;
      log("intake_failed", { status: response.status, attempt });
      if (!retryable(response.status)) return false;
    } catch {
      log("intake_unreachable", { attempt });
    }
  }
  return false;
}
