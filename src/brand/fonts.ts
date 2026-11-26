export const FONT_ROLES = ["display", "body", "accent"] as const;
export type FontRole = (typeof FONT_ROLES)[number];

export type CuratedFont = {
  id: string;
  /** The Google Fonts family name, exactly as Next's font data spells it. */
  family: string;
  /** What the owner sees in a list. */
  label: string;
  /** Extra variable axes to load (opsz), when the family offers one worth having. */
  axes?: string[];
};

/**
 * The only fonts a site may choose, three roles. Each is one variable Google font with a latin subset, self-hosted by
 * next/font at build time (no third-party font request). The accent role is italic only. The first entry of each role
 * is the template default. src/brand/fonts.test.ts checks every entry against Next's own font data.
 */
export const CURATED_FONTS: Record<FontRole, CuratedFont[]> = {
  display: [
    { id: "outfit", family: "Outfit", label: "Outfit" },
    { id: "manrope", family: "Manrope", label: "Manrope" },
    { id: "sora", family: "Sora", label: "Sora" },
    { id: "dm-sans", family: "DM Sans", label: "DM Sans" },
    { id: "plus-jakarta-sans", family: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
    { id: "fraunces", family: "Fraunces", label: "Fraunces" },
  ],
  body: [
    { id: "inter", family: "Inter", label: "Inter" },
    { id: "source-sans-3", family: "Source Sans 3", label: "Source Sans 3" },
    { id: "work-sans", family: "Work Sans", label: "Work Sans" },
    { id: "nunito-sans", family: "Nunito Sans", label: "Nunito Sans" },
    { id: "figtree", family: "Figtree", label: "Figtree" },
    { id: "lora", family: "Lora", label: "Lora" },
  ],
  accent: [
    { id: "newsreader", family: "Newsreader", label: "Newsreader", axes: ["opsz"] },
    { id: "fraunces", family: "Fraunces", label: "Fraunces", axes: ["opsz"] },
    { id: "lora", family: "Lora", label: "Lora" },
    { id: "playfair-display", family: "Playfair Display", label: "Playfair Display" },
  ],
};

/** The CSS variable each role keeps whatever the choice, so no component changes when a font does. */
const VARIABLES: Record<FontRole, string> = { display: "--hl-outfit", body: "--font-inter", accent: "--font-newsreader" };
const EXPORTS: Record<FontRole, string> = { display: "outfit", body: "inter", accent: "newsreader" };

const importName = (family: string) => family.replace(/\s+/g, "_");

function find(role: FontRole, id: unknown): CuratedFont {
  const font = CURATED_FONTS[role].find((entry) => entry.id === id);
  if (font === undefined) throw new Error(`"${String(id)}" is not an allowed ${role} font. Choose one of: ${CURATED_FONTS[role].map((f) => f.id).join(", ")}.`);
  return font;
}

const axesLine = (font: CuratedFont) => (font.axes?.length ? `\n  axes: ${JSON.stringify(font.axes)},` : "");

export type FontsOptions = {
  /**
   * Preload the accent font too. A site whose first screen sets text in the accent font above the fold turns this on in
   * site.config.ts (`preloadAccentFont`); the template leaves it off, because the accent is below the fold there.
   */
  preloadAccent?: boolean;
};

/**
 * The text of src/lib/fonts.ts for a choice of fonts. Only curated ids reach it (anything else throws), and every
 * identifier and string in it comes from the table above, never from the owner's text.
 */
export function fontsModule(choice: Record<FontRole, string>, options: FontsOptions = {}): string {
  const preloadAccent = options.preloadAccent === true;
  const display = find("display", choice.display);
  const body = find("body", choice.body);
  const accent = find("accent", choice.accent);
  const names = [...new Set([display, body, accent].map((font) => importName(font.family)))].sort();
  return `// Generated from src/content/brand.json by \`npm run sync:config\`; do not edit by hand.
import { ${names.join(", ")} } from "next/font/google";

// Design v3 fonts (docs/STYLE-GUIDE.md §3). Each is self-hosted at build time by next/font; no third-party font tags.
// Preloaded: ${display.family} (header and every heading) and ${body.family} (body) render above the fold on every page; ${accent.family} ${preloadAccent ? "is preloaded too, because the first screen sets text in it above the fold (site.config.ts preloadAccentFont)" : "is below the fold, so it is not"}.

/** Display and UI: headings, nav, buttons, eyebrows, labels. One variable file (wght 100 to 900). */
export const ${EXPORTS.display} = ${importName(display.family)}({
  subsets: ["latin"],${axesLine(display)}
  variable: "${VARIABLES.display}",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

/** Body text. One variable file. */
export const ${EXPORTS.body} = ${importName(body.family)}({
  subsets: ["latin"],${axesLine(body)}
  variable: "${VARIABLES.body}",
  display: "swap",
  preload: true,
});

/** The second voice: ${accent.family} italic only, never roman. */
export const ${EXPORTS.accent} = ${importName(accent.family)}({
  subsets: ["latin"],
  style: ["italic"],${axesLine(accent)}
  variable: "${VARIABLES.accent}",
  display: "swap",
  preload: ${preloadAccent},
});
`;
}
