// Change scope check: compares a branch to a base ref and says, in plain English, whether the change stays inside what a
// client change request may touch (tier 1) or needs Grant (tier 3). The allow-list is scripts/change-scope-rules.mjs;
// the explanation is docs/CHANGE-SCOPE.md. Run with `npm run check:scope`.
//
//   node scripts/check-change-scope.mjs [--base origin/main] [--head HEAD] [--strict | --report-only] [--ci]
//
// --strict (the default) exits 1 on a tier 3 file, a bad image, a content problem in a page file or a new [[placeholder]]. --report-only prints the same
// report and always exits 0. --ci reads GitHub's own variables: the base comes from GITHUB_BASE_REF, and it is strict
// only when the pull request's branch (GITHUB_HEAD_REF) starts with "change/" (any capitalisation) or its author
// (pull_request.user.login in the file at GITHUB_EVENT_PATH) is the site editor's GitHub App (editor.github.botLogin). Exit codes: 0 pass,
// 1 fail, 2 could not run.
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { siteConfig } from "../site.config.ts";
import { rules as defaultRules } from "./change-scope-rules.mjs";
import { contentModuleProblem } from "./change-scope-code.mjs";
import { registry } from "../src/blocks/definitions.ts";
import { validatePages as realValidatePages } from "../src/blocks/validate.ts";
import { validateSite as realValidateSite, SETTINGS_NAMES } from "../src/collections/site-validate.ts";
import { COLLECTION_KINDS, SLUG_RE } from "../src/collections/schema.ts";
import { registryIds, registrySource } from "../src/forms/registry.ts";
import { brandFiles } from "./config-rules.mjs";
import { imageAltCheck } from "./image-alt.mjs";
import { inspectMetadata } from "./image-metadata.mjs";
import { pdfProblem } from "./pdf-check.mjs";

// ---- small helpers ----------------------------------------------------------------------------------------------

/** Replaces control characters (newlines included) so a crafted file name or line cannot forge output lines. */
export const safe = (text) => String(text).replace(/[\u0000-\u001f\u007f]/g, "?");

/** A markdown code fence longer than any run of backticks inside the text. */
export function fence(text, info = "text") {
  const longest = Math.max(0, ...(String(text).match(/`+/g) ?? []).map((run) => run.length));
  const ticks = "`".repeat(Math.max(3, longest + 1));
  return `${ticks}${info}\n${text}\n${ticks}`;
}

const SPECIAL_MODES = ["120000", "160000"]; // symbolic link, submodule

// ---- parsing git output ---------------------------------------------------------------------------------------

/** Parses `git diff --raw -z --no-renames`: ":100644 100644 sha sha M\0path\0". */
export function parseRawDiff(raw) {
  const tokens = String(raw).split("\0");
  const entries = [];
  for (let i = 0; i + 1 < tokens.length && tokens[i] !== ""; i += 2) {
    const [oldMode, newMode, , , status] = tokens[i].replace(/^:/, "").split(" ");
    entries.push({ status: status[0], path: tokens[i + 1], oldMode, newMode });
  }
  return entries;
}

/** Parses `git diff -U0` for one file into its added and removed lines. Lines before the first @@ are headers. */
export function parseHunkLines(patch) {
  const added = [];
  const removed = [];
  let inHunk = false;
  for (const line of String(patch).split("\n")) {
    if (line.startsWith("@@")) inHunk = true;
    else if (!inHunk) continue;
    else if (line.startsWith("+")) added.push(line.slice(1));
    else if (line.startsWith("-")) removed.push(line.slice(1));
  }
  return { added, removed };
}

// ---- reading the change from git ------------------------------------------------------------------------------

const isPageFile = (path, rules) => rules.pageFile.test(path);
const isItemFile = (path, rules) => rules.itemFile.test(path);
const isSettingsFile = (path, rules) => rules.settingsFiles.includes(path);
const isGeneratedFile = (path, rules) => rules.generatedFiles.includes(path);
const isFormFile = (path, rules) => rules.formFile.test(path);
const isRegistryFile = (path, rules) => path === rules.registryFile;

const isCodeFile = (path, rules) => (rules.contentFile.test(path) && !rules.contentWiring.includes(path)) || rules.tier1Files.includes(path);

const extensionOf = (path) => {
  const dot = path.lastIndexOf(".");
  return dot > path.lastIndexOf("/") ? path.slice(dot).toLowerCase() : "";
};

/** The address of an image on the site: "public/images/team/sam.jpg" is served as "/images/team/sam.jpg". */
const urlOf = (path) => path.slice("public".length);

/** The .ts, .tsx and .json files under `dir` at `head` that mention the file's address, with their text. `git grep` exits 1 for "none". */
function readReferences(path, head, git, dir) {
  let found;
  try {
    found = git(["grep", "-l", "-I", "-F", "-z", "-e", urlOf(path), head, "--", dir]);
  } catch (error) {
    if (error.status === 1) return [];
    throw error;
  }
  return String(found)
    .split("\0")
    .filter(Boolean)
    .map((line) => line.slice(line.indexOf(":") + 1))
    .filter((referencePath) => /\.(?:tsx?|json)$/.test(referencePath))
    .map((referencePath) => ({ path: referencePath, content: String(git(["show", `${head}:${referencePath}`])) }));
}

/**
 * Reads a change from git. `git` is a function taking an argument array and returning a Buffer, so tests can fake it.
 * Returns { files, imageRefs, pages, headImages } for evaluateChange. `imageRefs` maps each added or changed
 * image to the source files that use it, so evaluateChange can look for the alt text. When the change adds or edits a page
 * file, `pages` holds every page file at `head` ([{ file, data, error? }]) and `headImages` every file under public/images/
 * at `head`, so the content check judges the pages as they will be built.
 */
export function gatherChange({ base, head, git, rules = defaultRules }) {
  const range = `${base}...${head}`;
  const imageRefs = {};
  const fileRefs = {};
  const files = parseRawDiff(git(["diff", "--raw", "-z", "--no-renames", range])).map(({ status, path, newMode }) => {
    const file = { path, status: ["A", "D", "T"].includes(status) ? status : "M", mode: newMode, added: [], removed: [] };
    // A symlink or submodule is rejected by classify; its "content" (a link target or a commit) is never read.
    const special = SPECIAL_MODES.includes(newMode);
    if (path.startsWith(rules.imageDir)) {
      if (file.status !== "D" && !special) {
        const bytes = git(["show", `${head}:${path}`]);
        file.size = bytes.length;
        file.head = bytes.subarray(0, 12);
        file.hasMarkup = /<script|<svg|<html|<iframe/i.test(bytes.toString("latin1"));
        if (Object.hasOwn(rules.imageTypes, extensionOf(path))) file.metadata = inspectMetadata(bytes, extensionOf(path));
        imageRefs[path] = readReferences(path, head, git, rules.imageReferenceDir);
      }
      return file;
    }
    if (path.startsWith(rules.fileDir)) {
      // Only a well-named PDF is judged by its bytes; anything else in public/files/ is tier 3 whatever it holds.
      if (file.status !== "D" && !special && rules.pdfFile.test(path)) {
        file.pdfProblem = pdfProblem(git(["show", `${head}:${path}`]), rules);
        fileRefs[path] = readReferences(path, head, git, rules.fileReferenceDir);
      }
      return file;
    }
    // --text: git must not hide the added lines of a file it thinks is binary (for example, one that contains a NUL byte).
    Object.assign(file, parseHunkLines(git(["diff", "-U0", "--no-renames", "--text", range, "--", path])));
    const needsContent = file.status !== "D" && !special && (isCodeFile(path, rules) || isGeneratedFile(path, rules) || isRegistryFile(path, rules));
    if (needsContent) file.content = String(git(["show", `${head}:${path}`]));
    return file;
  });
  // A page file added or edited, or a picture or PDF removed or replaced (a page may still use it), means the pages are checked.
  const touchesPages = files.some(
    (f) =>
      !SPECIAL_MODES.includes(f.mode) &&
      ((isPageFile(f.path, rules) && ["A", "M"].includes(f.status)) ||
        ((f.path.startsWith(rules.imageDir) || f.path.startsWith(rules.fileDir)) && ["D", "M"].includes(f.status))),
  );
  // An item, a settings file or a generated brand file added or edited means the whole site is judged (the settings and items too).
  const touchesSite = files.some(
    (f) =>
      !SPECIAL_MODES.includes(f.mode) &&
      ["A", "M"].includes(f.status) &&
      (isItemFile(f.path, rules) || isSettingsFile(f.path, rules) || isGeneratedFile(f.path, rules) || isFormFile(f.path, rules) || isRegistryFile(f.path, rules)),
  );
  if (!touchesPages && !touchesSite) return { files, imageRefs, fileRefs };
  return {
    files,
    imageRefs,
    fileRefs,
    site: readSiteAt(head, git, rules),
    pages: readPagesAt(head, git, rules),
    headImages: listAt(head, rules.imageDir, git, true),
    headFiles: listAt(head, rules.fileDir, git, true),
  };
}

/** The names under a folder at `head` (git ls-tree), as full paths. A missing folder gives []. */
function listAt(head, dir, git, recursive = false) {
  const args = ["ls-tree", ...(recursive ? ["-r"] : []), "--name-only", "-z", head, "--", dir];
  return String(git(args)).split("\0").filter(Boolean);
}

/** Every *.json directly in the pages folder at `head`, read like src/lib/page-files.ts reads them from disk. */
function readPagesAt(head, git, rules) {
  return listAt(head, rules.pagesDir, git)
    .filter((path) => path.startsWith(rules.pagesDir) && !path.slice(rules.pagesDir.length).includes("/") && path.endsWith(".json"))
    .sort()
    .map((path) => {
      const file = path.slice(rules.pagesDir.length);
      const text = String(git(["show", `${head}:${path}`])).replace(/^\uFEFF/, "");
      if (text.trim() === "") return { file, data: undefined, error: "is empty. A page file holds one JSON object." };
      try {
        return { file, data: JSON.parse(text) };
      } catch (cause) {
        return { file, data: undefined, error: `is not valid JSON (${cause.message}). Look for a missing or extra comma, quote or bracket.` };
      }
    });
}

/** The JSON text parsed like src/lib/content-files.ts does: `error` says why it could not be read. */
function parseJsonText(raw) {
  const text = String(raw).replace(/^\uFEFF/, "");
  if (text.trim() === "") return { data: undefined, error: "is empty. The file holds one JSON object." };
  try {
    return { data: JSON.parse(text) };
  } catch (cause) {
    return { data: undefined, error: `is not valid JSON (${cause.message}). Look for a missing or extra comma, quote or bracket.` };
  }
}

/** The item files (one folder below the collections folder) and the settings files at `head`, read like src/lib/content-files.ts reads them. */
function readSiteAt(head, git, rules) {
  const items = listAt(head, rules.itemDir, git, true)
    .map((path) => ({ path, match: rules.itemFile.exec(path) }))
    .filter(({ match }) => match !== null)
    .sort((a, b) => (a.path < b.path ? -1 : 1))
    .map(({ path, match }) => {
      const { data, error } = parseJsonText(git(["show", `${head}:${path}`]));
      return { kind: match[1], slug: match[2], data, ...(error !== undefined ? { error } : {}) };
    });
  const present = new Set(String(git(["ls-tree", "--name-only", "-z", head, "--", ...rules.settingsFiles])).split("\0").filter(Boolean));
  const forms = listAt(head, rules.formDir, git)
    .filter((path) => path.startsWith(rules.formDir) && !path.slice(rules.formDir.length).includes("/") && path.endsWith(".json"))
    .sort()
    .map((path) => {
      const { data, error } = parseJsonText(git(["show", `${head}:${path}`]));
      return { id: path.slice(rules.formDir.length, -".json".length), data, ...(error !== undefined ? { error } : {}) };
    });
  const site = { items, forms, settingsErrors: {} };
  // The ids the committed registry lists (not what it should list): the content check compares them with the form files.
  const registryPresent = String(git(["ls-tree", "--name-only", "-z", head, "--", rules.registryFile])).split("\0").filter(Boolean).length > 0;
  if (registryPresent) {
    const text = String(git(["show", `${head}:${rules.registryFile}`]));
    site.registryIds = registryIds(text);
  }
  for (const name of SETTINGS_NAMES) {
    const path = `src/content/${name}.json`;
    if (!present.has(path)) {
      site[name] = undefined;
      continue;
    }
    const { data, error } = parseJsonText(git(["show", `${head}:${path}`]));
    site[name] = data;
    if (error !== undefined) site.settingsErrors[name] = error;
  }
  return site;
}

// ---- the rules, applied to a change ---------------------------------------------------------------------------

function tier3Reason(path, rules) {
  return rules.tier3Labels.find(([pattern]) => pattern.test(path))[1];
}

/** True when the generated brand file at the head commit is exactly what brand.json (at the head commit) generates. */
function generatedMatches(file, site) {
  try {
    const expected = brandFiles(site.brand, { preloadAccent: siteConfig.preloadAccentFont === true })[file.path];
    return typeof expected === "string" && file.content === expected;
  } catch {
    return false;
  }
}

/** True when the registry at the head commit is exactly what the head's form files generate. */
function registryMatches(file, site) {
  return Array.isArray(site.forms) && typeof file.content === "string" && file.content === registrySource(site.forms.map((form) => form.id));
}

function itemProblem(path, rules) {
  const [, kind, slug] = rules.itemFile.exec(path);
  if (!COLLECTION_KINDS.includes(kind)) return `"${kind}" is not a collection. The collections are: ${COLLECTION_KINDS.join(", ")}`;
  if (!SLUG_RE.test(slug)) return `the slug "${slug}" must be lowercase words and digits joined by hyphens, 1 to 60 characters`;
  return null;
}

function classify(file, rules, site) {
  const { path, status } = file;
  if (status === "T" || (status !== "D" && SPECIAL_MODES.includes(file.mode))) {
    return { ok: false, reason: "symbolic links, submodules and file type changes are not allowed" };
  }
  if (isCodeFile(path, rules)) {
    if (status === "D") {
      return rules.tier1Files.includes(path) ? { ok: false, reason: "the menu labels may be edited, not deleted" } : { ok: true };
    }
    if (typeof file.content !== "string") return { ok: false, reason: `the contents of ${path} could not be read` };
    const problem = contentModuleProblem(file.content, rules);
    return problem ? { ok: false, reason: `a content file may hold plain data only, but this one ${problem}` } : { ok: true };
  }
  if (path.startsWith(rules.imageDir)) return { ok: true };
  if (path.startsWith(rules.fileDir)) return rules.pdfFile.test(path) ? { ok: true } : { ok: false, reason: rules.fileNameReason };
  if (path === rules.contactFormFile) return { ok: false, reason: tier3Reason(path, rules) };
  if (isFormFile(path, rules)) return status === "D" ? { ok: false, reason: rules.formArchiveReason } : { ok: true };
  if (isRegistryFile(path, rules)) {
    if (status === "D") return { ok: false, reason: rules.registryMismatchReason };
    return registryMatches(file, site ?? {}) ? { ok: true } : { ok: false, reason: rules.registryMismatchReason };
  }
  if (isPageFile(path, rules)) return status === "D" ? { ok: false, reason: rules.archiveReason } : { ok: true };
  if (isItemFile(path, rules)) {
    if (status === "D") return { ok: false, reason: rules.itemArchiveReason };
    const problem = itemProblem(path, rules);
    return problem ? { ok: false, reason: problem } : { ok: true };
  }
  if (isSettingsFile(path, rules)) return status === "D" ? { ok: false, reason: rules.itemArchiveReason } : { ok: true };
  if (isGeneratedFile(path, rules)) {
    if (status === "D") return { ok: false, reason: rules.generatedMismatchReason };
    return generatedMatches(file, site ?? {}) ? { ok: true } : { ok: false, reason: rules.generatedMismatchReason };
  }
  return { ok: false, reason: tier3Reason(path, rules) };
}

function imageProblems(file, rules) {
  const extension = extensionOf(file.path);
  if (extension === ".svg") return ["SVG files are not allowed (they can carry code). Use jpg, png or webp."];
  if (!Object.hasOwn(rules.imageTypes, extension)) return [`${extension || "a file with no extension"} is not allowed. Use jpg, png or webp.`];
  const problems = [];
  const bytes = file.head ?? Buffer.alloc(0);
  const type = rules.imageTypes[extension];
  const matches =
    (type === "jpeg" && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) ||
    (type === "png" && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ||
    (type === "webp" && bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP");
  if (!matches) problems.push(`the file's contents are not really a ${extension.slice(1)} image (renamed file?)`);
  else if (file.metadata?.error) problems.push(`hidden camera and location data could not be checked: ${file.metadata.error}`);
  else if (file.metadata?.removed.length > 0) {
    problems.push(
      `it carries hidden data that can reveal where, when and with what it was taken (${file.metadata.removed.join("; ")}). Run \`npm run strip:images\`, then commit the result`,
    );
  }
  if (file.hasMarkup) problems.push("the file contains HTML or SVG markup (a script hidden in an image?)");
  if ((file.size ?? 0) > rules.maxImageBytes) {
    problems.push(`${Math.round(file.size / 1024)} KB is over the ${Math.round(rules.maxImageBytes / 1024)} KB limit`);
  }
  return problems;
}

/** True when a source file holds the PDF's address as a whole string, such as "/files/price-sheet.pdf". */
const usesFile = (url, sources) => sources.some(({ content }) => [`"${url}"`, `'${url}'`, `\`${url}\``].some((quoted) => content.includes(quoted)));

/** Why a well-named PDF fails: its bytes (computed from git in gatherChange) or nothing in src/ uses it. */
function pdfProblems(file, fileRefs) {
  const problems = [];
  if (file.pdfProblem) problems.push(file.pdfProblem);
  else if (typeof file.pdfProblem === "undefined") problems.push("the PDF could not be read");
  if (!usesFile(urlOf(file.path), fileRefs[file.path] ?? [])) {
    problems.push(`nothing in src/ links to ${urlOf(file.path)}. Add the link (a page's button or text link), or leave the PDF out`);
  }
  return problems;
}

/**
 * The pure core: takes { files, imageRefs, fileRefs, pages, headImages, headFiles } and returns the verdict. No git, no disk.
 * `validate` is the content check (default: the real one), so tests can run it on fake pages.
 */
export function evaluateChange(
  { files, imageRefs = {}, fileRefs = {}, pages, site, headImages = [], headFiles = [] },
  rules = defaultRules,
  validate = realValidatePages,
  validateSite = realValidateSite,
) {
  const result = { tier: 1, outside: [], imageProblems: [], altProblems: [], fileProblems: [], contentProblems: [], images: [], placeholders: [], brandChange: false, fileCount: files.length };

  for (const file of files) {
    const verdict = classify(file, rules, site);
    if (file.path === rules.brandFile || (isGeneratedFile(file.path, rules) && verdict.ok)) result.brandChange = true;
    if (!verdict.ok) result.outside.push({ path: safe(file.path), reason: safe(verdict.reason) });

    if (file.path.startsWith(rules.imageDir)) {
      if (file.status !== "D") {
        for (const reason of imageProblems(file, rules)) result.imageProblems.push({ path: safe(file.path), reason: safe(reason) });
        const { problems, alts } = imageAltCheck(urlOf(file.path), imageRefs[file.path] ?? [], rules);
        result.images.push({ path: safe(file.path), alts: alts.map(safe) });
        for (const reason of problems) result.altProblems.push({ path: safe(file.path), reason: safe(reason) });
      }
      continue;
    }
    if (file.path.startsWith(rules.fileDir)) {
      if (file.status !== "D" && rules.pdfFile.test(file.path) && !SPECIAL_MODES.includes(file.mode)) {
        for (const reason of pdfProblems(file, fileRefs)) result.fileProblems.push({ path: safe(file.path), reason: safe(reason) });
      }
      continue;
    }
    if (rules.placeholderDirs.some((dir) => file.path.startsWith(dir)) && rules.placeholderFiles.test(file.path) && file.status !== "D") {
      // A placeholder that only moved or sat on an edited line is not new: cancel each added one against a removed one.
      const removedCounts = new Map();
      for (const line of file.removed) for (const m of line.matchAll(rules.placeholderPattern)) removedCounts.set(m[0], (removedCounts.get(m[0]) ?? 0) + 1);
      for (const line of file.added) {
        for (const match of line.matchAll(rules.placeholderPattern)) {
          const left = removedCounts.get(match[0]) ?? 0;
          if (left > 0) removedCounts.set(match[0], left - 1);
          else result.placeholders.push({ path: safe(file.path), text: safe(match[0]) });
        }
      }
    }
  }

  if (pages) {
    const present = new Set(headImages);
    const presentFiles = new Set(headFiles);
    const repo = { imageExists: (src) => present.has(`public${src}`), fileExists: (href) => presentFiles.has(`public${href}`) };
    // With the items and settings read, the whole site is judged; without them (a test with fake pages) only the pages are.
    const problems = site ? validateSite({ pages, forms: [], ...site }, registry, repo, { formSettings: siteConfig.forms, ...(site.registryIds !== undefined ? { registryIds: site.registryIds } : {}) }) : validate(pages, registry, repo);
    for (const problem of problems) result.contentProblems.push(safe(problem));
  }
  if (result.outside.length > 0) result.tier = 3;
  return result;
}

/** strict: fail on tier 3, a bad image, a content problem or a new placeholder. report-only: never fail. */
export function decide(result, mode) {
  const reasons = [];
  if (result.outside.length > 0) reasons.push("files outside tier 1");
  if (result.imageProblems.length > 0) reasons.push("image rule broken");
  if (result.altProblems.length > 0) reasons.push("image alt text missing");
  if (result.fileProblems.length > 0) reasons.push("PDF rule broken");
  if (result.contentProblems.length > 0) reasons.push("content problem");
  if (result.placeholders.length > 0) reasons.push("leftover [[placeholder]] text");
  return { ok: mode !== "strict" || reasons.length === 0, reasons };
}

// ---- the plain-English report ---------------------------------------------------------------------------------

const MAX_LISTED = 20;
const list = (items) => [...items.slice(0, MAX_LISTED), ...(items.length > MAX_LISTED ? [`  ...and ${items.length - MAX_LISTED} more`] : [])];

export function formatReport(result, { mode = "strict", base, head } = {}) {
  const lines = [`Change scope check${base ? ` (${safe(base)}...${safe(head)})` : ""}`, ""];
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  if (result.tier === 1) {
    lines.push(`Tier 1: this change only touches content (${plural(result.fileCount, "file")}). A client can ask for this.`);
  } else {
    lines.push(`Tier 3: this change needs Grant. ${plural(result.outside.length, "file")} outside what a client change may touch:`);
    lines.push(...list(result.outside.map((o) => `  - ${o.path} (${o.reason})`)));
  }
  if (result.brandChange) lines.push("", "Brand change: touches every page; it needs a preview before the yes.");
  if (result.images.length > 0) {
    lines.push("", "Images in this change (read the alt text: does it say what the picture shows?):");
    lines.push(...list(result.images.map((image) => `  - ${image.path}: ${image.alts.length > 0 ? `alt ${image.alts.map((alt) => JSON.stringify(alt)).join(", ")}` : "no usable alt text"}`)));
  }
  if (result.imageProblems.length > 0) {
    lines.push("", "Image problems (blocking on client change branches):");
    lines.push(...list(result.imageProblems.map((p) => `  - ${p.path}: ${p.reason}`)));
  }
  if (result.altProblems.length > 0) {
    lines.push("", "Alt text problems (blocking on client change branches):");
    lines.push(...list(result.altProblems.map((p) => `  - ${p.path}: ${p.reason}`)));
  }
  if (result.fileProblems.length > 0) {
    lines.push("", "PDF problems (blocking on client change branches):");
    lines.push(...list(result.fileProblems.map((p) => `  - ${p.path}: ${p.reason}`)));
  }
  if (result.contentProblems.length > 0) {
    lines.push("", "Content problems in the page files (blocking on client change branches):");
    lines.push(...list(result.contentProblems.map((p) => `  - ${p}`)));
  }
  if (result.placeholders.length > 0) {
    lines.push("", "Leftover [[placeholder]] text added by this change (blocking on client change branches):");
    lines.push(...list(result.placeholders.map((p) => `  - ${p.path}: ${p.text}`)));
  }
  const { ok, reasons } = decide(result, mode);
  lines.push("");
  if (mode !== "strict") {
    lines.push("Result: report only. This is not a client change branch, so nothing here blocks the merge.");
  } else {
    lines.push(ok ? "Result: PASS." : `Result: FAIL (${reasons.join(", ")}).`);
  }
  return lines.join("\n");
}

// ---- command line ---------------------------------------------------------------------------------------------

/** The pull request author's login from the event file GitHub Actions writes, or "" when there is none or it cannot be read. */
function authorLogin(env) {
  if (!env.GITHUB_EVENT_PATH) return "";
  try {
    const login = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8"))?.pull_request?.user?.login;
    return typeof login === "string" ? login : "";
  } catch {
    return "";
  }
}

export function parseArgs(argv, env, botLogin = siteConfig.editor.github.botLogin) {
  let base;
  let head;
  let mode;
  let ci = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base" || arg === "--head") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("-")) return { error: `${arg} needs a branch or commit name, not an option` };
      if (arg === "--base") base = value;
      else head = value;
      i += 1;
    } else if (arg === "--strict") mode = "strict";
    else if (arg === "--report-only") mode = "report-only";
    else if (arg === "--ci") ci = true;
    else return { error: `Unknown option ${arg}. Options: --base <ref>, --head <ref>, --strict, --report-only, --ci` };
  }
  if (ci) {
    if (!env.GITHUB_BASE_REF && base === undefined) return { skip: "Change scope check skipped: this is not a pull request, so there is nothing to compare." };
    base ??= `origin/${env.GITHUB_BASE_REF}`;
    const byBot = typeof botLogin === "string" && botLogin !== "" && authorLogin(env).toLowerCase() === botLogin.toLowerCase();
    mode ??= /^change\//i.test(env.GITHUB_HEAD_REF ?? "") || byBot ? "strict" : "report-only";
  }
  return { base: base ?? "origin/main", head: head ?? "HEAD", mode: mode ?? "strict" };
}

/** A git runner for a folder (default: the current one). Takes an argument array and returns a Buffer. */
export function gitIn(cwd) {
  return (args) => execFileSync("git", ["--literal-pathspecs", ...args], { cwd, maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
}
export const realGit = gitIn(undefined);

/** Returns the exit code: 0 pass, 1 fail, 2 could not run. */
export function main({ argv, env = process.env, git = realGit, out = console.log }) {
  const args = parseArgs(argv, env);
  if (args.error) {
    out(`Change scope check could not run: ${args.error}`);
    return 2;
  }
  if (args.skip) {
    out(args.skip);
    return 0;
  }
  let change;
  try {
    change = gatherChange({ base: args.base, head: args.head, git });
  } catch (error) {
    out(`Change scope check could not read the git history: ${safe(error.stderr?.toString().trim() || error.message)}`);
    return 2;
  }
  const result = evaluateChange(change, defaultRules);
  const text = formatReport(result, args);
  out(text);
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${fence(text)}\n`);
  return decide(result, args.mode).ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main({ argv: process.argv.slice(2) });
}
