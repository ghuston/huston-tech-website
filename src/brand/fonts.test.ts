import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CURATED_FONTS, FONT_ROLES, fontsModule } from "./fonts.ts";

type FontData = Record<string, { weights: string[]; styles: string[]; subsets: string[]; axes?: { tag: string }[] }>;
const data = JSON.parse(
  readFileSync(new URL("../../node_modules/next/dist/compiled/@next/font/dist/google/font-data.json", import.meta.url), "utf8"),
) as FontData;

test("every curated font is a variable Google font with a latin subset (and italic for the accent)", () => {
  for (const role of FONT_ROLES) {
    for (const font of CURATED_FONTS[role]) {
      const entry = data[font.family];
      assert.ok(entry, `${font.family} is not in Next's font data`);
      assert.ok(entry.weights.includes("variable"), `${font.family} is not variable`);
      assert.ok(entry.subsets.includes("latin"), `${font.family} has no latin subset`);
      if (role === "accent") assert.ok(entry.styles.includes("italic"), `${font.family} has no italic`);
      for (const axis of font.axes ?? []) assert.ok(entry.axes?.some((a) => a.tag === axis), `${font.family} has no ${axis} axis`);
    }
  }
});

test("the curated lists are the ruled ones, defaults first", () => {
  const ids = (role: (typeof FONT_ROLES)[number]) => CURATED_FONTS[role].map((f) => f.id);
  assert.deepEqual(ids("display"), ["outfit", "manrope", "sora", "dm-sans", "plus-jakarta-sans", "fraunces"]);
  assert.deepEqual(ids("body"), ["inter", "source-sans-3", "work-sans", "nunito-sans", "figtree", "lora"]);
  assert.deepEqual(ids("accent"), ["newsreader", "fraunces", "lora", "playfair-display"]);
});

const TODAY_WITH_ACCENT_NOT_PRELOADED = `// Generated from src/content/brand.json by \`npm run sync:config\`; do not edit by hand.
import { Inter, Newsreader, Outfit } from "next/font/google";

// Design v3 fonts (docs/STYLE-GUIDE.md §3). Each is self-hosted at build time by next/font; no third-party font tags.
// Preloaded: Outfit (header and every heading) and Inter (body) render above the fold on every page; Newsreader is below the fold, so it is not.

/** Display and UI: headings, nav, buttons, eyebrows, labels. One variable file (wght 100 to 900). */
export const outfit = Outfit({
  subsets: ["latin"],
  variable: "--hl-outfit",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

/** Body text. One variable file. */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

/** The second voice: Newsreader italic only, never roman. */
export const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
  preload: false,
});
`;

test("fontsModule starts with the generated-file header", () => {
  assert.match(fontsModule({ display: "outfit", body: "inter", accent: "newsreader" }), /^\/\/ Generated from src\/content\/brand\.json by `npm run sync:config`; do not edit by hand\.\n/);
});

test("fontsModule for the defaults is today's fonts.ts, except the accent is not preloaded", () => {
  assert.equal(fontsModule({ display: "outfit", body: "inter", accent: "newsreader" }), TODAY_WITH_ACCENT_NOT_PRELOADED);
});

test("fontsModule keeps the export names and CSS variables whatever the choice", () => {
  const out = fontsModule({ display: "dm-sans", body: "source-sans-3", accent: "playfair-display" });
  assert.match(out, /import \{ DM_Sans, Playfair_Display, Source_Sans_3 \} from "next\/font\/google";/);
  assert.match(out, /export const outfit = DM_Sans\(\{/);
  assert.match(out, /export const inter = Source_Sans_3\(\{/);
  assert.match(out, /export const newsreader = Playfair_Display\(\{/);
  assert.match(out, /--hl-outfit/);
  assert.match(out, /--font-inter/);
  assert.match(out, /--font-newsreader/);
  assert.doesNotMatch(out, /axes/);
});

test("the same family in two roles is imported once and called twice", () => {
  const out = fontsModule({ display: "fraunces", body: "inter", accent: "fraunces" });
  assert.match(out, /import \{ Fraunces, Inter \} from/);
  assert.match(out, /export const outfit = Fraunces\(/);
  assert.match(out, /export const newsreader = Fraunces\(/);
  assert.match(out, /style: \["italic"\],\n  axes: \["opsz"\],/);
});

test("fontsModule throws on an id that is not in the role's list", () => {
  assert.throws(() => fontsModule({ display: "comic-sans", body: "inter", accent: "newsreader" }), /not an allowed display font/);
  assert.throws(() => fontsModule({ display: "outfit", body: "newsreader", accent: "newsreader" }), /not an allowed body font/);
  assert.throws(() => fontsModule({ display: "outfit", body: "inter", accent: 'x"; evil(); //' }), /not an allowed accent font/);
});

test("fontsModule preloads the accent font only when asked (site.config.ts preloadAccentFont), and says so in its comment", () => {
  const choice = { display: "outfit", body: "inter", accent: "newsreader" };
  const on = fontsModule(choice, { preloadAccent: true });
  assert.match(on, /variable: "--font-newsreader",\n {2}display: "swap",\n {2}preload: true,/);
  assert.match(on, /Newsreader is preloaded too, because the first screen sets text in it above the fold/);
  const off = fontsModule(choice, { preloadAccent: false });
  assert.equal(off, fontsModule(choice));
  assert.match(off, /preload: false,/);
  // The preload is the only thing the option changes in the code, apart from the comment.
  const strip = (text: string) => {
    const body = text.replace(/^\/\/ Preloaded:.*$/m, "");
    return body.slice(0, body.lastIndexOf("preload: ")) + "preload: X,\n});\n";
  };
  assert.equal(strip(on), strip(off));
});
