// This site's design hooks for the template's block system. Site-owned: a template update never changes this file.
// Import-free apart from relative .ts imports, so plain Node (the design check) and Next both load it.

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
