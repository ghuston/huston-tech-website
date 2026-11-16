/**
 * Provider settings. The contact Worker (worker/contact.ts) reads them too, so this module imports nothing: the Worker
 * cannot load `site.ts`, which reads `process.env`. `site.ts` re-exports them as `siteConfig`.
 * `null` renders a visible placeholder and fails `npm run check:placeholders`.
 */
export const providers = {
  email: "info@hustonlogic.com" as string | null,
  schedulerUrl: null as string | null,
  linkedInUrl: "https://www.linkedin.com/in/granthuston/" as string | null,
  /** Cloudflare Turnstile site key for the contact form. Public by design: it ships in the page. */
  turnstileSiteKey: "0x4AAAAAAGC2jlwc5dlTN92W" as string | null,
};
