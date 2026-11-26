// Generated from src/content/brand.json by `npm run sync:config`; do not edit by hand.
import { Inter, Newsreader, Outfit } from "next/font/google";

// Design v3 fonts (docs/STYLE-GUIDE.md §3). Each is self-hosted at build time by next/font; no third-party font tags.
// Preloaded: Outfit (header and every heading) and Inter (body) render above the fold on every page; Newsreader is preloaded too, because the first screen sets text in it above the fold (site.config.ts preloadAccentFont).

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
  preload: true,
});
