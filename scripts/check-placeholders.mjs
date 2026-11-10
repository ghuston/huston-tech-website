// Launch gate: fails while any unresolved placeholder or unset provider setting remains.
// Run with `npm run check:placeholders` (also used by `npm run build:launch`).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const srcDir = join(root, "src");
// Copy lives in content modules and route files; components and lib hold no copy.
const scanDirs = [join(srcDir, "content"), join(srcDir, "app")];
const problems = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx|md|mdx|json)$/.test(entry)) scan(full);
  }
}

function scan(file) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const match of line.matchAll(/\[\[([^\]]+)\]\]/g)) {
      problems.push(`${relative(root, file)}:${i + 1}  [[${match[1]}]]`);
    }
  });
}

scanDirs.forEach(walk);

const siteFile = join(srcDir, "content", "site.ts");
const site = readFileSync(siteFile, "utf8");
for (const key of ["email", "schedulerUrl", "linkedInUrl"]) {
  if (new RegExp(`${key}:\\s*null`).test(site)) {
    problems.push(`src/content/site.ts  ${key} is still null (provider/value not chosen)`);
  }
}

const decisionLabels = {
  heroOption: "hero option (spec B1; A is the recommended default)",
  reviewPrice: "publish the Review price? (default: no price)",
  stepThreeName: "step 3 name (\"Flick it\" by default)",
  lineArtStyle: "line-art style (geometric framework icons by default)",
};
for (const [key, label] of Object.entries(decisionLabels)) {
  if (new RegExp(`${key}:\\s*false`).test(site)) {
    problems.push(`src/content/site.ts  decisionsConfirmed.${key} is false: not yet confirmed by Grant (${label})`);
  }
}

if (/reviewPrice:\s*"/.test(site)) {
  console.warn(
    "\nNote: siteConfig.reviewPrice is set. Update the Services FAQ cost answer and any other price wording to match before launch.\n",
  );
}

if (problems.length > 0) {
  console.error(`\nLaunch check failed: ${problems.length} unresolved item(s)\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error("\nResolve or remove each item before launch (see README, \"Launch checklist\").\n");
  process.exit(1);
}
console.log("Launch check passed: no unresolved placeholders.");
