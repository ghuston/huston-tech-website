export const siteConfig = {
  name: "Huston Tech",
  founder: "Grant Huston",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hustontech.com").replace(/\/+$/, ""),
  oneLiner:
    "Huston Tech fixes the operational headaches that pile up when a small business grows faster than its systems. It starts with the tools the business already pays for.",
  copyrightYear: 2026,
  /** Provider-dependent values. `null` renders a visible placeholder and fails `npm run check:placeholders`. */
  email: null as string | null,
  emailPlaceholder: "hello@hustontech.com",
  schedulerUrl: null as string | null,
  linkedInUrl: null as string | null,
} as const;

export const bookCallLabel = "Book a free 20-minute call";
export const bookCallShortLabel = "Book a free call";
export const bookCallMobileLabel = "Book a call";
export const SCHEDULER_FALLBACK_HREF = "/contact#book";
