import { honeypot } from "../src/content/contact-fields.ts";
import { formFiles } from "../src/forms/registry.generated.ts";
import { CONTACT_FORM_ID, FORM_ID_RE, type FormDefinition } from "../src/forms/schema.ts";
import { parseForm, validateSubmission } from "../src/forms/validate.ts";
import { workerConfig, type WorkerConfig } from "./config.ts";
import { sendEmail } from "./email.ts";
import { log, resolveMode, type ContactEnv } from "./env.ts";
import { downloadEmail, formNotificationEmail, formPipelineLead, formSheetRow } from "./form-messages.ts";
import { sendFormLead } from "./form-save.ts";
import { jsonResponse } from "./http.ts";
import type { Saved } from "./messages.ts";
import { readBody } from "./read-body.ts";
import { appendRow } from "./sheets.ts";
import { verifyTurnstile } from "./turnstile.ts";

/**
 * The other forms (docs/EDITING.md, "Forms"): `POST /api/forms/<id>`. It runs the same layers as the contact form
 * (worker/contact.ts, which is untouched): same-origin JSON, body limit, rate limit, honeypot, the shared validation,
 * Turnstile with action "form", then the save, the email to the site owner and, for a download form, the download email.
 * Where it saves is this site's chain, the same as the contact form's: the Pipeline app first (production only, and only
 * while INTAKE_SECRET is set), the Google Sheet (service account; tabs `Forms` and `Forms preview`) when the app did not
 * take it. It never reports success unless the answers reached the owner (the app, the Sheet or the email).
 * Definitions come only from the generated registry (or the list a test passes), always through `parseForm`, so a
 * bundled file that fails the shared check is refused (fail closed).
 */

const MAX_TOKEN_LENGTH = 2048;
const TOKEN_KEY = "turnstileToken";
const FORMS_PREFIX = "/api/forms/";
const DOWNLOAD_HEADERS = { "Auto-Submitted": "auto-replied", "X-Auto-Response-Suppress": "All" };

type ApiBody = { ok: true; delivered?: boolean } | { ok: false; error: "invalid" | "rejected" | "rate_limited" | "failed"; fields?: string[] };

const CSP = { "content-security-policy": "default-src 'none'; frame-ancestors 'none'" };

function json(status: number, body: ApiBody | { error: string }, extra: Record<string, string> = {}): Response {
  return jsonResponse(status, body, { ...CSP, ...extra });
}

export type FormSource = readonly { id: string; data: unknown }[];

export type FormLookup = { kind: "found"; def: FormDefinition } | { kind: "missing" } | { kind: "invalid" };

/** The live definition for an id. Unknown, archived and the contact id are "missing" (404); a file that fails the shared check is "invalid". */
export function findForm(config: WorkerConfig, source: FormSource, id: string): FormLookup {
  if (!FORM_ID_RE.test(id) || id === CONTACT_FORM_ID) return { kind: "missing" };
  const file = source.find((entry) => entry.id === id);
  if (!file) return { kind: "missing" };
  const raw = file.data as { status?: unknown } | null;
  if (raw !== null && typeof raw === "object" && raw.status === "archived") return { kind: "missing" };
  const def = parseForm(file.data, config.forms, id);
  if (!def) return { kind: "invalid" };
  return def.status === "live" ? { kind: "found", def } : { kind: "missing" };
}

async function handleForm(config: WorkerConfig, def: FormDefinition, id: string, request: Request, env: ContactEnv, url: URL): Promise<Response> {
  const mode = resolveMode(env.SITE_ENV, url.hostname, config.workerName, config.previewHostSuffix);
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
  const maxBytes = config.forms.maxBodyBytes;
  if (Number(request.headers.get("content-length") ?? "0") > maxBytes) return json(413, { ok: false, error: "rejected" });
  const text = await readBody(request, maxBytes);
  if (text === null) return json(413, { ok: false, error: "rejected" });

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return json(400, { ok: false, error: "rejected" });
  }
  const keys = new Set<string>([...def.fields.map((field) => field.id), honeypot.name, TOKEN_KEY]);
  if (typeof data !== "object" || data === null || Array.isArray(data) || Object.keys(data).some((key) => !keys.has(key))) {
    return json(400, { ok: false, error: "rejected" });
  }
  const fields = data as Record<string, unknown>;

  const ip = request.headers.get("cf-connecting-ip");
  if (env.CONTACT_RATE_LIMIT) {
    const { success } = await env.CONTACT_RATE_LIMIT.limit({ key: `${id}:${ip ?? "unknown"}` });
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

  const { [honeypot.name]: _trap, [TOKEN_KEY]: _token, ...answers } = fields;
  void _trap;
  void _token;
  const result = validateSubmission(def, answers);
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
      : strict && check.action !== "form"
        ? "action_mismatch"
        : null;
  if (reason) {
    log("turnstile_failed", { reason, codes: check.errorCodes.join(",") });
    return json(403, { ok: false, error: "rejected" });
  }

  const receivedAt = new Date().toISOString();
  if (mode === "development") {
    log("dry_run", { form: true });
    return json(200, { ok: true, ...(def.download ? { delivered: true } : {}) });
  }

  // Fail closed while the site email is unset: no Sheet row, no mail.
  const { siteEmail, fromName, replyFromName, pipelineUrl, sheetTabs } = config.contact;
  if (!siteEmail) {
    log("config_incomplete");
    return json(502, { ok: false, error: "failed" });
  }

  // The Pipeline app first (production only: a preview never puts test leads in the real pipeline), then the Sheet if
  // the app did not take it, so nothing is lost while INTAKE_SECRET is unset or the app is down. Both come before the
  // email so it can say where the answers were saved.
  const submissionId = crypto.randomUUID();
  const app: Saved["app"] = mode !== "production" ? "preview" : !env.INTAKE_SECRET ? "off" : (await sendFormLead(pipelineUrl, env.INTAKE_SECRET, formPipelineLead(def, submission), `${config.editor.host} form`)) ? "saved" : "failed";
  if (app === "off") log("intake_not_configured");
  const tab = mode === "preview" ? sheetTabs.formsPreview : sheetTabs.forms;
  const sheet: Saved["sheet"] = app === "saved" ? "skipped" : (await appendRow(env.GOOGLE_SERVICE_ACCOUNT_KEY, env.GOOGLE_SHEET_ID, tab, formSheetRow(def, submission, mode, receivedAt))) ? "saved" : "failed";
  const saved = app === "saved" || sheet === "saved";
  const notification = formNotificationEmail(def, submission, mode, receivedAt, { app, sheet });
  const visitor = formPipelineLead(def, submission).email;
  const notified = await sendEmail(env.RESEND_API_KEY, { from: `${fromName} <${siteEmail}>`, to: siteEmail, replyTo: visitor, ...notification }, `${submissionId}-notify`, "notify");

  if (!saved && !notified) {
    log("capture_failed");
    return json(502, { ok: false, error: "failed" });
  }
  if (!notified) log(app === "saved" ? "notify_failed_app_saved" : "notify_failed_sheet_saved");

  const { download } = def;
  if (!download) return json(200, { ok: true });
  // The link comes from the site's own address in config, never from the request.
  if (!download.href.startsWith("/files/")) {
    log("download_link_invalid");
    return json(200, { ok: true, delivered: false });
  }
  const email = downloadEmail(config, download, mode, visitor);
  const to = mode === "production" ? visitor : siteEmail;
  const sent = await sendEmail(env.RESEND_API_KEY, { from: `${replyFromName} <${siteEmail}>`, to, replyTo: siteEmail, headers: DOWNLOAD_HEADERS, ...email }, `${submissionId}-download`, "download");
  if (!sent) log("download_email_failed");
  return json(200, { ok: true, delivered: sent });
}

/**
 * Builds the forms handler from a config. The default export uses the real site.config.ts and the generated form
 * registry; the tests pass a fixture config and their own definitions.
 */
export function createFormsWorker(config: WorkerConfig, forms: FormSource = formFiles) {
  return {
    async fetch(request: Request, env: ContactEnv): Promise<Response> {
      const url = new URL(request.url);
      const id = url.pathname.startsWith(FORMS_PREFIX) ? url.pathname.slice(FORMS_PREFIX.length) : null;
      if (id === null) return json(404, { error: "not_found" });
      // An unknown or archived form is a 404 before anything is read, limited or sent.
      const found = findForm(config, forms, id);
      if (found.kind === "missing") return json(404, { error: "not_found" });
      if (found.kind === "invalid") {
        log("form_definition_invalid");
        return json(500, { ok: false, error: "failed" });
      }
      if (request.method !== "POST") return json(405, { error: "method_not_allowed" }, { allow: "POST" });
      return handleForm(config, found.def, id, request, env, url);
    },
  } satisfies ExportedHandler<ContactEnv>;
}

export const FORMS_ROUTE_PREFIX = FORMS_PREFIX;

export default createFormsWorker(workerConfig);
