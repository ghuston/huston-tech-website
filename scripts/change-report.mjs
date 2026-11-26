// Change report: before and after screenshots of the pages a change touches, at phone and desktop width, plus the scope
// check's verdict, written to change-report/report.md. Run with `npm run report:changes` after `npm run build`.
//
//   node scripts/change-report.mjs [--base origin/main] [--head HEAD] [--ci]
//                                  [--base-out <dir>] [--head-out out] [--out change-report]
//
// "After" is the site in --head-out (your build of this branch). "Before" is --base-out if you have one; otherwise the
// script builds the base commit in a temporary git worktree (npm ci + npm run build, a minute or two) and removes it.
// Playwright is already a dev dependency, so nothing new is installed; if its Chromium is missing it falls back to the
// installed Google Chrome. Screenshots are informational: this script never blocks a merge (scripts/check-change-scope.mjs does).
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, posix, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { decide, evaluateChange, fence, formatReport, gatherChange, parseArgs, realGit, safe } from "./check-change-scope.mjs";
import { rules } from "./change-scope-rules.mjs";
import { pathForFile } from "../src/blocks/schema.ts";
import { startPreviewServer } from "./preview.mjs";

export const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

const root = new URL("..", import.meta.url).pathname;

// ---- which pages does a change touch? (pure) --------------------------------------------------------------------

/** "src/content/pages/about.json" becomes "/about"; home.json is "/"; anything else is null. */
export function routeForPageFile(path) {
  return rules.pageFile.test(path) ? pathForFile(path) : null;
}

export const slugForRoute = (route) => (route === "/" ? "home" : route.slice(1).replace(/\//g, "-"));

const quoted = (text, spec) => text.includes(`"${spec}"`) || text.includes(`'${spec}'`);

/** The source files (keys of `sources`) that import `path`, or, for a photo, mention its URL. */
export function findImporters(path, sources) {
  if (path.startsWith("public/")) {
    const url = path.slice("public".length);
    return Object.keys(sources).filter((other) => sources[other].includes(url));
  }
  if (!path.startsWith("src/")) return [];
  const withoutExtension = path.replace(/\.(tsx?|jsx?|mjs)$/, "");
  const alias = `@/${withoutExtension.slice("src/".length)}`;
  return Object.keys(sources).filter((other) => {
    if (other === path) return false;
    let relativeSpec = posix.relative(posix.dirname(other), withoutExtension);
    if (!relativeSpec.startsWith(".")) relativeSpec = `./${relativeSpec}`;
    return quoted(sources[other], alias) || quoted(sources[other], relativeSpec);
  });
}

const BLOCK_FOLDER = /^src\/(?:blocks\/library|site-blocks)\/([^/]+)\//;

/**
 * The block types a file inside a block folder belongs to: its own, plus the types of other block folders that import it
 * (video-grid imports video's player). Importers outside block folders are not followed; they would reach every page.
 */
function blockTypesReaching(path, sources) {
  const types = new Set();
  const seen = new Set([path]);
  const queue = [path];
  while (queue.length > 0) {
    const file = queue.shift();
    types.add(BLOCK_FOLDER.exec(file)[1]);
    for (const importer of findImporters(file, sources)) {
      if (seen.has(importer) || !BLOCK_FOLDER.test(importer)) continue;
      seen.add(importer);
      queue.push(importer);
    }
  }
  return types;
}

/**
 * Follows imports upward until it reaches pages. `all` is true when it reaches the shared layout or cannot tell. Tracing
 * stops at a file inside a block's folder and records that block type in `types`, so a component only one block uses maps
 * to the pages using that block, not to every page.
 */
function reachablePages(path, sources, pageRoutes) {
  const routes = new Set();
  const types = new Set();
  const seen = new Set([path]);
  const queue = [path];
  let first = true;
  while (queue.length > 0) {
    const importers = findImporters(queue.shift(), sources);
    if (first && importers.length === 0) return { all: true, routes, types };
    first = false;
    for (const importer of importers) {
      if (seen.has(importer)) continue;
      seen.add(importer);
      if (pageRoutes[importer]) routes.add(pageRoutes[importer]);
      else if (importer.startsWith("src/app/")) return { all: true, routes, types };
      else if (BLOCK_FOLDER.test(importer)) for (const type of blockTypesReaching(importer, sources)) types.add(type);
      else queue.push(importer);
    }
  }
  return { all: false, routes, types };
}

/** Files that cannot change how a page looks. */
const NO_VISUAL_EFFECT = /^(?:docs|scripts|tests|\.github|\.claude|worker)\/|\.md$|\.test\.(?:ts|mjs)$|^src\/lib\/routes\.ts$|^src\/forms\/registry\.generated\.ts$/;
const BLOCK_CODE = /^src\/(?:blocks|site-blocks)\//;
export const SHOWCASE_ROUTE = "/blocks";
export const BLOG_ROUTE = "/blog";
/** Files that restyle or relabel every page: the settings files and the files generated from brand.json. */
const WHOLE_SITE_FILES = [...rules.settingsFiles, ...rules.generatedFiles];

/** The kind and slug of an item file ("src/content/collections/posts/spring.json"), or null. */
export function itemForFile(path) {
  const match = rules.itemFile.exec(path);
  return match ? { kind: match[1], slug: match[2] } : null;
}

/** The id of a form file ("src/content/forms/quote.json" is "quote"), or null. */
export function formForFile(path) {
  const match = rules.formFile.exec(path);
  return match ? match[1] : null;
}

/** { [kind/slug]: status } for item files, from [{ path, text }] (the text of each item file). A file that is not valid JSON is skipped. */
export function itemInfoFromTexts(entries) {
  const info = {};
  for (const { path, text } of entries) {
    const item = itemForFile(path);
    if (!item) continue;
    try {
      const data = JSON.parse(text);
      if (typeof data === "object" && data !== null && !Array.isArray(data)) info[`${item.kind}/${item.slug}`] = data.status;
    } catch {
      continue;
    }
  }
  return info;
}

/** { [kind]: [block types] }: the block types whose definition reads its items from that collection. `registry` is the block registry. */
export function collectionBlockTypes(registry) {
  const byKind = {};
  for (const def of registry) if (typeof def.collection === "string") (byKind[def.collection] ??= []).push(def.type);
  return byKind;
}

/**
 * What the report needs to know about each page file: { [route]: { status, types } }, where `types` lists the block types the
 * page uses. `entries` is [{ file, text }] (the text of every file in src/content/pages/). A file that is not valid JSON is skipped.
 */
export function pageInfoFromTexts(entries) {
  const info = {};
  for (const { file, text } of entries) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      continue;
    }
    if (typeof data !== "object" || data === null || Array.isArray(data)) continue;
    const route = typeof data.path === "string" ? data.path : pathForFile(file);
    const blocks = Array.isArray(data.blocks) ? data.blocks : [];
    const forms = [...new Set(blocks.filter((block) => block?.type === "form" && typeof block.content?.form === "string").map((block) => block.content.form))];
    info[route] = { status: data.status, types: [...new Set(blocks.map((block) => block?.type).filter((type) => typeof type === "string"))], ...(forms.length > 0 ? { forms } : {}) };
  }
  return info;
}

/**
 * Which pages to screenshot. `files` is [{ status, path }], `sources` maps src/ file paths to their text, `pageRoutes`
 * maps source files that are whole pages to routes (import tracing), `allRoutes` lists every route, and `pagesHead` and
 * `pagesBase` are pageInfoFromTexts results for the two sides. A route that is a page file on neither side (the thanks
 * page, the showcase) is taken to be there on both. Returns [{ route, slug, before, after, reason }].
 */
export function affectedPages({ files, sources, pageRoutes = {}, allRoutes, pagesHead = {}, pagesBase = {}, itemsHead = {}, itemsBase = {}, collectionTypes = {} }) {
  const entries = new Map();
  // A route with no page file on that side may still be a page there: a code page, or (when converting a site to blocks)
  // a page that only became a file on this branch. The screenshot step asks that side's build and skips a 404.
  const liveAt = (pages, route) => (Object.hasOwn(pages, route) ? pages[route].status === "live" : true);
  const mark = (route, reason, sides = {}) => entries.has(route) || entries.set(route, { reason, ...sides });
  const markTypes = (types, path) => {
    for (const type of types) {
      const uses = (pages) => Object.keys(pages).filter((route) => pages[route].types.includes(type));
      for (const route of new Set([...uses(pagesHead), ...uses(pagesBase)])) mark(route, `${path} changed (this page uses the "${type}" block)`);
    }
    mark(SHOWCASE_ROUTE, `${path} changed (the block showcase shows every block)`);
  };
  for (const { status, path } of files) {
    const own = routeForPageFile(path);
    const inBlock = BLOCK_FOLDER.test(path);
    const item = itemForFile(path);
    const form = formForFile(path);
    if (form) {
      // A form shows on every page whose "form" block names it, now or before the change. The contact form has its own block.
      const uses = (pages) =>
        Object.keys(pages).filter((route) => (path === rules.contactFormFile ? pages[route].types.includes("contact-form") : pages[route].forms?.includes(form)));
      for (const route of new Set([...uses(pagesHead), ...uses(pagesBase)])) mark(route, `${path} changed (this page shows the "${form}" form)`);
    } else if (item) {
      // A post has its own page and the blog index; any item shows on every page that lists its collection.
      if (item.kind === "posts") {
        const key = `posts/${item.slug}`;
        const before = status !== "A" && itemsBase[key] === "live";
        const after = status !== "D" && itemsHead[key] === "live";
        const why = status === "A" ? "new post" : status === "D" ? "post deleted" : before && !after ? "post archived or unpublished" : !before && after ? "post published or restored" : `${path} changed`;
        mark(`${BLOG_ROUTE}/${item.slug}`, why, { before, after });
        mark(BLOG_ROUTE, `${path} changed (the blog lists this post)`);
      }
      const types = collectionTypes[item.kind] ?? [];
      const lists = (pages) => Object.keys(pages).filter((route) => pages[route].types.some((type) => types.includes(type)));
      for (const route of new Set([...lists(pagesHead), ...lists(pagesBase)])) mark(route, `${path} changed (this page lists ${item.kind})`);
    } else if (WHOLE_SITE_FILES.includes(path)) {
      for (const route of allRoutes) mark(route, `${path} changed (it reaches every page)`);
    } else if (own) {
      const baseLive = liveAt(pagesBase, own);
      const headLive = liveAt(pagesHead, own);
      if (status === "A") mark(own, "new page file", { before: baseLive, after: headLive });
      else if (status === "D") mark(own, "page deleted", { before: baseLive, after: false });
      else if (baseLive && !headLive) mark(own, "page archived", { before: true, after: false });
      else if (!baseLive && headLive) mark(own, "page restored", { before: false, after: true });
      else mark(own, `${path} changed`);
    } else if (inBlock) {
      markTypes(blockTypesReaching(path, sources), path);
    } else if (BLOCK_CODE.test(path)) {
      for (const route of allRoutes) mark(route, `${path} changed (it reaches every page)`);
    } else if (!NO_VISUAL_EFFECT.test(path)) {
      const reach = reachablePages(path, sources, pageRoutes);
      if (reach.all) for (const route of allRoutes) mark(route, `${path} changed (it reaches every page)`);
      else {
        for (const route of reach.routes) mark(route, `${path} changed`);
        if (reach.types.size > 0) markTypes(reach.types, path);
      }
    }
  }
  return [...entries.keys()]
    .sort()
    .map((route) => {
      const entry = entries.get(route);
      return { route, slug: slugForRoute(route), before: entry.before ?? liveAt(pagesBase, route), after: entry.after ?? liveAt(pagesHead, route), reason: entry.reason };
    })
    .filter((page) => page.before || page.after);
}

// ---- options and markdown (pure) --------------------------------------------------------------------------------

/** Splits this script's own options from the ones check-change-scope's parseArgs understands. */
export function extractOptions(argv) {
  const options = { baseOut: undefined, out: "change-report", headOut: "out" };
  const keys = { "--base-out": "baseOut", "--out": "out", "--head-out": "headOut" };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (Object.hasOwn(keys, argv[i])) {
      if (argv[i + 1] === undefined || argv[i + 1].startsWith("--")) return { error: `${argv[i]} needs a value` };
      options[keys[argv[i]]] = argv[i + 1];
      i += 1;
    } else rest.push(argv[i]);
  }
  return { options, rest };
}

export function buildReportMarkdown({ scopeText, base, head, pages, viewports }) {
  const sizes = viewports.map((v) => `${v.name} ${v.width} × ${v.height}`).join(", ");
  const lines = ["# Change report", "", `Compared ${safe(base)}...${safe(head)}.`, "", "## Scope check", "", fence(scopeText), ""];
  if (pages.length === 0) return [...lines, "## Pages", "", "No visible page is affected by this change, so there are no screenshots.", ""].join("\n");
  lines.push(`## Pages (${pages.length})`, "", `Screenshots at ${sizes}.`, "");
  for (const page of pages) {
    lines.push(`### ${page.route}`, "", `Why: ${page.reason}.`, "");
    lines.push("| | Before | After |", "| --- | --- | --- |");
    for (const v of viewports) {
      const cell = (side, present, missing) => (present ? `![${side}, ${v.name}](${page.slug}/${side}-${v.name}.png)` : missing);
      lines.push(`| ${v.name} (${v.width} × ${v.height}) | ${cell("before", page.before, "page not live before (new or restored), no before")} | ${cell("after", page.after, "page not live after (archived or deleted), no after")} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ---- building, serving and photographing the two sites ---------------------------------------------------------

function readSources() {
  const sources = {};
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name)) sources[relative(root, full).split("\\").join("/")] = readFileSync(full, "utf8");
    }
  };
  walk(join(root, "src"));
  return sources;
}

/** Every route the site builds right now: the live pages (from the page files) and the pages that are not indexed. */
async function readRoutes() {
  const { indexableRoutes, noindexRoutes } = await import(pathToFileURL(join(root, "src/lib/routes.ts")).href);
  return [...new Set([...indexableRoutes, ...noindexRoutes])];
}

/** pageInfoFromTexts for the page files at a git ref (the tree, not the working folder). */
function pageInfoAt(ref) {
  const names = String(realGit(["ls-tree", "--name-only", "-z", ref, "--", rules.pagesDir])).split("\0").filter((name) => name.endsWith(".json"));
  return pageInfoFromTexts(names.map((name) => ({ file: name.slice(rules.pagesDir.length), text: String(realGit(["show", `${ref}:${name}`])) })));
}

/** itemInfoFromTexts for the item files at a git ref. */
function itemInfoAt(ref) {
  const names = String(realGit(["ls-tree", "-r", "--name-only", "-z", ref, "--", rules.itemDir])).split("\0").filter((name) => itemForFile(name));
  return itemInfoFromTexts(names.map((path) => ({ path, text: String(realGit(["show", `${ref}:${path}`])) })));
}

function buildBaseSite(base, head, log) {
  const mergeBase = String(realGit(["merge-base", base, head])).trim();
  const dir = mkdtempSync(join(tmpdir(), "change-report-base-"));
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    try {
      realGit(["worktree", "remove", "--force", dir]);
    } catch {
      // git never registered the folder (for example `worktree add` failed): remove the empty folder ourselves.
      rmSync(dir, { recursive: true, force: true });
      log(`Cleaned up the temporary folder ${dir}. If \`git worktree list\` still shows it, run: git worktree prune`);
    }
  };
  log(`Building the "before" site from ${mergeBase.slice(0, 8)} in a temporary folder (a minute or two)...`);
  try {
    realGit(["worktree", "add", "--detach", dir, mergeBase]);
    execFileSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: dir, stdio: "inherit" });
    execFileSync("npm", ["run", "build"], { cwd: dir, stdio: "inherit" });
  } catch (error) {
    // Also reached by Ctrl-C: the install or build child dies, execFileSync throws, and the temporary folder is removed.
    cleanup();
    throw error;
  }
  return { outDir: join(dir, "out"), cleanup };
}

async function openBrowser() {
  const { chromium } = await import("@playwright/test");
  try {
    return await chromium.launch();
  } catch {
    try {
      return await chromium.launch({ channel: "chrome" });
    } catch {
      throw new Error("Could not open a browser. Install one with `npx playwright install chromium` (ask Grant first) or install Google Chrome.");
    }
  }
}

/** Screenshots every page on both sides at both widths. Sets a page's before/after to false when the page is not there. */
async function takeScreenshots({ beforeDir, afterDir, pages, outDir, log }) {
  const servers = {};
  let browser;
  try {
    // Everything that is opened is closed in the finally below, even when a later step (the browser) fails to start.
    servers.before = await startPreviewServer({ outDir: beforeDir, port: 0 });
    servers.after = await startPreviewServer({ outDir: afterDir, port: 0 });
    browser = await openBrowser();
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce", hasTouch: viewport.name === "phone" });
      for (const side of ["before", "after"]) {
        for (const page of pages.filter((p) => p[side])) {
          const tab = await context.newPage();
          const response = await tab.goto(`http://localhost:${servers[side].port}${page.route}`, { waitUntil: "networkidle" });
          if (!response || response.status() !== 200) {
            page[side] = false;
          } else {
            await tab.evaluate(() => document.fonts.ready);
            mkdirSync(join(outDir, page.slug), { recursive: true });
            await tab.screenshot({ path: join(outDir, page.slug, `${side}-${viewport.name}.png`), fullPage: true });
            log(`  ${side} ${viewport.name}: ${page.route}`);
          }
          await tab.close();
        }
      }
      await context.close();
    }
  } finally {
    await browser?.close();
    await Promise.all(Object.values(servers).map((server) => server.close()));
  }
}

/** Returns the exit code: 0 done, 2 could not run. */
export async function main({ argv, env = process.env, log = console.log }) {
  const split = extractOptions(argv);
  const args = split.error ? { error: split.error } : parseArgs(split.rest, env);
  if (args.error) {
    log(`Change report could not run: ${args.error}`);
    return 2;
  }
  if (args.skip) {
    log(args.skip.replace("Change scope check", "Change report"));
    return 0;
  }
  const { options } = split;
  const outDir = resolve(options.out);
  const headDir = resolve(options.headOut);
  if (!existsSync(join(headDir, "index.html"))) {
    log(`Change report could not run: there is no build in ${options.headOut}. Run \`npm run build\` first.`);
    return 2;
  }

  let change;
  try {
    change = gatherChange({ base: args.base, head: args.head, git: realGit });
  } catch (error) {
    log(`Change report could not read the git history: ${safe(error.stderr?.toString().trim() || error.message)}`);
    return 2;
  }
  log(`Using the build in ${options.headOut} (built ${statSync(join(headDir, "index.html")).mtime.toLocaleString()}). Rebuild first if you changed anything since.`);
  const result = evaluateChange(change, rules);
  const scopeText = formatReport(result, args);
  const sources = readSources();
  let pagesBase;
  let pagesHead;
  let itemsBase;
  let itemsHead;
  try {
    const mergeBase = String(realGit(["merge-base", args.base, args.head])).trim();
    pagesBase = pageInfoAt(mergeBase);
    pagesHead = pageInfoAt(args.head);
    itemsBase = itemInfoAt(mergeBase);
    itemsHead = itemInfoAt(args.head);
  } catch (error) {
    log(`Change report could not read the page files from git: ${safe(error.stderr?.toString().trim() || error.message)}`);
    return 2;
  }
  const { registry } = await import(pathToFileURL(join(root, "src/blocks/definitions.ts")).href);
  const pages = affectedPages({ files: change.files, sources, allRoutes: await readRoutes(), pagesHead, pagesBase, itemsHead, itemsBase, collectionTypes: collectionBlockTypes(registry) });
  log(scopeText, "");
  log(`${pages.length} page(s) to photograph: ${pages.map((p) => p.route).join(", ") || "none"}`);

  mkdirSync(outDir, { recursive: true });
  let base = null;
  try {
    if (pages.length > 0) {
      base = options.baseOut ? { outDir: resolve(options.baseOut), cleanup() {} } : buildBaseSite(args.base, args.head, log);
      await takeScreenshots({ beforeDir: base.outDir, afterDir: headDir, pages, outDir, log });
    }
  } catch (error) {
    log(`Change report could not finish: ${error.message}`);
    return 2;
  } finally {
    base?.cleanup();
  }
  const markdown = buildReportMarkdown({ scopeText, base: args.base, head: args.head, pages, viewports: VIEWPORTS });
  writeFileSync(join(outDir, "report.md"), markdown);
  if (env.GITHUB_STEP_SUMMARY) {
    appendFileSync(env.GITHUB_STEP_SUMMARY, `${markdown}\n_The screenshots are in the change-report artifact of this run._\n`);
  }
  log(`Report written to ${options.out}/report.md${decide(result, args.mode).ok ? "" : " (the scope check failed; see above)"}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main({ argv: process.argv.slice(2) });
}
