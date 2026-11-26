// `npm run check:content`: judges the whole site in plain words: the page files (src/content/pages/*.json) against the block registry, the collection
// items (src/content/collections/<kind>/<slug>.json) and the three settings files (business, brand, notice), with the one site
// validator the build uses.
// Prints "Content check passed (N pages, M blocks, K items)" or every problem, and exits 1 when there is one.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const load = (path) => import(pathToFileURL(join(root, path)).href);
const { registry } = await load("src/blocks/definitions.ts");
const { validateRegistry } = await load("src/blocks/validate.ts");
const { validateSite, siteWarnings } = await load("src/collections/site-validate.ts");
const { formFiles } = await load("src/forms/registry.generated.ts");
const { siteConfig } = await load("site.config.ts");
const { readFormFiles, readItemFiles, readSettingsFiles } = await load("src/lib/content-files.ts");
const { readPageFiles } = await load("src/lib/page-files.ts");
const { thanks } = await load("src/content/contact.ts");
const { thanksPageLinks } = await load("src/lib/thanks-links.ts");

const pdfs = new Set(existsSync(join(root, "public/files")) ? readdirSync(join(root, "public/files")).filter((name) => name.endsWith(".pdf")) : []);
const repo = { imageExists: (src) => existsSync(join(root, "public", src)), fileExists: (href) => pdfs.has(href.replace(/^\/files\//, "")) };
const files = readPageFiles(root);
const items = readItemFiles(root);
const forms = readFormFiles(root);
const settings = readSettingsFiles(root);
const settingsErrors = Object.fromEntries(Object.entries(settings).flatMap(([name, { error }]) => (error === undefined ? [] : [[name, error]])));
const site = { pages: files, items, forms, business: settings.business.data, brand: settings.brand.data, notice: settings.notice.data, settingsErrors };
const { catalogProblem } = await import("./blocks-catalog.mjs");
const problems = [...validateRegistry(registry, repo), ...validateSite(site, registry, repo, { links: thanksPageLinks(thanks), formSettings: siteConfig.forms, registryIds: formFiles.map((file) => file.id) })];
const stale = catalogProblem(registry, root);
if (stale) problems.push(stale);

// Warnings never fail the check (health words in a form, for example); the owner reads them in the change list.
for (const warning of siteWarnings(site)) console.warn(`Warning: ${warning}`);

if (problems.length > 0) {
  console.error(`Content check failed (${problems.length}):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exitCode = 1;
} else {
  const blocks = files.reduce((sum, { data }) => sum + (Array.isArray(data?.blocks) ? data.blocks.length : 0), 0);
  console.log(`Content check passed (${files.length} pages, ${blocks} blocks, ${items.length} items)`);
}
