// `npm run check:design`: tokens only (spec 5.7) and one motion layer (spec 5.8). Rules live in design-rules.mjs.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { cssMotionProblems, designProblems, keyframePropProblems, motionDeclarationProblems } from "./design-rules.mjs";

const root = process.cwd();
const SCAN_DIRS = ["src/components/hl", "src/blocks", "src/site-blocks"];
const CSS_FILES = ["src/app/hl.css", "src/app/globals.css"];

function tsxFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

const problems = [];
for (const dir of SCAN_DIRS) {
  for (const file of tsxFiles(join(root, dir))) {
    problems.push(...designProblems(relative(root, file).split(sep).join("/"), readFileSync(file, "utf8")));
  }
}

problems.push(...keyframePropProblems());

let allCss = "";
for (const file of CSS_FILES) {
  const css = readFileSync(join(root, file), "utf8");
  allCss += `${css}\n`;
  problems.push(...cssMotionProblems(css).filter((p) => !p.startsWith("the prefers-reduced-motion")).map((p) => `${file}: ${p}`));
}
// The reduced-motion switch lives in hl.css; globals.css only has to leave it alone.
if (cssMotionProblems(readFileSync(join(root, "src/app/hl.css"), "utf8")).some((p) => p.startsWith("the prefers-reduced-motion"))) {
  problems.push("src/app/hl.css: the prefers-reduced-motion: reduce block that sets animation and transition to none !important is missing");
}

const definitions = join(root, "src/blocks/definitions.ts");
if (existsSync(definitions)) {
  const { registry } = await import(pathToFileURL(definitions).href);
  problems.push(...motionDeclarationProblems(registry, allCss));
}

if (problems.length > 0) {
  console.error(`Design check failed (${problems.length}):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exitCode = 1;
} else {
  console.log("Design check passed");
}
