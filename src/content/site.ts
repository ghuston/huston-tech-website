import { siteConfig as base } from "../../site.config.ts";
import { providers } from "./providers.ts";

export const siteConfig = {
  name: base.business.name,
  founder: base.owner.name,
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? base.domain.url).replace(/\/+$/, ""),
  /** The Rev 8 Home meta description (docs/website-rev8.md, B1). Feeds the JSON-LD description. */
  oneLiner: base.business.oneLiner,
  copyrightYear: base.business.copyrightYear,
  /** The About headshot's alt text. */
  headshotAlt: "Grant Huston",
  /** Footer and bios (docs/website-rev8.md, Section A). */
  tagline: base.business.tagline,
  footerBrandLine: `${base.owner.name} · ${base.owner.regionLine}`,
  /** Provider-dependent values, set in `providers.ts`. */
  email: providers.email,
  schedulerUrl: providers.schedulerUrl,
  linkedInUrl: providers.linkedInUrl,
  turnstileSiteKey: providers.turnstileSiteKey,
} as const;

export type Offer = { name: string; line: string; button: string; href: string };

/** The two offers (docs/website-rev8.md, Section A; door copy from B1 section 3). */
export const offers = {
  website: {
    name: "Accelerated Websites",
    line: "Custom-designed, AI-accelerated, owned by you. Want something changed? Say it in a sentence. It's checked before it goes live.",
    button: "Start a website →",
    href: "/contact?topic=website",
  },
  system: {
    name: "AI-Centric System Redesign",
    line: "A system you run through your AI app. Big companies are rebuilding around AI. I do the same for a business your size, starting with sales follow-up.",
    button: "See the system →",
    href: "/systems",
  },
} as const satisfies Record<string, Offer>;

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
      oneLiner: "Live, and handed over whenever you ask.",
    },
  ],
};

/**
 * Launch gate for the open decisions in the spec (E9 #8-11). Flip a flag to `true` once Grant has confirmed the choice;
 * `npm run check:placeholders` fails while any flag is `false`.
 */
export const decisionsConfirmed = {
  lineArtStyle: true,
} as const;

export const bookCallLabel = "Book a free 20-minute call";
export const SCHEDULER_FALLBACK_HREF = "/contact#book";
