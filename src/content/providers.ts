import { siteConfig as base } from "../../site.config.ts";

/**
 * Provider settings, read from site.config.ts (the LinkedIn address stays here: site.config.ts has no field for it).
 * The contact Worker (worker/contact.ts) reads them too, so this module imports only the import-free config: the Worker
 * cannot load `site.ts`, which reads `process.env`. `site.ts` re-exports them as `siteConfig`.
 * `null` renders a visible placeholder and fails `npm run check:placeholders`.
 */
export const providers = {
  email: base.contact.siteEmail as string | null,
  schedulerUrl: base.contact.schedulerUrl as string | null,
  linkedInUrl: "https://www.linkedin.com/in/granthuston/" as string | null,
  /** Cloudflare Turnstile site key for the contact form. Public by design: it ships in the page. */
  turnstileSiteKey: base.contact.turnstileSiteKey as string | null,
};
