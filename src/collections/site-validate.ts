// One check for the whole site: pages, collection items, the three settings files and the rules that join them. The build,
// `check:content` and the site editor Worker all call this, so a change is judged the same way everywhere. Import-free
// apart from other shared modules.
import { buildPageIndex, validatePages } from "../blocks/validate.ts";
import type { Context, PageFile, Repo } from "../blocks/validate.ts";
import type { AnyBlockDefinition } from "../blocks/schema.ts";
import { DEFAULT_FORM_SETTINGS } from "../forms/schema.ts";
import type { FormFile, FormSettings, FormStatus } from "../forms/schema.ts";
import { formWarnings, validateForms } from "../forms/validate.ts";
import { validateBrand } from "../settings/brand.ts";
import { validateBusiness } from "../settings/business.ts";
import { validateNotice } from "../settings/notice.ts";
import type { ItemFile, ItemStatus, LoadedItem } from "./schema.ts";
import { BLOG_PATH } from "../lib/blog.ts";
import { collectionFor } from "./definitions.ts";
import { validateItems } from "./validate.ts";

import { SETTINGS_NAMES, settingsPath, type SettingsName } from "../settings/names.ts";

export { SETTINGS_NAMES, settingsPath };
export type { SettingsName };

export const POST_INDEX_BLOCK = "post-index";

export type SiteInput = {
  pages: readonly PageFile[];
  items: readonly ItemFile[];
  /** The form files (src/content/forms/<id>.json). Callers with none pass []. */
  forms: readonly FormFile[];
  /** A settings file's parsed JSON. `undefined` means the file is missing. */
  business: unknown;
  brand: unknown;
  notice: unknown;
  /** Why a settings file could not be read (bad JSON), by name. */
  settingsErrors?: Partial<Record<SettingsName, string>>;
};

export type SiteExtra = {
  links?: readonly { where: string; href: string }[];
  uploadNames?: ReadonlyMap<string, string>;
  /** The site's form caps (`forms` in site.config.ts). Missing means the defaults. */
  formSettings?: FormSettings;
  /** The ids the generated registry lists; when given, it must match the form files exactly. */
  registryIds?: readonly string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function hasLivePost(items: readonly ItemFile[]): boolean {
  return items.some((item) => item.kind === "posts" && item.error === undefined && isRecord(item.data) && item.data["status"] === "live");
}

function blogHasPostIndex(pages: readonly PageFile[]): boolean {
  return pages.some(({ data, error }) => {
    if (error !== undefined || !isRecord(data) || data["path"] !== BLOG_PATH || data["status"] !== "live" || !Array.isArray(data["blocks"])) return false;
    return data["blocks"].some((block) => isRecord(block) && block["type"] === POST_INDEX_BLOCK);
  });
}

/** Each readable form file's id and status, for the `form` block field. */
function formStatuses(files: readonly FormFile[]): Map<string, FormStatus> {
  const out = new Map<string, FormStatus>();
  for (const { id, data, error } of files) {
    if (error !== undefined || !isRecord(data)) continue;
    out.set(id, data["status"] === "archived" ? "archived" : "live");
  }
  return out;
}

/** Warnings that do not stop a change: health words in forms. Printed by the content check and shown in the owner's change list. */
export function siteWarnings(input: Pick<SiteInput, "forms">): string[] {
  return input.forms.flatMap(({ id, data, error }) => (error === undefined ? formWarnings(id, data) : []));
}

/**
 * Judges the whole site. Problems come back as plain sentences naming the file, in this order: pages, items, settings,
 * then the rules that join them. An empty list means the site is good.
 */
export function validateSite(input: SiteInput, registry: readonly AnyBlockDefinition[], repo: Repo, extra: SiteExtra = {}): string[] {
  const out: string[] = [];
  const forms = formStatuses(input.forms);
  out.push(...validatePages(input.pages, registry, repo, { ...extra, forms }));

  const ctx: Context = { repo, pages: buildPageIndex(input.pages, registry), forms, ...(extra.uploadNames !== undefined ? { uploadNames: extra.uploadNames } : {}) };
  out.push(...validateItems(input.items, ctx));
  const formContext = { fileExists: repo.fileExists, ...(extra.registryIds !== undefined ? { registryIds: extra.registryIds } : {}) };
  out.push(...validateForms(input.forms, formContext, extra.formSettings ?? DEFAULT_FORM_SETTINGS).problems);

  for (const name of SETTINGS_NAMES) {
    const where = settingsPath(name);
    const failed = input.settingsErrors?.[name];
    const data = input[name];
    if (failed !== undefined) out.push(`${where} ${failed}`);
    else if (data === undefined) out.push(`${where} is missing. Every site has this file.`);
    else if (name === "brand") out.push(...validateBrand(data, repo));
    else if (name === "business") out.push(...validateBusiness(data, ctx));
    else out.push(...validateNotice(data, ctx));
  }

  if (hasLivePost(input.items) && !blogHasPostIndex(input.pages)) {
    out.push(`A post is live, so ${BLOG_PATH} must be a live page with a "${POST_INDEX_BLOCK}" block (src/content/pages/blog.json); without it the posts have no list.`);
  }
  return out;
}

/** The items that passed the check, with the status split from the fields. Items that cannot be read are left out. */
export function toLoadedItems(items: readonly ItemFile[]): LoadedItem[] {
  const out: LoadedItem[] = [];
  for (const { kind, slug, data, error } of items) {
    const def = collectionFor(kind);
    if (error !== undefined || def === undefined || !isRecord(data)) continue;
    const { status, ...fields } = data;
    out.push({ kind: def.kind, slug, status: status as ItemStatus, data: fields });
  }
  return out;
}
