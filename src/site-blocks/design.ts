// This site's design hooks for the template's block system. Site-owned: a template update never changes this file.
// Import-free apart from relative .ts imports, so plain Node (the design check) and Next both load it.

/** Padding classes of one vertical rhythm: `full` for a block with space above it, `bottom` for one that joins the hero. Tokens only. */
export type RhythmRow = { full: string; bottom: string };

/**
 * Extra rhythm names this site's blocks may use in `placement.rhythm`, beside the template's `hero`, `section` and
 * `compact`. src/blocks/rhythm.ts merges them in; src/blocks/validate.ts refuses a rhythm name that is in neither list.
 * Each is the exact padding one of this site's sections had before the pages became blocks.
 */
export const siteRhythms = {
  /** The Home hero: its own grid sets the space, so the wrapper adds none. */
  flush: { full: "pb-0", bottom: "pb-0" },
  /** Home, "what I'm installing now". */
  installing: { full: "py-12 md:pb-20 md:pt-18", bottom: "pb-12 md:pb-20" },
  /** Home, the two doors. */
  doors: { full: "pb-16 pt-6 md:pb-24 md:pt-12", bottom: "pb-16 md:pb-24" },
  /** Home, "why hire me". */
  why: { full: "pb-16 pt-8 md:pb-24", bottom: "pb-16 md:pb-24" },
  /** Home, the proof. */
  proof: { full: "pb-16 pt-8 md:pb-24 md:pt-0", bottom: "pb-16 md:pb-24" },
  /** Home, the about teaser. */
  teaser: { full: "py-12 md:py-20", bottom: "pb-12 md:pb-20" },
  /** /how-i-work, the three steps in full. */
  steps: { full: "pb-12 pt-4 md:pb-16", bottom: "pb-12 md:pb-16" },
} as const satisfies Record<string, RhythmRow>;

/** A CSS property a keyframes rule may animate beyond the template's list, and why. The reason is checked (20+ characters). */
export type KeyframeProp = { prop: string; reason: string };

/**
 * Properties the design check (scripts/design-rules.mjs, cssMotionProblems) accepts in `@keyframes` in addition to its
 * own list (opacity, transform, translate, scale, rotate, clip-path).
 */
export const siteKeyframeProps: readonly KeyframeProp[] = [
  {
    prop: "stroke-dashoffset",
    reason: "STYLE-GUIDE §9.4: line draws (ticks and BrandArt) use pathLength 1 and animate the dash offset; it repaints, it never changes layout",
  },
];

/** What this site's search-result titles and descriptions may be, and why that is more than the template's 70 and 170. */
export type SeoLimits = { titleMax: number; descriptionMax: number; reason: string };

/**
 * Longer limits for page titles and descriptions. src/blocks/validate.ts takes the larger of these and the template's
 * (70 and 170), never a smaller one. Null keeps the template's limits.
 */
export const siteSeoLimits: SeoLimits | null = {
  titleMax: 80,
  descriptionMax: 200,
  reason: "This site's approved SEO titles and descriptions (docs/website-rev8.md) are longer than the template's defaults and must stay verbatim",
};
