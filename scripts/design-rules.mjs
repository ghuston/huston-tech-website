// The design rules behind `npm run check:design` (spec 5.7, 5.8). Pure functions: text in, plain-words problems out.
// Keep the token classes in step with .claude/hooks/scan-src.mjs.
import { siteKeyframeProps } from "../src/site-blocks/design.ts";

const TOKEN_CLASS = /^(?:rounded-(?:field|btn|card|door|panel|pill|none)|shadow-(?:card|lift|chip|door|none))$/;
const PALETTE = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_PREFIX = "bg|text|border|border-[xytblrse]|ring|ring-offset|outline|fill|stroke|from|via|to|decoration|divide|accent|caret|shadow|placeholder|inset-ring";
const PALETTE_CLASS = new RegExp(`^(?:${COLOR_PREFIX})-(?:${PALETTE})-\\d{2,3}(?:/\\d+)?$`);
const BLACK_CLASS = new RegExp(`^(?:${COLOR_PREFIX})-black(?:/\\d+)?$`);
const ALLOWED_BRACKET_PREFIXES = ["grid-cols", "grid-rows"];
const ARBITRARY_REASON = {
  text: "arbitrary text size; add a step to hl.css and use it",
  font: "arbitrary font; fonts come from the tokens in src/lib/fonts.ts",
  max: "arbitrary width; use a --container-<name> token",
  min: "arbitrary size; use a spacing step or a token",
};

/** Splits a class on colons that are outside square brackets: "md:aria-[x]:bg-ink" -> ["md", "aria-[x]", "bg-ink"]. */
function splitVariants(token) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < token.length; i += 1) {
    const c = token[i];
    if (c === "[") depth += 1;
    else if (c === "]") depth = Math.max(0, depth - 1);
    else if (c === ":" && depth === 0) {
      parts.push(token.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(token.slice(start));
  return parts;
}

const isCommentLine = (line) => /^\s*(?:\/\/|\/\*|\*|\{\/\*)/.test(line);

/** One problem string for a class, or null. */
function classProblem(token) {
  const parts = splitVariants(token);
  const base = parts[parts.length - 1];
  const variants = parts.slice(0, -1);

  for (const v of variants) {
    if (/^(?:min|max)-\[/.test(v)) return "arbitrary breakpoint; use a theme breakpoint (sm, md, lg, split)";
    if (/^[a-z][\w-]*-\[/.test(v) && !/^(?:(?:group|peer)-)?(?:aria|data)-\[/.test(v)) return "bracket variant not allowed; only aria-[...]:, data-[...]: and [&...]: are";
  }

  if (/^\[-{0,2}[a-z][\w-]*:[^\]]*\]$/.test(base)) {
    return /^\[--[\w-]+:var\(--[\w-]+\)\]$/.test(base) ? null : "arbitrary property; only [--name:var(--token)] is allowed";
  }
  if (PALETTE_CLASS.test(base)) return "Tailwind default palette color; use a site color token (ink, silver, green, rust, tint, ...)";
  if (BLACK_CLASS.test(base)) return "Tailwind black; use the ink token";
  if (/^font-(?:sans|serif|mono)$/.test(base)) return "default font family; use font-ui, font-text or font-voice";
  if (/^text-(?:xs|sm|base|lg|xl|[2-9]xl)$/.test(base)) return "Tailwind default font size; use a type step from hl.css";
  if (/^duration-\d+$/.test(base)) return "raw duration; use a motion token (--duration-*)";
  if (/^delay-\d+$/.test(base)) return "raw delay; motion timing comes from tokens";
  if (/^ease-(?:linear|in|out|in-out)$/.test(base)) return "default easing; use a motion token (--ease-*)";
  if (/^animate-/.test(base) && base !== "animate-none") return "animate-* utility; motion lives in hl.css keyframes";
  if (/^(?:rounded|shadow)-[\w[\]/.%-]+$/.test(base) && !TOKEN_CLASS.test(base)) return "radius or shadow outside the tokens (rounded-field/btn/card/door/panel/pill, shadow-card/lift/chip/door)";

  const bracket = /^-?([a-z][\w-]*?)-\[.+\](?:\/\d+)?$/.exec(base);
  if (bracket && !ALLOWED_BRACKET_PREFIXES.includes(bracket[1])) {
    const first = bracket[1].split("-")[0];
    return ARBITRARY_REASON[first] ?? "arbitrary value; use a token or a spacing step";
  }
  return null;
}

const COLOR_FN = /\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/g;
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;

/** Design problems in one component file: `<path>:<line>: <reason> (<class>)`. */
export function designProblems(path, text) {
  const out = [];
  const add = (index, reason, what) => out.push(`${path}:${text.slice(0, index).split("\n").length}: ${reason} (${what})`);
  const lines = text.split("\n");
  let offset = 0;
  for (const raw of lines) {
    const lineStart = offset;
    offset += raw.length + 1;
    if (isCommentLine(raw)) continue;

    for (const m of raw.matchAll(HEX)) {
      if (/(?:href=["']|url\(|to=["'])$/.test(raw.slice(0, m.index))) continue;
      add(lineStart + m.index, "color literal; use a color token", m[0]);
    }
    for (const m of raw.matchAll(COLOR_FN)) add(lineStart + m.index, "color literal; use a color token", m[0]);
    for (const m of raw.matchAll(/\bstyle=/g)) add(lineStart + m.index, "style prop; use a class from the tokens", "style=");

    for (const m of raw.matchAll(/[^\s"'`{}]+/g)) {
      const token = m[0].replace(/^[(,;]+|[,;)]+$/g, "");
      if (!token) continue;
      const problem = classProblem(token);
      if (problem) add(lineStart + m.index, problem, token);
    }
  }

  // Block sections get their spacing from the renderer. The older page primitives in components/hl still carry their own
  // until the hero and closing blocks replace them.
  const isBlockFile = /(?:^|\/)(?:blocks|site-blocks)\//.test(path);
  for (const m of isBlockFile ? text.matchAll(/<section\b[^>]*>/g) : []) {
    for (const t of m[0].split(/[\s"'`{}]+/)) {
      const parts = splitVariants(t);
      if (/^p[ytb]-/.test(parts[parts.length - 1])) add(m.index, "padding on a block's section; the renderer owns the rhythm", t);
    }
  }
  return out;
}

/** Index just past the `}` that closes the `{` at `open`. */
function closeOf(css, open) {
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}" && (depth -= 1) === 0) return i + 1;
  }
  return css.length;
}

const KEYFRAME_PROPS = new Set(["opacity", "transform", "translate", "scale", "rotate", "clip-path", "animation-timing-function"]);
const TIMED = /(?:^|[;{\s])(transition-duration|transition|animation-duration|animation)\s*:\s*([^;}]+)/g;
const LITERAL_TIME = /(?<![\w.-])(?:\d*\.\d+|\d+)m?s\b/g;

const MIN_REASON = 20;
const validProp = (entry) => typeof entry?.prop === "string" && entry.prop !== "" && typeof entry?.reason === "string" && entry.reason.trim().length >= MIN_REASON;

/**
 * Problems in the site's extra keyframe properties (src/site-blocks/design.ts, siteKeyframeProps): each needs a property
 * name and a reason of at least 20 characters. An entry without one is not accepted by cssMotionProblems either.
 */
export function keyframePropProblems(extra = siteKeyframeProps) {
  return extra.flatMap((entry, i) => {
    if (validProp(entry)) return [];
    const name = typeof entry?.prop === "string" && entry.prop !== "" ? `"${entry.prop}"` : `entry ${i + 1}`;
    return [`siteKeyframeProps ${name} in src/site-blocks/design.ts needs a reason of at least ${MIN_REASON} characters (why this property may animate).`];
  });
}

/**
 * Motion problems in the stylesheets: raw times, keyframes that animate layout, a missing reduced-motion switch.
 * `extraProps` are the site's approved keyframe properties (siteKeyframeProps); only entries with a real reason count.
 */
export function cssMotionProblems(css, extraProps = siteKeyframeProps) {
  const out = [];
  const allowed = new Set([...KEYFRAME_PROPS, ...extraProps.filter(validProp).map((entry) => entry.prop)]);
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
  const lineOf = (i) => clean.slice(0, i).split("\n").length;

  for (const m of clean.matchAll(TIMED)) {
    for (const t of m[2].matchAll(LITERAL_TIME)) {
      if (/^0m?s$/.test(t[0])) continue;
      out.push(`line ${lineOf(m.index)}: ${m[1]} uses the literal time ${t[0]}; use a motion token (--duration-*)`);
    }
  }

  for (const m of clean.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)) {
    const open = m.index + m[0].length - 1;
    const body = clean.slice(open + 1, closeOf(clean, open) - 1);
    const props = new Set([...body.matchAll(/([\w-]+)\s*:[^;{}]*(?:;|(?=\}))/g)].map((p) => p[1]));
    for (const p of props) {
      if (!allowed.has(p)) out.push(`line ${lineOf(m.index)}: keyframes ${m[1]} animate ${p}; only ${[...allowed].join(", ")} may animate`);
    }
  }

  let reduced = false;
  for (const m of clean.matchAll(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/g)) {
    const open = m.index + m[0].length - 1;
    const body = clean.slice(open, closeOf(clean, open));
    if (/animation\s*:\s*none\s*!important/.test(body) && /transition\s*:\s*none\s*!important/.test(body)) reduced = true;
  }
  if (!reduced) out.push("the prefers-reduced-motion: reduce block that sets animation and transition to none !important is missing");
  return out;
}

/** Motion declarations in the block registry against the stylesheet. */
export function motionDeclarationProblems(registry, css) {
  const out = [];
  for (const def of registry) {
    const motion = def.motion ?? {};
    if (motion.entrance === "none" && (motion.reason ?? "").trim().length < 20) {
      out.push(`${def.type}: motion "none" needs a reason of at least 20 characters.`);
    }
    if (motion.signature !== undefined) {
      const given = motion.signature.keyframes;
      const name = given.startsWith("hl-signature-") ? given : `hl-signature-${given}`;
      if (!new RegExp(`@keyframes\\s+${name.replace(/[^\w-]/g, "")}\\s*\\{`).test(css)) {
        out.push(`${def.type}: signature animation needs @keyframes ${name} in src/app/hl.css.`);
      }
    }
  }
  return out;
}
