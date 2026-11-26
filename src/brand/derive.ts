import { fromOklch, parseHex, toOklch } from "./color.ts";
import { failingPairs, type ColorToken, type Palette } from "./contrast-pairs.ts";

/** The tokens a brand color sets: `green` itself, then these five, derived from it. */
export const COMPANION_TOKENS = ["greenDeep", "greenEdge", "tint", "glow", "mint"] as const;
export type CompanionToken = (typeof COMPANION_TOKENS)[number];
export type Role = "brand" | "accent";

/** OKLCH lightness of a companion, and its chroma as a fraction of the brand color's chroma. */
export type CompanionShape = { l: number; ratio: number };

/**
 * The designed companion shapes, measured on the template palette (brand #1e4fa3). Used when the current brand color
 * is grey (chroma under 0.02), where a ratio could not be read from the current palette.
 */
export const TEMPLATE_COMPANIONS: Record<CompanionToken, CompanionShape> = {
  greenDeep: { l: 0.3652, ratio: 0.79 },
  greenEdge: { l: 0.616, ratio: 0.78 },
  tint: { l: 0.9481, ratio: 0.119 },
  glow: { l: 0.866, ratio: 0.295 },
  mint: { l: 0.9068, ratio: 0.2075 },
};

const GREY_CHROMA = 0.02;
const STEP = 0.005;
const L_MIN = 0.05;
const L_MAX = 0.95;

/** Each companion's lightness and chroma ratio, read from the current palette (or the template when the brand is grey). */
function companionShapes(current: Palette): Record<CompanionToken, CompanionShape> {
  const brand = toOklch(current.green);
  if (brand.c < GREY_CHROMA) return TEMPLATE_COMPANIONS;
  const out = {} as Record<CompanionToken, CompanionShape>;
  for (const token of COMPANION_TOKENS) {
    const own = toOklch(current[token]);
    out[token] = { l: own.l, ratio: own.c / brand.c };
  }
  return out;
}

/** `current` with `green` set to `brand` and the five companions re-derived: own lightness, own chroma ratio, new hue. */
export function deriveFromBrand(current: Palette, brand: string): Palette {
  if (parseHex(brand) === null) throw new Error(`"${brand}" is not a #rrggbb color`);
  const shapes = companionShapes(current);
  const base = toOklch(brand);
  const next: Palette = { ...current, green: brand.toLowerCase() };
  for (const token of COMPANION_TOKENS) {
    const shape = shapes[token];
    next[token] = fromOklch({ l: shape.l, c: base.c * shape.ratio, h: base.h });
  }
  return next;
}

const ROLE_TOKENS: Record<Role, readonly ColorToken[]> = {
  brand: ["green", ...COMPANION_TOKENS],
  accent: ["rust"],
};

/** Whether setting `role` to `value` leaves every contrast pair that involves that role's colors at its minimum. */
export function roleFailures(current: Palette, role: Role, value: string) {
  const next = role === "brand" ? deriveFromBrand(current, value) : { ...current, rust: value.toLowerCase() };
  const involved = ROLE_TOKENS[role];
  return failingPairs(next).filter((pair) => involved.includes(pair.fg) || involved.includes(pair.bg));
}

const distance = (a: ReturnType<typeof toOklch>, b: ReturnType<typeof toOklch>) => {
  const ax = a.c * Math.cos((a.h * Math.PI) / 180);
  const ay = a.c * Math.sin((a.h * Math.PI) / 180);
  const bx = b.c * Math.cos((b.h * Math.PI) / 180);
  const by = b.c * Math.sin((b.h * Math.PI) / 180);
  return Math.hypot(a.l - b.l, ax - bx, ay - by);
};

/**
 * The color closest to `requested` that passes: same hue and chroma (reduced only to stay in sRGB), lightness stepped
 * up and down in 0.005 steps from 0.05 to 0.95, judged on the whole derived palette. Null when no shade of that hue works
 * (or `requested` is not a #rrggbb color).
 */
export function nearestPassing(current: Palette, role: Role, requested: string): string | null {
  if (parseHex(requested) === null) return null;
  if (roleFailures(current, role, requested).length === 0) return requested.toLowerCase();
  const target = toOklch(requested);
  let best: { hex: string; d: number } | null = null;
  for (let step = Math.ceil(L_MIN / STEP); step <= Math.floor(L_MAX / STEP + 1e-9); step++) {
    const hex = fromOklch({ l: step * STEP, c: target.c, h: target.h });
    const d = distance(target, toOklch(hex));
    if (best !== null && d >= best.d) continue;
    if (roleFailures(current, role, hex).length === 0) best = { hex, d };
  }
  return best === null ? null : best.hex;
}
