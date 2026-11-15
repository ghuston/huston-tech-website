import { readFileSync } from "node:fs";
import { join } from "node:path";

// The logo. The path data is read from the files in public/brand/ at build time (this is a Server Component in a
// static export), so the mark is never retyped or redrawn (docs/STYLE-GUIDE.md §6.1). The badge is one path with
// three closed subpaths: the ring, the dot and the HL.
function readSvg(file: string) {
  const svg = readFileSync(join(process.cwd(), "public", "brand", file), "utf8");
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
  const d = svg.match(/\sd="([^"]+)"/)?.[1];
  if (!viewBox || !d) throw new Error(`Could not read the logo path from public/brand/${file}`);
  return { viewBox, d };
}

const badge = readSvg("huston-logic-badge-black.svg");
const wordmark = readSvg("huston-logic-wordmark-black.svg");
const [ring] = badge.d.match(/M[^MZ]*Z/g) ?? [];
if (!ring) throw new Error("Could not find the ring subpath in the badge");

const WORDMARK_ASPECT = "aspect-[823.975/133.837]";

/** The three logo shapes as one hidden SVG sprite, drawn once per page by the header. Uses reference them by id. */
export function MarkSprite() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <symbol id="hl-badge" viewBox={badge.viewBox}>
        <path fillRule="evenodd" d={badge.d} />
      </symbol>
      <symbol id="hl-word" viewBox={wordmark.viewBox}>
        <path fillRule="evenodd" d={wordmark.d} />
      </symbol>
      <symbol id="hl-ring" viewBox={badge.viewBox}>
        <path d={ring} />
      </symbol>
    </svg>
  );
}

/** The badge (ring, dot and HL) in `currentColor`. Size it with a width and height class. */
export function Badge({ className = "" }: { className?: string }) {
  return (
    <svg fill="currentColor" aria-hidden="true" focusable="false" className={`hl-badge ${className}`}>
      <use href="#hl-badge" />
    </svg>
  );
}

/** The wordmark in `currentColor`. Give it a height class; the width follows from the aspect ratio. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg fill="currentColor" aria-hidden="true" focusable="false" className={`${WORDMARK_ASPECT} ${className}`}>
      <use href="#hl-word" />
    </svg>
  );
}

/** The badge's ring without the dot or the HL, for the quarter rings that sit in page corners. Decorative. */
export function RingMark({ className = "" }: { className?: string }) {
  return (
    <svg fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <use href="#hl-ring" />
    </svg>
  );
}
