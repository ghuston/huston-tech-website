import { log, retryable, TIMEOUT_MS } from "./env.ts";
import type { FormLead } from "./form-messages.ts";
import { isHttpsOrigin } from "./pipeline-url.ts";

/**
 * Sends one lead from a form other than the contact form to Grant's Pipeline app: the same server-to-server
 * `POST <pipelineUrl>/intake` with the secret in `X-Intake-Secret` that worker/intake.ts uses for the contact form. The
 * contact form's own sender is not changed. Any 2xx means saved. Logs hold fixed event names and status codes only.
 */
export async function sendFormLead(baseUrl: string | null, secret: string, lead: FormLead, source: string): Promise<boolean> {
  if (!baseUrl || !isHttpsOrigin(baseUrl)) {
    log("pipeline_config_missing");
    return false;
  }
  const body = JSON.stringify({ name: lead.name, email: lead.email, ...(lead.business ? { business: lead.business } : {}), message: lead.message, source });
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(new URL("/intake", baseUrl), {
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
