import type { ReactNode } from "react";
import { InViewOnce } from "@/components/ui/InViewOnce";

/*
 * Original line-art illustrations in the style guide's language (docs/STYLE-GUIDE.md §8): a 1.75 green stroke that
 * does not scale, round caps, white fills only where the thing is an object (a card, a page, a station), tint for
 * text blocks and the rust dot from the logo. No text, no faces, no gradients. All four are decorative and hidden
 * from assistive technology; the copy beside each one already says what it shows.
 *
 * `draw` plays a one-time draw-in when the drawing scrolls into view (hl.css "brand art"): outlines draw on, fills
 * fade in after them. It is gated by `html.js` and prefers-reduced-motion, so without JS or with reduced motion the
 * finished drawing shows at once. Use it on at most one drawing per page (AGENTS.md: one focal animation per page).
 */

const WHITE = "var(--hl-white)";
const TINT = "var(--hl-tint)";
const RUST = "var(--hl-rust)";

/** An outline takes part in the draw-in; `pathLength={1}` lets one dash length fit every shape. */
const stroke = { pathLength: 1, "data-draw": "stroke" } as const;
/** A fill fades in once the outlines are drawn. */
const fill = { "data-draw": "fill" } as const;

type Rect = { x: number; y: number; w: number; h: number; rx: number };

/** An object (a card, a page, a screen): a white fill that fades in under an outline that draws on. */
function Box({ x, y, w, h, rx }: Rect) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={WHITE} stroke="none" {...fill} />
      <rect x={x} y={y} width={w} height={h} rx={rx} {...stroke} />
    </>
  );
}

/** A station: a white disc under a drawn ring. */
function Disc({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={WHITE} stroke="none" {...fill} />
      <circle cx={cx} cy={cy} r={r} {...stroke} />
    </>
  );
}

/** A text block or a button, as a filled bar. */
function Bar({ x, y, w, h, tint = false }: { x: number; y: number; w: number; h: number; tint?: boolean }) {
  return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={tint ? TINT : "currentColor"} stroke="none" {...fill} />;
}

/** A list row: a small dot and a line. */
function Row({ x, y, to, r = 3 }: { x: number; y: number; to: number; r?: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={r} fill="currentColor" stroke="none" {...fill} />
      <path d={`M${x + r + 7} ${y} H${to}`} {...stroke} />
    </>
  );
}

type ArtProps = { className?: string; draw?: boolean };

function Art({ viewBox, draw = false, className = "", children }: ArtProps & { viewBox: string; children: ReactNode }) {
  const svg = (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="hl-art block h-auto w-full text-green"
    >
      {children}
    </svg>
  );
  return draw ? (
    <InViewOnce className={`hl-art-draw ${className}`} threshold={0.4}>
      {svg}
    </InViewOnce>
  ) : (
    <div className={className}>{svg}</div>
  );
}

/** The free 20-minute call: the logo's ring as a clock face, with twenty minutes marked from twelve to four. */
export function TwentyMinutesArt(props: ArtProps) {
  return (
    <Art viewBox="0 0 200 200" {...props}>
      <path d="M100 100 L100 34 A66 66 0 0 1 157.16 133 Z" fill={TINT} stroke="none" {...fill} />
      <path d="M150.55 32.91 A84 84 0 1 1 132.82 22.68" {...stroke} />
      <path d="M100 30 V22 M170 100 H178 M100 170 V178 M30 100 H22" {...stroke} />
      <path d="M100 100 V34" {...stroke} />
      <path d="M100 100 L157.16 133" {...stroke} />
      <circle cx="100" cy="100" r="3.5" fill="currentColor" stroke="none" {...fill} />
      <circle cx="142" cy="27.25" r="7" fill={RUST} stroke="none" {...fill} />
    </Art>
  );
}

/** The contact flow: one note leaves the form and lands in three places at once: the inbox, a sheet row, a reply. */
export function ContactFlowArt(props: ArtProps) {
  return (
    <Art viewBox="0 0 320 190" {...props}>
      <Box x={8} y={30} w={116} h={150} rx={10} />
      <rect x="24" y="50" width="84" height="14" rx="4" {...stroke} />
      <rect x="24" y="74" width="84" height="14" rx="4" {...stroke} />
      <rect x="24" y="98" width="84" height="40" rx="4" {...stroke} />
      <Bar x={24} y={150} w={48} h={16} />

      <path d="M124 105 H150 C168 105 172 62 194 62 M124 105 H194 M124 105 H150 C168 105 172 148 194 148" strokeDasharray="4 3.5" {...fill} />
      <circle cx="150" cy="105" r="5" fill={RUST} stroke="none" {...fill} />

      <Box x={196} y={42} w={112} h={40} rx={8} />
      <path d="M196 50 L252 76 L308 50" {...stroke} />

      <Box x={196} y={86} w={112} h={38} rx={6} />
      <path d="M198 106 H306 V116 A6 6 0 0 1 300 122 H204 A6 6 0 0 1 198 116 Z" fill={TINT} stroke="none" {...fill} />
      <path d="M196 105 H308 M232 86 V124 M270 86 V124" {...stroke} />

      <path
        d="M204 128 H300 A8 8 0 0 1 308 136 V160 A8 8 0 0 1 300 168 H226 L206 180 L212 168 H204 A8 8 0 0 1 196 160 V136 A8 8 0 0 1 204 128 Z"
        fill={WHITE}
        stroke="none"
        {...fill}
      />
      <path
        d="M204 128 H300 A8 8 0 0 1 308 136 V160 A8 8 0 0 1 300 168 H226 L206 180 L212 168 H204 A8 8 0 0 1 196 160 V136 A8 8 0 0 1 204 128 Z"
        {...stroke}
      />
      <path d="M212 142 H290 M212 154 H262" {...stroke} />
    </Art>
  );
}

/** A custom website: the same page on a desktop frame and a phone, headline, button and a short list on both. */
export function SiteFramesArt(props: ArtProps) {
  return (
    <Art viewBox="0 0 320 220" {...props}>
      <Box x={8} y={8} w={236} h={168} rx={10} />
      <path d="M8 34 H244" {...stroke} />
      <circle cx="24" cy="21" r="3" {...stroke} />
      <circle cx="36" cy="21" r="3" {...stroke} />
      <circle cx="48" cy="21" r="3" {...stroke} />
      <circle cx="30" cy="52" r="6" {...stroke} />
      <Bar x={168} y={49} w={18} h={6} tint />
      <Bar x={192} y={49} w={18} h={6} tint />
      <Bar x={216} y={49} w={18} h={6} tint />
      <Bar x={24} y={72} w={112} h={12} tint />
      <Bar x={24} y={90} w={84} h={12} tint />
      <Bar x={24} y={114} w={52} h={16} />
      <Row x={160} y={76} to={226} />
      <Row x={160} y={96} to={218} />
      <Row x={160} y={116} to={224} />

      <Box x={228} y={64} w={84} h={148} rx={12} />
      <path d="M258 76 H282" {...stroke} />
      <Bar x={242} y={92} w={56} h={9} tint />
      <Bar x={242} y={106} w={40} h={9} tint />
      <Bar x={242} y={124} w={40} h={13} />
      <Row x={246} y={154} to={298} r={2.5} />
      <Row x={246} y={170} to={292} r={2.5} />
      <Row x={246} y={186} to={296} r={2.5} />
    </Art>
  );
}

type ArtAsideProps = {
  /** The drawing. */
  art: ReactNode;
  /** On phones the drawing is left out (`hidden`, beside long text) or shown small under the text (`below`). */
  phone?: "hidden" | "below";
  /** Vertical alignment of the drawing against the text on desktop. */
  align?: "start" | "center";
  children: ReactNode;
};

/** Text with a drawing beside it from 768px up: the text keeps its measure, the drawing takes a 260px column. */
export function ArtAside({ art, phone = "hidden", align = "start", children }: ArtAsideProps) {
  const phoneClass = phone === "hidden" ? "hidden md:block" : "mt-8 w-[150px] md:mt-0 md:w-auto";
  return (
    <div className={`md:grid md:grid-cols-[minmax(0,1fr)_260px] md:gap-12 lg:gap-16 ${align === "center" ? "md:items-center" : "md:items-start"}`}>
      <div className="min-w-0">{children}</div>
      <div className={phoneClass}>{art}</div>
    </div>
  );
}
