/** Bindings the contact Worker uses (wrangler.jsonc). Secrets are optional here so a missing one fails cleanly at runtime. */
export interface ContactEnv {
  SITE_ENV?: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  GOOGLE_SERVICE_ACCOUNT_KEY?: string;
  GOOGLE_SHEET_ID?: string;
  CONTACT_RATE_LIMIT?: RateLimit;
}

/**
 * - development: `wrangler dev` on localhost. No email, no Sheet: the Worker logs a summary instead.
 * - preview: branch previews. Mail goes only to the site's own address, rows go to the Preview tab.
 * - production: the live site.
 */
export type Mode = "development" | "preview" | "production";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Reads the mode from SITE_ENV, with two guards: development only counts on a local host (so a stray setting can never
 * turn the live form into one that sends nothing), and any workers.dev host other than the production one
 * (`huston-site.<account>.workers.dev`) is treated as a preview. Returns null for anything unexpected.
 */
export function resolveMode(siteEnv: string | undefined, hostname: string): Mode | null {
  if (siteEnv === "development") return LOCAL_HOSTS.has(hostname) ? "development" : null;
  if (siteEnv === "preview") return "preview";
  if (siteEnv === "production") {
    if (hostname.endsWith(".workers.dev") && !hostname.startsWith("huston-site.")) return "preview";
    return "production";
  }
  return null;
}

/** One structured log line. Only fixed event names and numbers: never names, emails, messages, IPs or secrets. */
export function log(event: string, detail: Record<string, string | number | boolean> = {}): void {
  console.log(JSON.stringify({ event, ...detail }));
}

/** Network calls give up after this long, so a slow provider can't hold the visitor's request open. */
export const TIMEOUT_MS = 8000;

/** True for responses worth one retry: rate limits and server errors. */
export function retryable(status: number): boolean {
  return status === 429 || status >= 500;
}
