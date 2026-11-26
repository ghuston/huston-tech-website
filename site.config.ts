/**
 * Every per-client value for the site, in one place. This file imports nothing, so the Next.js site, the contact Worker
 * and plain Node scripts (scripts/sync-config.mjs, scripts/check-placeholders.mjs) can all read it.
 *
 * Four files cannot import TypeScript and are generated: wrangler.jsonc, public/_headers, the :root
 * palette in src/app/palette.css and src/lib/fonts.ts. The first two come from this file; the last two come from
 * src/content/brand.json. After editing a value that feeds one of them, run `npm run sync:config` and commit the
 * result; `npm run check:config` fails if they drift.
 *
 * Unknown values are written as [[double-bracket placeholders]]; `npm run build:launch` fails on any left in this file.
 */
export const siteConfig = {
  business: {
    name: "Huston Logic",
    /** Optional. Empty means the business name is used. */
    legalName: "",
    tagline: "Personal websites and software.",
    /** The positioning line. Feeds the JSON-LD description. */
    oneLiner:
      "I build websites and AI-run systems for small businesses, starting with sales follow-up you run by talking. Checked the way a big software team would. Handed over whenever you ask.",
    copyrightYear: 2026,
    // The site notice's last day (src/content/notice.json) is judged in this IANA time zone at build time. The business's
    // other details (email, socials) are in src/content/business.json.
    timeZone: "America/Los_Angeles",
  },
  owner: {
    name: "Grant Huston",
    givenName: "Grant",
    familyName: "Huston",
    role: "Business systems consultant",
    regionLine: "Based in Southern California · Working with clients anywhere",
  },
  domain: {
    url: "https://hustonlogic.com",
    // The Cloudflare Worker's name (wrangler.jsonc `name`). The contact Worker also uses it to tell the
    // production workers.dev host from branch previews.
    workerName: "huston-site",
    previewHostSuffix: ".workers.dev",
    // The branch Workers Builds deploys to production. scripts/finish-build.mjs drops the /blocks showcase from builds of this branch.
    productionBranch: "main",
  },
  contact: {
    // CLIENT: replace. From, notify To and Reply-To. null means not set yet: check:placeholders fails, and the contact
    // Worker refuses to send (502) until it is set.
    siteEmail: "grant@hustonlogic.com" as string | null,
    /** Display name on the notification email. */
    fromName: "Huston Logic",
    /** Display name on the automatic reply. */
    replyFromName: "Grant Huston",
    // CLIENT: replace. null means not chosen yet: check:placeholders fails, the contact page shows a placeholder, and the
    // contact Worker refuses to send (502) because the automatic reply needs a booking link.
    schedulerUrl: "https://calendar.app.google/ZEcZAf9NdPn59i579" as string | null,
    bookingFallbackPath: "/contact#book",
    /**
     * Colors the automatic reply email uses inline (an email cannot read the site's CSS). Wiring, not brand: they keep
     * their value when src/content/brand.json changes. CLIENT: match the brand's green, ink, ink2, rust and line.
     */
    emailColors: { green: "#2B6455", ink: "#29332D", ink2: "#4A5750", rust: "#994D34", line: "#B7C2BC" },
    /** Cloudflare Turnstile site key for the contact form. Public by design: it ships in the page. */
    turnstileSiteKey: "0x4AAAAAAGC2jlwc5dlTN92W" as string | null,
    /**
     * Which code saves each submission to the Google Sheet. "apps-script" (the default) posts to a Google Apps Script web
     * app (docs/apps-script/contact-sheet.gs); "service-account" signs in as a Google service account. The choice sets
     * which names wrangler.jsonc lists under secrets.required (see docs/SECRETS.md).
     */
    sheetWriter: "service-account" as "apps-script" | "service-account",
    /** The tab names in the Sheet: the contact form's two, then the two every other form shares. Generic names; the Apps Script reads the same names from its Script Properties. */
    sheetTabs: { production: "Submissions", preview: "Preview", forms: "Forms", formsPreview: "Forms preview" },
    /**
     * Where each submission is saved. "sheet" (the default) is the Google Sheet above, the fallback. "pipeline" posts it
     * server to server to the client's Pipeline app copy (`pipelineUrl` + "/intake", secret INTAKE_SECRET). The notification
     * email goes to `siteEmail` either way. Which secrets are required follows this setting (`npm run sync:config`).
     * Another tool the client names is not built; its one place in the code is `saveSubmission` in worker/contact.ts.
     */
    destination: "sheet" as "sheet" | "pipeline",
    /** The Pipeline app copy's https origin, such as "https://pipeline.example.com" (no path). Needed when destination is "pipeline". */
    pipelineUrl: "https://pipeline.hustonlogic.com" as string | null,
    rateLimit: {
      limit: 5,
      periodSeconds: 60,
    },
    // CLIENT: replace. Two whole numbers written as strings, unique to this site in its Cloudflare account: bindings with
    // the same id share counters, even across Workers. Take the next free pair from docs/HOSTING.md (new sites start at
    // 2001) and add the row there. 1001 and 1002 are the template's own; `npm run check:config` rejects them on a real site.
    rateLimitIds: { production: "2101", preview: "2102" },
  },
  /**
   * The caps for the forms owners add (docs/superpowers/specs/2026-11-25-forms-and-downloads-design.md, "Settings").
   * Owner-only file: a chat change can never raise them. `maxForms` counts live form files; `maxAnswerChars` is the most
   * characters one form's fields may allow in all; `maxBodyBytes` is the Worker's body limit for a form post (the contact
   * form keeps its own 16 KB).
   */
  forms: { maxForms: 10, maxFields: 12, maxAnswerChars: 8000, maxBodyBytes: 32_768 },
  /**
   * The owner's chat tools (docs/superpowers/specs/2026-11-25-owner-chat-tools-design.md). Off by default: while
   * `enabled` is false the Worker answers only /api/* and wrangler.jsonc gets none of the editor bindings. Owner-only
   * file: a chat change can never add an owner.
   */
  editor: {
    enabled: false,
    /** Who may sign in. Lower-cased when compared. Removing someone takes effect at the next deploy. */
    ownerEmails: [] as string[],
    /** Cloudflare Access: the team name only (for <team>.cloudflareaccess.com) and the Access app's AUD tag. Not secrets. */
    access: { teamDomain: null as string | null, aud: null as string | null },
    /** The GitHub App installed on this site's repo only. appId and installationId are digits written as strings. */
    github: {
      owner: null as string | null,
      repo: null as string | null,
      appId: null as string | null,
      installationId: null as string | null,
      botLogin: null as string | null,
    },
    /** The account's workers.dev subdomain, used to compute preview links. */
    workersSubdomain: null as string | null,
    dailyChangeLimit: 10,
    /** Colors of the owner page (/owner), which the Worker draws itself and so cannot read the site's CSS. Wiring, like contact.emailColors. */
    pageColors: {
      white: "#ffffff",
      ink: "#29332d",
      ink2: "#4a5750",
      silver: "#f3f5f4",
      silver2: "#e8eeea",
      green: "#2b6455",
      greenDeep: "#1e4a3d",
      rust: "#994d34",
      line: "#d3dad6",
      tint: "#e6f1eb",
    },
    /** A whole number written as a string, unique in the Cloudflare account (docs/HOSTING.md). 1003 is the template's own. */
    rateLimitId: "2103",
    /** KV namespace ids (32 hex characters): OAuth tokens, and drafts with change times. */
    kv: { oauth: null as string | null, editor: null as string | null },
    /** Pull request checks that never count when judging whether a change is stuck. */
    ignoredChecks: ["change-report", "change-scope", "Workers Builds"] as string[],
    /**
     * The owner's upload inbox (photos and PDFs). Settings and their reasons: docs/superpowers/specs/2026-11-25-uploads-and-photos-design.md
     * ("Settings"). Needs a private R2 bucket and the Images binding, so it stays off until that setup is done.
     */
    uploads: {
      enabled: false,
      bucket: null as string | null,
      maxPhotoBytes: 20_000_000,
      maxPdfBytes: 10_000_000,
      maxTotalBytes: 200_000_000,
      maxPerDay: 50,
      expireDays: 30,
      types: ["jpeg", "png", "webp", "heic", "pdf"] as ("jpeg" | "png" | "webp" | "heic" | "pdf")[],
    },
  },
  /** Published price text. Empty means none is published (not a launch blocker). */
  prices: { website: "" },
  /** Extra origins appended to the CSP in public/_headers. */
  csp: {
    extraScriptSrc: [] as string[],
    extraConnectSrc: [] as string[],
    extraFrameSrc: [] as string[],
  },
  analytics: { cloudflareWebAnalytics: true },
  /**
   * Header blocks only this site needs, written into public/_headers after the /_next/static/* block by
   * `npm run sync:config`. Each has a comment line (why it exists), the path pattern and the headers.
   */
  extraHeaderBlocks: [
    {
      comment: "Grant's contact card (built by src/app/grant.vcf/route.ts), linked from /card. Phones open it as a contact to save.",
      path: "/grant.vcf",
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": 'attachment; filename="Grant-Huston.vcf"',
        "X-Robots-Tag": "noindex",
      },
    },
  ] as { comment: string; path: string; headers: Record<string, string> }[],
  /** Fonts: the accent font is preloaded when the first screen uses it above the fold (the Home hero's second line). Outfit and Inter always preload. */
  preloadAccentFont: true,
} as const;
