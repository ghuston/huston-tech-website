// Items and settings in proposals: the pieces the service uses besides the page code. Pure helpers, no I/O.
import { LOGO_MAX_RATIO, LOGO_MIN_HEIGHT, LOGO_MIN_WIDTH } from "../../src/settings/brand.ts";
import { SETTINGS_NAMES, type SettingsName } from "../../src/collections/site-validate.ts";
import { pageValueFor } from "../uploads/paths.ts";
import { isObject } from "./json.ts";
import type { Snapshot } from "./site-reader.ts";
import type { ProposalUpload } from "./uploads.ts";
import { AGENCY_NAME } from "./words.ts";

const ITEM_PREFIX = "item:";
const SETTINGS_PREFIX = "settings:";
const FORM_PREFIX = "form:";

/** Pages, items and settings under one map of keys, so upload references can be resolved in all of them at once. */
export function combineDocuments(
  pages: ReadonlyMap<string, unknown>,
  items: ReadonlyMap<string, unknown>,
  settings: ReadonlyMap<string, unknown>,
  forms: ReadonlyMap<string, unknown> = new Map(),
): Map<string, unknown> {
  const out = new Map<string, unknown>(pages);
  for (const [key, value] of items) out.set(`${ITEM_PREFIX}${key}`, value);
  for (const [key, value] of settings) out.set(`${SETTINGS_PREFIX}${key}`, value);
  for (const [key, value] of forms) out.set(`${FORM_PREFIX}${key}`, value);
  return out;
}

export interface SplitDocuments {
  pages: Map<string, unknown>;
  items: Map<string, unknown>;
  settings: Map<string, unknown>;
  forms: Map<string, unknown>;
}

export function splitDocuments(combined: ReadonlyMap<string, unknown>): SplitDocuments {
  const out: SplitDocuments = { pages: new Map(), items: new Map(), settings: new Map(), forms: new Map() };
  for (const [key, value] of combined) {
    if (key.startsWith(ITEM_PREFIX)) out.items.set(key.slice(ITEM_PREFIX.length), value);
    else if (key.startsWith(SETTINGS_PREFIX)) out.settings.set(key.slice(SETTINGS_PREFIX.length), value);
    else if (key.startsWith(FORM_PREFIX)) out.forms.set(key.slice(FORM_PREFIX.length), value);
    else out.pages.set(key, value);
  }
  return out;
}

/** The keys of combineDocuments for what a change touched. */
export const touchedKeys = (pages: readonly string[], items: readonly string[], settings: readonly string[], forms: readonly string[] = []): string[] => [
  ...pages,
  ...items.map((key) => `${ITEM_PREFIX}${key}`),
  ...settings.map((key) => `${SETTINGS_PREFIX}${key}`),
  ...forms.map((key) => `${FORM_PREFIX}${key}`),
];

/** How a form's id reads in a refusal about placeholders. */
export const formLabel = (id: string): string => `Form ${id}`;

/** How an item or settings key reads to the owner in a refusal about placeholders. */
export const documentLabel = (key: string): string => (key.includes("/") ? `Item ${key}` : `The ${key} settings`);

/**
 * The logo, once its upload is resolved: the size comes from the upload's record (never from the AI), and a logo that
 * would not fit the header is refused in plain words. Returns the settings to use and the problems found.
 */
export function finishLogo(settings: ReadonlyMap<string, unknown>, uploads: readonly ProposalUpload[]): { settings: Map<string, unknown>; problems: string[] } {
  const out = new Map(settings);
  const brand = settings.get("brand");
  if (!isObject(brand) || !isObject(brand.logo) || typeof brand.logo.src !== "string") return { settings: out, problems: [] };
  const logo = brand.logo;
  const upload = uploads.find((candidate) => pageValueFor(candidate.path) === logo.src);
  if (!upload) return { settings: out, problems: [] };
  const { width, height } = upload;
  if (width === undefined || height === undefined || !(width > 0) || !(height > 0)) {
    return { settings: out, problems: [`I can't read the size of this photo, so it can't be the logo. Ask the owner for a PNG, JPEG or WebP file, or ask ${AGENCY_NAME}.`] };
  }
  const problems: string[] = [];
  if (width < LOGO_MIN_WIDTH || height < LOGO_MIN_HEIGHT) {
    problems.push(`The logo is ${width} by ${height} pixels; it has to be at least ${LOGO_MIN_WIDTH} wide and ${LOGO_MIN_HEIGHT} tall to stay sharp in the header. Ask the owner for a larger file.`);
  }
  if (width / height > LOGO_MAX_RATIO || height > width) {
    problems.push(`The logo is ${width} by ${height} pixels; its shape has to be between square and ${LOGO_MAX_RATIO} times wider than tall to fit the header.`);
  }
  if (problems.length > 0) return { settings: out, problems };
  out.set("brand", { ...brand, logo: { ...logo, width, height } });
  return { settings: out, problems: [] };
}

/** True when the proposal's files include the brand settings (they change how every page looks). */
export const touchesBrand = (files: readonly { path: string }[]): boolean => files.some((file) => file.path === "src/content/brand.json");

/** Whether the items or settings a proposal was made against have changed on the site since. Old proposals without the record skip it. */
export function documentsMoved(snapshot: Snapshot, proposal: { collectionsTree?: string; formsTree?: string; settingsShas?: Record<string, string> }): boolean {
  if (proposal.collectionsTree !== undefined && snapshot.collectionsTree !== proposal.collectionsTree) return true;
  if (proposal.formsTree !== undefined && snapshot.formsTree !== proposal.formsTree) return true;
  const shas = proposal.settingsShas;
  return shas !== undefined && SETTINGS_NAMES.some((name: SettingsName) => shas[name] !== undefined && snapshot.settingsShas[name] !== shas[name]);
}
