export const siteConfig = {
  name: "Huston Tech",
  founder: "Grant Huston",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hustonlogic.com").replace(/\/+$/, ""),
  oneLiner:
    "Huston Tech fixes the operational headaches that pile up when a small business grows faster than its systems. It starts with the tools the business already pays for.",
  copyrightYear: 2026,
  /** Footer and bios (docs/website-plan.md, A1 and B10). Read by the v3 footer from PR 5. */
  tagline: "Custom websites and workflows, from hello to handled.",
  footerBrandLine: "Grant Huston · [[Based in Orange County, CA]] · Working with clients anywhere",
  /** Provider-dependent values. `null` renders a visible placeholder and fails `npm run check:placeholders`. */
  email: null as string | null,
  emailPlaceholder: "hello@hustontech.com",
  schedulerUrl: null as string | null,
  linkedInUrl: null as string | null,
  /**
   * Workflow Review price. `null` (the default) keeps every price out of the copy and shows the no-price Review bar.
   * A value such as "$500" switches the Review bar and the Services "Scope it" paragraph to their with-price wording.
   */
  reviewPrice: null as string | null,
  /** Hero headline/subhead option from the spec (B1). "A" is the recommended default. */
  heroOption: "A" as HeroOptionId,
} as const;

export type HeroOptionId = "A" | "B" | "C" | "D";

export type FrameworkStepKey = "scope" | "shape" | "ship";

export type FrameworkStep = {
  key: FrameworkStepKey;
  number: string;
  /** The step name, used everywhere the framework is named. Changing it here updates every page. */
  label: string;
  /** Past tense, for the case-study strip. */
  past: string;
  oneLiner: string;
};

/** Single source of truth for the Scope it / Shape it / Ship it framework (Revision 7.1). Step zero (the free call) is not a step. */
export const framework: { steps: FrameworkStep[] } = {
  steps: [
    {
      key: "scope",
      number: "01",
      label: "Scope it",
      past: "Scoped",
      oneLiner: "Plan and price, before I build.",
    },
    {
      key: "shape",
      number: "02",
      label: "Shape it",
      past: "Shaped",
      oneLiner: "Built, then I try to break it.",
    },
    {
      key: "ship",
      number: "03",
      label: "Ship it",
      past: "Shipped",
      oneLiner: "Live, and the logins are yours.",
    },
  ],
};

/**
 * Launch gate for the open decisions in the spec (E9 #8-11). Flip a flag to `true` once Grant has confirmed the choice;
 * `npm run check:placeholders` fails while any flag is `false`.
 */
export const decisionsConfirmed = {
  heroOption: false,
  reviewPrice: false,
  lineArtStyle: false,
} as const;

export const bookCallLabel = "Book a free 20-minute call";
export const bookCallShortLabel = "Book a free call";
export const bookCallMobileLabel = "Book a call";
export const SCHEDULER_FALLBACK_HREF = "/contact#book";
