// Reads and checks everything the build shows: pages, collection items and the three settings files, in one pass with
// the one site validator. Server only (it reads files). Any problem throws one error that lists every problem, so
// `next build` fails in plain words instead of building a broken page.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { siteConfig } from "../../site.config.ts";
import { registry } from "../blocks/definitions.ts";
import type { PageData } from "../blocks/schema.ts";
import { toLoadedItems, validateSite } from "../collections/site-validate.ts";
import type { LoadedItem } from "../collections/schema.ts";
import { thanks } from "../content/contact.ts";
import type { BrandData } from "../settings/brand.ts";
import type { BusinessData } from "../settings/business.ts";
import type { NoticeData } from "../settings/notice.ts";
import { readFormFiles, readItemFiles, readSettingsFiles } from "./content-files.ts";
import { readPageFiles } from "./page-files.ts";
import { thanksPageLinks } from "./thanks-links.ts";

export type SiteContent = { pages: PageData[]; items: LoadedItem[]; business: BusinessData; brand: BrandData; notice: NoticeData };

let cached: SiteContent | null = null;

function load(): SiteContent {
  const root = process.cwd();
  const pages = readPageFiles(root);
  const items = readItemFiles(root);
  const forms = readFormFiles(root);
  const settings = readSettingsFiles(root);
  const filesDir = join(root, "public", "files");
  const pdfs = new Set(existsSync(filesDir) ? readdirSync(filesDir).filter((name) => name.endsWith(".pdf")) : []);
  const repo = { imageExists: (src: string) => existsSync(join(root, "public", src)), fileExists: (href: string) => pdfs.has(href.replace(/^\/files\//, "")) };
  const settingsErrors = Object.fromEntries(Object.entries(settings).flatMap(([name, { error }]) => (error === undefined ? [] : [[name, error]])));
  const problems = validateSite(
    { pages, items, forms, business: settings.business.data, brand: settings.brand.data, notice: settings.notice.data, settingsErrors },
    registry,
    repo,
    { links: thanksPageLinks(thanks), formSettings: siteConfig.forms },
  );
  if (problems.length > 0) {
    throw new Error(`The site content has ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  }
  return {
    pages: pages.map((file) => file.data as PageData),
    items: toLoadedItems(items),
    business: settings.business.data as BusinessData,
    brand: settings.brand.data as BrandData,
    notice: settings.notice.data as NoticeData,
  };
}

/** The checked site content. Cached in production builds; re-read on every call in dev so edits show. */
export function getSiteContent(): SiteContent {
  if (cached) return cached;
  const content = load();
  if (process.env.NODE_ENV === "production") cached = content;
  return content;
}
