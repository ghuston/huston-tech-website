import { contrastRatio } from "./color.ts";

/** The 13 color tokens, in the order the generated palette lists them. */
export const COLOR_TOKENS = [
  "silver",
  "silver2",
  "white",
  "ink",
  "ink2",
  "green",
  "greenDeep",
  "greenEdge",
  "tint",
  "glow",
  "mint",
  "rust",
  "line",
] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];
export type Palette = Record<ColorToken, string>;

export type ContrastPair = { fg: ColorToken; bg: ColorToken; min: 4.5 | 3; where: string };

/**
 * Every foreground and background pair the design puts next to each other, found by reading the classes in
 * src/components, src/blocks and src/app (text-*, bg-*, border-*, outline-*, the focus ring in globals.css). 4.5 is for
 * text; 3 is for large text, icons, control edges and the focus ring. A new component that uses a new pair must add it
 * here (docs/PROCESS.md rule 16).
 *
 * Left out on purpose: tokens that are only decorative (glow, line as a hairline, greenDeep, greenEdge: the code uses
 * none of them behind or as text today), and the small rust dot on the selected contact-form chip, which is aria-hidden
 * while the chip's ink fill and the checked radio carry the selected state.
 */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { fg: "ink", bg: "silver", min: 4.5, where: "body text on the page background" },
  { fg: "ink", bg: "white", min: 4.5, where: "text on white cards and the contact form panel" },
  { fg: "ink", bg: "silver2", min: 4.5, where: "footer links on the footer background" },
  { fg: "ink", bg: "mint", min: 4.5, where: "selected text (the page's text selection highlight)" },
  { fg: "ink", bg: "silver", min: 3, where: "play button icon on the video's silver circle" },
  { fg: "ink2", bg: "silver", min: 4.5, where: "secondary text (captions, the closing call to action note) on the page background" },
  { fg: "ink2", bg: "white", min: 4.5, where: "form hint text and field placeholder text on white" },
  { fg: "ink2", bg: "silver2", min: 4.5, where: "small footer text on the footer background" },
  { fg: "ink2", bg: "white", min: 3, where: "form field border and unselected choice chip border on white" },
  { fg: "green", bg: "silver", min: 4.5, where: "eyebrow text, text links and step numbers on the page background" },
  { fg: "green", bg: "white", min: 4.5, where: "links and eyebrow text on white cards" },
  { fg: "green", bg: "silver", min: 3, where: "list dot on the page background" },
  { fg: "silver", bg: "ink", min: 4.5, where: "primary button label, selected choice chip label, the site notice's text, link and (in silver) its focus ring, and the podcast player's provider name" },
  { fg: "green", bg: "tint", min: 4.5, where: "the date on a post card's tint panel (no photo)" },
  { fg: "ink2", bg: "tint", min: 4.5, where: "a team member's initials on the tint panel (no photo)" },
  { fg: "white", bg: "ink", min: 4.5, where: "skip link text" },
  { fg: "rust", bg: "silver", min: 4.5, where: "error message text on the page background" },
  { fg: "rust", bg: "white", min: 4.5, where: "error message text inside the white contact form panel" },
  { fg: "rust", bg: "silver", min: 3, where: "keyboard focus ring on the page background" },
  { fg: "rust", bg: "white", min: 3, where: "keyboard focus ring on white cards and the form panel" },
  { fg: "rust", bg: "silver2", min: 3, where: "keyboard focus ring on the footer" },
  { fg: "rust", bg: "white", min: 3, where: "field and chip border when a form answer has an error" },
];

export type FailingPair = { fg: ColorToken; bg: ColorToken; ratio: number; min: 4.5 | 3; where: string };

/** The pairs a palette fails, with the ratio it reaches. Empty means every pair keeps its minimum. */
export function failingPairs(palette: Palette): FailingPair[] {
  const out: FailingPair[] = [];
  for (const pair of CONTRAST_PAIRS) {
    const ratio = contrastRatio(palette[pair.fg], palette[pair.bg]);
    if (ratio + 1e-9 < pair.min) out.push({ ...pair, ratio });
  }
  return out;
}
