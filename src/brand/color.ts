export type RGB = { r: number; g: number; b: number };
export type Oklch = { l: number; c: number; h: number };

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Only `#rrggbb` (any case) is a color here; short forms, names and functions are not. */
export function parseHex(value: string): RGB | null {
  if (typeof value !== "string" || !HEX_RE.test(value)) return null;
  return { r: parseInt(value.slice(1, 3), 16), g: parseInt(value.slice(3, 5), 16), b: parseInt(value.slice(5, 7), 16) };
}

const byte = (n: number) => Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, "0");

export function toHex(rgb: RGB): string {
  return `#${byte(rgb.r)}${byte(rgb.g)}${byte(rgb.b)}`;
}

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLinear = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);

function mustParse(hex: string): RGB {
  const rgb = parseHex(hex);
  if (rgb === null) throw new Error(`"${hex}" is not a #rrggbb color`);
  return rgb;
}

/** WCAG 2.2 contrast ratio between two `#rrggbb` colors, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const { r, g, b: blue } = mustParse(hex);
    return 0.2126 * toLinear(r / 255) + 0.7152 * toLinear(g / 255) + 0.0722 * toLinear(blue / 255);
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** sRGB hex to OKLCH (Ottosson). Hue is in degrees, 0 for a grey. */
export function toOklch(hex: string): Oklch {
  const { r, g, b } = mustParse(hex);
  const lr = toLinear(r / 255);
  const lg = toLinear(g / 255);
  const lb = toLinear(b / 255);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(A, B);
  const h = c < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c: c < 1e-4 ? 0 : c, h };
}

function linearRgb({ l, c, h }: Oklch): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const EPS = 1e-6;
const inGamut = (rgb: readonly number[]) => rgb.every((v) => v >= -EPS && v <= 1 + EPS);

/** OKLCH to `#rrggbb`. Chroma is reduced (lightness and hue kept) until the color fits in sRGB. */
export function fromOklch(color: Oklch): string {
  const l = Math.min(1, Math.max(0, color.l));
  let c = Math.max(0, color.c);
  if (!inGamut(linearRgb({ l, c, h: color.h }))) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(linearRgb({ l, c: mid, h: color.h }))) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  const [r, g, b] = linearRgb({ l, c, h: color.h }).map((v) => fromLinear(Math.min(1, Math.max(0, v))) * 255) as [number, number, number];
  return toHex({ r, g, b });
}
