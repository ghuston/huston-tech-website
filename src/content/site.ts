export const siteConfig = {
  name: "Huston Logic",
  founder: "Grant Huston",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hustonlogic.com").replace(/\/+$/, ""),
  /** The Rev 7.1 one-line positioning (docs/website-plan.md, A1). Feeds the JSON-LD description. */
  oneLiner:
    "Huston Logic builds custom websites and fixes the workflows behind them, for small businesses, solo pros and bands. One person does the work, from the first call to the handoff.",
  copyrightYear: 2026,
  /** Footer and bios (docs/website-plan.md, A1 and B10). */
  tagline: "Custom websites and workflows, from hello to handled.",
  footerBrandLine: "Grant Huston · [[Based in Orange County, CA]] · Working with clients anywhere",
  /** Provider-dependent values. `null` renders a visible placeholder and fails `npm run check:placeholders`. */
  email: "info@hustonlogic.com" as string | null,
  schedulerUrl: null as string | null,
  linkedInUrl: "https://www.linkedin.com/in/granthuston/" as string | null,
} as const;

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
  lineArtStyle: false,
} as const;

export const bookCallLabel = "Book a free 20-minute call";
export const bookCallShortLabel = "Book a free call";
export const SCHEDULER_FALLBACK_HREF = "/contact#book";
