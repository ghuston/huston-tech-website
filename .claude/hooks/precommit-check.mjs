// HOOK 2: precommit-check (runs before a Bash command that contains `git commit`).
//
// WHAT IT BLOCKS, and why:
//   - Any `git commit` while the project's `check` script (npm run check: lint,
//     typecheck, production build) is failing. The project rule is "run the
//     checks before every commit; if they fail, stop and show the error".
//     When it blocks, it prints the last lines of the real error output.
//   - A commit in a repo with no `check` script in package.json, or an
//     unreadable package.json (fail closed: no check means no commit).
//
// It does not run on main/master (Hook 1 already blocks commits there, so a
// long build would be wasted), and it ignores commands that are not a real
// commit (for example `git commit --help` or `--dry-run`).
//
// On success it tells the owner how long the check took, as a one-line notice.
//
// Known limits: it checks the working folder, not only staged files; and for
// `git add . && git commit` the check runs before the add. Fine for this repo.

import { spawnSync } from "node:child_process";
import {
  PROTECTED_BRANCHES,
  block,
  commandsOf,
  currentBranch,
  guard,
  parseGit,
  projectDirOf,
  readPackageJson,
} from "./lib.mjs";

const SCRIPT = "check";
const TAIL_LINES = 60;

guard("precommit-check", (input) => {
  const command = input.tool_input?.command;
  if (typeof command !== "string") throw new Error("no Bash command in the hook input");

  const commits = commandsOf(command)
    .filter((c) => c.prog === "git")
    .map(parseGit)
    .filter((g) => g.sub === "commit" && !g.rest.some((a) => ["--help", "-h", "--dry-run"].includes(a)));
  if (commits.length === 0) return;

  const projectDir = projectDirOf(input);
  let branch = "";
  try {
    branch = currentBranch(input.cwd);
  } catch {
    branch = "";
  }
  if (branch && PROTECTED_BRANCHES.includes(branch)) return; // Hook 1 blocks this one.

  const pkg = readPackageJson(projectDir);
  if (!pkg.scripts?.[SCRIPT]) {
    block(
      `Blocked: package.json has no "${SCRIPT}" script, so I can't run the pre-commit check. ` +
        `Do this instead: add a "${SCRIPT}" script (lint, typecheck, build), then commit again.`,
    );
  }

  const started = Date.now();
  const run = spawnSync("npm", ["run", SCRIPT], {
    cwd: projectDir,
    encoding: "utf8",
    timeout: 570_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  if (run.error || run.status !== 0) {
    const output = `${run.stdout ?? ""}${run.stderr ?? ""}`.trim().split("\n").slice(-TAIL_LINES).join("\n");
    block(
      `Blocked: "npm run ${SCRIPT}" failed after ${seconds}s${run.error ? ` (${run.error.message})` : ""}, so the commit did not happen.\n` +
        `Last ${TAIL_LINES} lines of output:\n${output}\n` +
        "Do this instead: fix the error above, then commit again. Do not use --no-verify.",
    );
  }

  process.stdout.write(JSON.stringify({ systemMessage: `Pre-commit check passed: npm run ${SCRIPT} took ${seconds}s.` }));
});
