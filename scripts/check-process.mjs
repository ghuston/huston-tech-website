// Process check: keeps the working docs short and the process rules honest. Run with `npm run check:process`.
// The folder checked is the repo root (the folder above scripts/). Each problem is one plain line naming the file.
//
// Rules: STATUS.md and the newest plan stay under 150 lines; every agent file names a model; docs/PROCESS.md has a
// "Where facts live" heading and a "Why" for every rule; STATUS.md "For the master" stays short and holds no PR numbers;
// and (only when switched on) the pre-commit hook runs the fast check, not the full one.
//
// scripts/process-rules.json holds { "precommitHookFastOnly": false }. JSON has no comments, so: the owner batch script
// sets that flag to true after installing a pre-commit hook that runs `check:fast`. While it is false, rule 7 is skipped.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MAX_LINES = 150;
const MAX_MASTER_LINES = 12;

const read = (path) => (existsSync(path) ? readFileSync(path, "utf8") : null);

/** Lines of a file; a trailing newline does not add a line. */
const linesOf = (text) => {
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  return lines;
};

/** The lines of a "## " section, from after its heading to the next "## " heading. Null when there is no such section. */
function section(lines, heading) {
  const start = lines.findIndex((line) => line.trimEnd() === heading);
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^## /.test(line));
  return end === -1 ? rest : rest.slice(0, end);
}

const RULES_FILE = "scripts/process-rules.json";

/** A missing file means the flag is off. A file that is not valid JSON, or a flag that is not true/false, is a problem. */
function loadRules(root, options) {
  let rules = { precommitHookFastOnly: false };
  const problems = [];
  const text = read(join(root, RULES_FILE));
  if (text !== null) {
    try {
      const parsed = JSON.parse(text);
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
      if ("precommitHookFastOnly" in parsed && typeof parsed.precommitHookFastOnly !== "boolean") {
        problems.push(`${RULES_FILE}: "precommitHookFastOnly" must be true or false. Fix the value.`);
      } else {
        rules = { ...rules, ...parsed };
      }
    } catch {
      problems.push(`${RULES_FILE} is not valid JSON. Fix it; it should read { "precommitHookFastOnly": false }.`);
    }
  }
  return { rules: { ...rules, ...(options.rules ?? {}) }, problems };
}

/** Returns an array of problem strings; empty means every rule passed. */
export function checkProcess(root, options = {}) {
  const loaded = loadRules(root, options);
  const rules = loaded.rules;
  const problems = [...loaded.problems];

  // 1. STATUS.md length
  const statusText = read(join(root, "docs", "STATUS.md"));
  const statusLines = statusText === null ? null : linesOf(statusText);
  if (statusLines === null) problems.push("docs/STATUS.md is missing. Create it (current state, changelog, needs Grant, for the master).");
  else if (statusLines.length > MAX_LINES) {
    problems.push(`docs/STATUS.md is ${statusLines.length} lines; the limit is ${MAX_LINES}. Move old changelog entries out or shorten it.`);
  }

  // 2. newest plan length
  const plansDir = join(root, "docs", "superpowers", "plans");
  if (existsSync(plansDir)) {
    const plans = readdirSync(plansDir).filter((name) => name.endsWith(".md")).sort();
    if (plans.length > 0) {
      const newest = plans.at(-1);
      const count = linesOf(readFileSync(join(plansDir, newest), "utf8")).length;
      if (count > MAX_LINES) {
        problems.push(`docs/superpowers/plans/${newest} is ${count} lines; the limit is ${MAX_LINES}. Split the plan or cut detail.`);
      }
    }
  }

  // 3. every agent file names a model
  const agentsDir = join(root, ".claude", "agents");
  if (existsSync(agentsDir)) {
    for (const name of readdirSync(agentsDir).filter((n) => n.endsWith(".md")).sort()) {
      const lines = linesOf(readFileSync(join(agentsDir, name), "utf8"));
      const open = lines.findIndex((line) => line.trim() === "---");
      const close = open === -1 ? -1 : lines.findIndex((line, i) => i > open && line.trim() === "---");
      const front = open !== -1 && close !== -1 ? lines.slice(open + 1, close) : [];
      if (!front.some((line) => /^model:\s*\S/.test(line))) {
        problems.push(`.claude/agents/${name} has no "model: <name>" line in its front matter. Add one between the --- lines.`);
      }
    }
  }

  // 4 and 5. docs/PROCESS.md
  const processText = read(join(root, "docs", "PROCESS.md"));
  if (processText === null) {
    problems.push('docs/PROCESS.md is missing. Create it with a "## Where facts live" section.');
  } else {
    const lines = linesOf(processText);
    if (!lines.some((line) => line.trimEnd() === "## Where facts live")) {
      problems.push('docs/PROCESS.md has no "## Where facts live" heading. Add it.');
    }
    const rulesSection = section(lines, "## Rules");
    if (rulesSection !== null) {
      for (let i = 0; i < rulesSection.length; i += 1) {
        if (!/^### /.test(rulesSection[i])) continue;
        const next = rulesSection.findIndex((line, j) => j > i && /^##+ /.test(line));
        const body = rulesSection.slice(i + 1, next === -1 ? undefined : next);
        if (!body.some((line) => /\*\*Why:\*\*\s*\S/.test(line))) {
          problems.push(`docs/PROCESS.md: the rule "${rulesSection[i].replace(/^### /, "").trim()}" has no "**Why:** ..." line. Add the reason.`);
        }
      }
    }
  }

  // 6. STATUS.md "For the master"
  if (statusLines !== null) {
    const master = section(statusLines, "## For the master");
    if (master !== null) {
      const filled = master.filter((line) => line.trim() !== "");
      if (filled.length > MAX_MASTER_LINES) {
        problems.push(`docs/STATUS.md "For the master" has ${filled.length} lines; the limit is ${MAX_MASTER_LINES}. Keep only decisions and scope changes.`);
      }
      if (filled.some((line) => /#\d+|\bPRs?\s+#?\d+|pull\/\d+/i.test(line))) {
        problems.push('docs/STATUS.md "For the master" mentions a PR number. Remove it; the master holds decisions, not PR links.');
      }
    }
  }

  // 7. pre-commit hook runs the fast check (only once switched on)
  if (rules.precommitHookFastOnly === true) {
    const hook = read(join(root, ".claude", "hooks", "precommit-check.mjs"));
    const match = hook === null ? null : /const SCRIPT = (["'])([^"']*)\1/.exec(hook);
    if (hook === null) problems.push(".claude/hooks/precommit-check.mjs is missing. The pre-commit hook must run check:fast.");
    else if (!match) problems.push('.claude/hooks/precommit-check.mjs has no `const SCRIPT = "..."` line. It must name check:fast.');
    else if (match[2] === "check" || match[2] === "build") {
      problems.push(`.claude/hooks/precommit-check.mjs runs "${match[2]}": the pre-commit hook must not run the full check. Set SCRIPT to "check:fast".`);
    }
  }

  return problems;
}

/** The line printed on success; a switched-off rule is not counted as passed. */
export function successLine(rules) {
  if (rules.precommitHookFastOnly === true) return "check:process: all 7 rules passed";
  return "check:process: all 6 rules passed (1 off until the owner switches it on: precommitHookFastOnly)";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const problems = checkProcess(root);
  if (problems.length > 0) {
    for (const problem of problems) console.log(problem);
    console.log(`check:process: ${problems.length} problem${problems.length === 1 ? "" : "s"} found`);
    process.exitCode = 1;
  } else {
    console.log(successLine(loadRules(root, {}).rules));
  }
}
