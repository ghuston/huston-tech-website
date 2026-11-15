import { Outfit } from "next/font/google";

// Design v3 fonts (docs/STYLE-GUIDE.md §3). Only Outfit is new. Inter and Newsreader reuse the declarations in
// layout.tsx:
// - Inter: Google serves the same variable file whatever weight range is asked for.
// - Newsreader: next/font/google names every family exactly "Newsreader", so a second declaration (italic 400 only)
//   would merge with v1's italic 200-800 face and the browser would pick between them by declaration order. v1's
//   italic is a variable file with the optical-size axis, which is the cut the approved reference uses, so v3 uses it.
//   A lighter italic-400-only file (next/font/local, under a new family name) is a later optimization, not a PR 2 job.
//
// Outfit is preloaded because the v3 header renders it above the fold on every page (one 31.5 KB variable file).

/** Display and UI: headings, nav, buttons, eyebrows, labels. One variable file (wght 100 to 900). */
export const outfit = Outfit({
  subsets: ["latin"],
  variable: "--hl-outfit",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
