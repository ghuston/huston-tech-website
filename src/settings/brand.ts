import { parseHex } from "../brand/color.ts";
import { COLOR_TOKENS, failingPairs, type ColorToken, type FailingPair, type Palette } from "../brand/contrast-pairs.ts";
import { COMPANION_TOKENS, nearestPassing, type Role } from "../brand/derive.ts";
import { CURATED_FONTS, FONT_ROLES, type FontRole } from "../brand/fonts.ts";
import type { Fields } from "../blocks/schema.ts";
import type { Repo } from "../blocks/validate.ts";
import { checkFields, isRecord } from "./check.ts";

export type Logo = { src: string; alt: string; width: number; height: number };

export type BrandData = {
  colors: Palette;
  fonts: Record<FontRole, string>;
  /** Null means the business name is shown as text. */
  logo: Logo | null;
};

export const LOGO_SRC_RE = /^\/images\/uploads\/[a-z0-9]{8}\.webp$/;
export const LOGO_MIN_WIDTH = 160;
export const LOGO_MIN_HEIGHT = 80;
export const LOGO_MAX_RATIO = 6;

const WHERE = "brand.json";
const KEYS = ["colors", "fonts", "logo"];
const BRAND_TOKENS: readonly ColorToken[] = ["green", ...COMPANION_TOKENS];

const ROLE_NAME: Record<Role, string> = { brand: "brand color", accent: "accent color" };

/** The role (brand or accent) a color token belongs to, or null for the neutrals, which Huston Logic sets. */
function roleOf(token: ColorToken): Role | null {
  if (token === "rust") return "accent";
  return BRAND_TOKENS.includes(token) ? "brand" : null;
}

const floorOne = (n: number) => (Math.floor(n * 10) / 10).toFixed(1);

function pairMessage(pair: FailingPair, colors: Palette, suggestions: Map<Role, string | null>): string {
  const role = roleOf(pair.fg) ?? roleOf(pair.bg);
  const reach = `reaches ${floorOne(pair.ratio)} to 1 and needs ${pair.min} to 1`;
  if (role === null) {
    return `${WHERE}: the colors for ${pair.where} (${colors[pair.fg]} on ${colors[pair.bg]}) ${reach}. These are text and background colors that Huston Logic sets, so they are not changed by chat; Huston Logic can help.`;
  }
  const token: ColorToken = role === "accent" ? "rust" : "green";
  const near = suggestions.get(role);
  const fix =
    near === null || near === undefined
      ? `No shade of that color works with this site's design; Huston Logic can help.`
      : `The nearest ${ROLE_NAME[role]} that works is ${near}.`;
  return `${WHERE}: the ${ROLE_NAME[role]} ${colors[token]} is not strong enough for ${pair.where}: it ${reach}. ${fix}`;
}

function colorProblems(colors: unknown): string[] {
  if (!isRecord(colors)) return [`${WHERE}: "colors" must be an object with the ${COLOR_TOKENS.length} colors.`];
  const out: string[] = [];
  for (const key of Object.keys(colors)) {
    if (!(COLOR_TOKENS as readonly string[]).includes(key)) out.push(`${WHERE}: "${key}" is not a color this site has. The colors are ${COLOR_TOKENS.join(", ")}.`);
  }
  for (const token of COLOR_TOKENS) {
    const value = colors[token];
    if (value === undefined) out.push(`${WHERE}: the color "${token}" is missing.`);
    else if (typeof value !== "string" || parseHex(value) === null) out.push(`${WHERE}: the color "${token}" is ${JSON.stringify(value)}; write it as #rrggbb, like #1e4fa3.`);
  }
  return out;
}

function fontProblems(fonts: unknown): string[] {
  if (!isRecord(fonts)) return [`${WHERE}: "fonts" must be an object with ${FONT_ROLES.join(", ")}.`];
  const out: string[] = [];
  for (const key of Object.keys(fonts)) {
    if (!(FONT_ROLES as readonly string[]).includes(key)) out.push(`${WHERE}: "${key}" is not a font role. The roles are ${FONT_ROLES.join(", ")}.`);
  }
  for (const role of FONT_ROLES) {
    const id = fonts[role];
    const options = CURATED_FONTS[role].map((font) => font.id);
    if (typeof id !== "string" || !options.includes(id)) {
      out.push(`${WHERE}: the ${role} font ${JSON.stringify(id)} is not one this site offers. Choose one of: ${options.join(", ")}.`);
    }
  }
  return out;
}

const LOGO_IMAGE: Fields = { logo: { kind: "image", label: "Logo", shape: "3:2" } };
const LOGO_KEYS = ["src", "alt", "width", "height"];

function logoProblems(logo: unknown, repo: Repo): string[] {
  if (logo === null) return [];
  if (!isRecord(logo)) return [`${WHERE}: "logo" must be null (the business name as text) or an uploaded image with its alt text and size.`];
  const out: string[] = [];
  for (const key of Object.keys(logo)) {
    if (!LOGO_KEYS.includes(key)) out.push(`${WHERE}: "logo" has "${key}", which a logo does not take. It accepts: ${LOGO_KEYS.join(", ")}.`);
  }
  const { src, alt, width, height } = logo;
  if (typeof src === "string" && !LOGO_SRC_RE.test(src)) {
    out.push(`${WHERE}: the logo "${src}" must be a photo from the owner's upload inbox, like /images/uploads/k3x9q2mz.webp.`);
  }
  // Same rules as every image: the file exists, and the alt text describes it (not a file name or a generic word).
  const image = checkFields(LOGO_IMAGE, { logo: { src, alt } }, WHERE, { repo, pages: null });
  out.push(...image.filter((message) => !(typeof src === "string" && !LOGO_SRC_RE.test(src) && /is not an image under \/images\//.test(message))));
  const sizeOk = Number.isInteger(width) && Number.isInteger(height) && (width as number) > 0 && (height as number) > 0;
  if (!sizeOk) {
    out.push(`${WHERE}: the logo needs "width" and "height" as whole numbers of pixels.`);
    return out;
  }
  const w = width as number;
  const h = height as number;
  if (w < LOGO_MIN_WIDTH || h < LOGO_MIN_HEIGHT) {
    out.push(`${WHERE}: the logo is ${w} by ${h} pixels; it must be at least ${LOGO_MIN_WIDTH} wide and ${LOGO_MIN_HEIGHT} tall so it stays sharp in the header.`);
  }
  if (w / h > LOGO_MAX_RATIO || h > w) {
    out.push(`${WHERE}: the logo is ${w} by ${h} pixels; its shape must be between square and six times wider than tall so it fits the header.`);
  }
  return out;
}

/** Why `brand.json` is not acceptable, in plain words (the owner's terms); empty when it is. */
export function validateBrand(data: unknown, repo: Repo): string[] {
  if (!isRecord(data)) return [`${WHERE}: the file must be an object.`];
  const out: string[] = [];
  for (const key of Object.keys(data)) {
    if (!KEYS.includes(key)) out.push(`${WHERE}: "${key}" is not a brand setting. It accepts: ${KEYS.join(", ")}.`);
  }
  for (const key of KEYS) if (data[key] === undefined) out.push(`${WHERE}: "${key}" is required.`);

  const colors = data["colors"] === undefined ? [] : colorProblems(data["colors"]);
  out.push(...colors);
  if (data["colors"] !== undefined && colors.length === 0) {
    const palette = data["colors"] as Palette;
    const failures = failingPairs(palette);
    const suggestions = new Map<Role, string | null>();
    for (const pair of failures) {
      const role = roleOf(pair.fg) ?? roleOf(pair.bg);
      if (role !== null && !suggestions.has(role)) suggestions.set(role, nearestPassing(palette, role, palette[role === "accent" ? "rust" : "green"]));
    }
    for (const pair of failures) out.push(pairMessage(pair, palette, suggestions));
  }
  if (data["fonts"] !== undefined) out.push(...fontProblems(data["fonts"]));
  if (data["logo"] !== undefined) out.push(...logoProblems(data["logo"], repo));
  return out;
}
