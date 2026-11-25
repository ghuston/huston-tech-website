import { honeypot } from "../src/content/contact-fields.ts";
import { providers } from "../src/content/providers.ts";
import { contactKeys, validateContact, type ContactInput } from "../src/lib/contact-validation.ts";
import { sendEmail } from "./email.ts";
import { log, resolveMode, type ContactEnv } from "./env.ts";
import { sendToPipeline } from "./intake.ts";
import { autoReplyEmail, notificationEmail, sheetRow, type Saved } from "./messages.ts";
import { appendRow } from "./sheets.ts";
import { verifyTurnstile } from "./turnstile.ts";

/**
 * The contact form Worker (docs/website-plan.md E6). wrangler.jsonc runs it only for /api/*; everything else is the
 * static export in ./out. POST /api/contact: same-origin JSON, rate limit, honeypot, the same validation as the form,
 * Turnstile, then the Pipeline app (or, if the app is not set up or fails, the Sheet row), the email to Grant and the
 * automatic reply. It never reports success unless the note reached Grant (the app, the Sheet or the email) and never
 * sends HTML to anyone but the visitor's fixed-template reply.
 */

const MAX_BODY_BYTES = 16 * 1024;
const MAX_TOKEN_LENGTH = 2048;
const TOKEN_KEY = "turnstileToken";
const ALLOWED_KEYS = new Set<string>([...contactKeys, honeypot.name, TOKEN_KEY]);
const SITE_EMAIL = providers.email ?? "grant@hustonlogic.com";
const FROM = `Huston Logic <${SITE_EMAIL}>`;
const REPLY_FROM = `Grant Huston <${SITE_EMAIL}>`;
const REPLY_HEADERS = { "Auto-Submitted": "auto-replied", "X-Auto-Response-Suppress": "All" };
// Used only if providers.schedulerUrl is null. A fixed address, never built from the request, so preview and production match.
const BOOKING_FALLBACK = "https://hustonlogic.com/contact#book";

/** What the form reads. `error` picks the message; `fields` lists the Rev 7.1 field errors. */
type ApiBody = { ok: true; autoReply: boolean } | { ok: false; error: "invalid" | "rejected" | "rate_limited" | "failed"; fields?: string[] };

const SECURITY_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "cross-origin-resource-policy": "same-origin",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
};

function json(status: number, body: ApiBody | { error: string }, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...SECURITY_HEADERS, ...extra } });
}

/** Reads the body as text, stopping as soon as it passes the limit. Returns null when it is too large. */
async function readBody(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function handleContact(request: Request, env: ContactEnv, url: URL): Promise<Response> {
  const mode = resolveMode(env.SITE_ENV, url.hostname);
  if (!mode) {
    log("config_invalid_mode");
    return json(500, { ok: false, error: "failed" });
  }

  // Only the site's own pages may post here. A JSON content type also forces a CORS preflight from anywhere else,
  // and the Worker never answers one.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (request.headers.get("origin") !== url.origin || (fetchSite !== null && fetchSite !== "same-origin")) {
    log("rejected_origin");
    return json(403, { ok: false, error: "rejected" });
  }
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return json(415, { ok: false, error: "rejected" });
  }
  if (Number(request.headers.get("content-length") ?? "0") > MAX_BODY_BYTES) return json(413, { ok: false, error: "rejected" });
  const text = await readBody(request, MAX_BODY_BYTES);
  if (text === null) return json(413, { ok: false, error: "rejected" });

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return json(400, { ok: false, error: "rejected" });
  }
  if (typeof data !== "object" || data === null || Array.isArray(data) || Object.keys(data).some((key) => !ALLOWED_KEYS.has(key))) {
    return json(400, { ok: false, error: "rejected" });
  }
  const fields = data as Record<string, unknown>;

  const ip = request.headers.get("cf-connecting-ip");
  if (env.CONTACT_RATE_LIMIT) {
    const { success } = await env.CONTACT_RATE_LIMIT.limit({ key: ip ?? "unknown" });
    if (!success) {
      log("rate_limited");
      return json(429, { ok: false, error: "rate_limited" });
    }
  } else {
    log("rate_limit_binding_missing");
  }

  // The spam trap gets an honest error, never a pretend success.
  const trap = fields[honeypot.name];
  if (trap !== undefined && trap !== "") {
    log("honeypot_filled");
    return json(400, { ok: false, error: "rejected" });
  }

  const result = validateContact(fields as ContactInput);
  if (!result.ok) {
    if (result.malformed || result.fields.length === 0) return json(400, { ok: false, error: "rejected" });
    return json(400, { ok: false, error: "invalid", fields: result.fields });
  }
  const submission = result.value;

  // A missing or refused secret is our fault, not the visitor's: answer "failed" (502), never "couldn't verify".
  if (!env.TURNSTILE_SECRET_KEY) {
    log("turnstile_config_missing");
    return json(502, { ok: false, error: "failed" });
  }
  const token = fields[TOKEN_KEY];
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    log("turnstile_token_missing");
    return json(403, { ok: false, error: "rejected" });
  }
  const check = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip);
  if (check.unavailable) {
    log("turnstile_unavailable", { codes: check.errorCodes.join(",") });
    return json(502, { ok: false, error: "failed" });
  }
  // Cloudflare's test keys (local development only) return no action and hostname "example.com".
  const strict = mode !== "development";
  const reason = !check.success
    ? "not_success"
    : strict && check.hostname !== url.hostname
      ? "hostname_mismatch"
      : strict && check.action !== "contact"
        ? "action_mismatch"
        : null;
  if (reason) {
    log("turnstile_failed", { reason, codes: check.errorCodes.join(",") });
    return json(403, { ok: false, error: "rejected" });
  }

  const receivedAt = new Date().toISOString();
  if (mode === "development") {
    log("dry_run", { messageLength: submission.message.length });
    return json(200, { ok: true, autoReply: true });
  }

  // The Pipeline app comes first (production only: a preview never puts test leads in the real pipeline), then the
  // Sheet if the app did not take it, so nothing is lost while INTAKE_SECRET is unset or the app is down. Both come
  // before the email so it can say where the submission was saved.
  const id = crypto.randomUUID();
  const app: Saved["app"] = mode !== "production" ? "preview" : !env.INTAKE_SECRET ? "off" : (await sendToPipeline(env.INTAKE_SECRET, submission)) ? "saved" : "failed";
  if (app === "off") log("intake_not_configured");
  const sheet: Saved["sheet"] =
    app === "saved" ? "skipped" : (await appendRow(env.GOOGLE_SERVICE_ACCOUNT_KEY, env.GOOGLE_SHEET_ID, mode === "preview" ? "Preview" : "Submissions", sheetRow(submission, mode, receivedAt))) ? "saved" : "failed";
  const saved = app === "saved" || sheet === "saved";
  const notification = notificationEmail(submission, mode, receivedAt, { app, sheet });
  const notified = await sendEmail(env.RESEND_API_KEY, { from: FROM, to: SITE_EMAIL, replyTo: submission.email, ...notification }, `${id}-notify`, "notify");

  if (!saved && !notified) {
    log("capture_failed");
    return json(502, { ok: false, error: "failed" });
  }
  if (!notified) log(app === "saved" ? "notify_failed_app_saved" : "notify_failed_sheet_saved");

  const reply = autoReplyEmail(submission, mode, providers.schedulerUrl ?? BOOKING_FALLBACK);
  const recipient = mode === "production" ? submission.email : SITE_EMAIL;
  const autoReplied = await sendEmail(env.RESEND_API_KEY, { from: REPLY_FROM, to: recipient, replyTo: SITE_EMAIL, headers: REPLY_HEADERS, ...reply }, `${id}-reply`, "auto_reply");
  if (!autoReplied) log("auto_reply_failed");

  return json(200, { ok: true, autoReply: autoReplied });
}

export default {
  async fetch(request: Request, env: ContactEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/api/contact") return json(404, { error: "not_found" });
    if (request.method !== "POST") return json(405, { error: "method_not_allowed" }, { allow: "POST" });
    return handleContact(request, env, url);
  },
} satisfies ExportedHandler<ContactEnv>;
