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
  /**
   * Workflow Review price. `null` (the default) keeps every price out of the copy and shows the no-price Review bar.
   * A value such as "$500" switches the Review bar and the Services "Find it" paragraph to their with-price wording.
   */
  reviewPrice: null as string | null,
  /** Hero headline/subhead option from the spec (B1). "A" is the recommended default. */
  heroOption: "A" as HeroOptionId,
} as const;

export type HeroOptionId = "A" | "B" | "C" | "D";

export type FrameworkStepKey = "find" | "fix" | "flick";

export type FrameworkStep = {
  key: FrameworkStepKey;
  number: string;
  /** The step name, used everywhere the framework is named. Changing it here updates every page. */
  label: string;
  /** One word, for the "Find · Fix · Flick" shorthand. */
  short: string;
  /** Past tense, for the case-study strip. */
  past: string;
  oneLiner: string;
};

/** Single source of truth for the Find it / Fix it / Flick it framework. Step zero (the free call) is not a step. */
export const framework: { steps: FrameworkStep[] } = {
  steps: [
    {
      key: "find",
      number: "01",
      label: "Find it",
      short: "Find",
      past: "Found",
      oneLiner: "I trace where the work gets stuck and rank what's worth fixing.",
    },
    {
      key: "fix",
      number: "02",
      label: "Fix it",
      short: "Fix",
      past: "Fixed",
      oneLiner: "I build the change and test it before it touches your live system.",
    },
    {
      key: "flick",
      number: "03",
      label: "Flick it",
      short: "Flick",
      past: "Flicked",
      oneLiner: "Switched on, handed over, off your plate.",
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
  stepThreeName: false,
  lineArtStyle: false,
} as const;

export const bookCallLabel = "Book a free 20-minute call";
export const bookCallShortLabel = "Book a free call";
export const bookCallMobileLabel = "Book a call";
export const SCHEDULER_FALLBACK_HREF = "/contact#book";
