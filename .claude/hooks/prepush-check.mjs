// HOOK 5: prepush-check (runs before a Bash command that contains `git push` or `gh pr create`).
//
// WHAT IT BLOCKS, and why:
//   - Any `git push` or `gh pr create` while the project's full `check` script
//     (npm run check: the fast check plus the production build) is failing.
//     The per-commit hook only runs the fast check, so the build is proven here,
//     once, before the work leaves this machine. When it blocks, it prints the
//     last lines of the real error output.
//   - A push or PR in a repo with no `check` script in package.json, or an
//     unreadable package.json (fail closed: no check means no push).
//
// It does not run on main/master (guard-bash already blocks pushes there), and
// it ignores commands that are not a real push or PR (for example `--help`,
// `-h` or `--dry-run`).
//
// On success it tells the owner how long the check took, as a one-line notice.
//
// Known limit: it checks the working folder, not only committed files.

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
const SKIP_FLAGS = ["--help", "-h", "--dry-run"];

// Words after gh, skipping gh's global flags (-R owner/repo, --repo owner/repo).
function ghPositionals(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-R" || a === "--repo") i++;
    else if (!a.startsWith("-")) out.push(a);
  }
  return out;
}

guard("prepush-check", (input) => {
  const command = input.tool_input?.command;
  if (typeof command !== "string") throw new Error("no Bash command in the hook input");

  const commands = commandsOf(command);
  const pushes = commands
    .filter((c) => c.prog === "git")
    .map(parseGit)
    .filter((g) => g.sub === "push" && !g.rest.some((a) => SKIP_FLAGS.includes(a)));
  const prs = commands
    .filter((c) => c.prog === "gh")
    .filter((c) => {
      const pos = ghPositionals(c.args);
      return pos[0] === "pr" && pos[1] === "create" && !c.args.some((a) => SKIP_FLAGS.includes(a));
    });
  if (pushes.length === 0 && prs.length === 0) return;

  const projectDir = projectDirOf(input);
  let branch = "";
  try {
    branch = currentBranch(input.cwd);
  } catch {
    branch = "";
  }
  if (branch && PROTECTED_BRANCHES.includes(branch)) return; // guard-bash blocks this one.

  const pkg = readPackageJson(projectDir);
  if (!pkg.scripts?.[SCRIPT]) {
    block(
      `Blocked: package.json has no "${SCRIPT}" script, so I can't run the pre-push check. ` +
        `Do this instead: add a "${SCRIPT}" script (fast check plus build), then push again.`,
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
      `Blocked: "npm run ${SCRIPT}" failed after ${seconds}s${run.error ? ` (${run.error.message})` : ""}, so nothing was pushed and no PR was opened.\n` +
        `Last ${TAIL_LINES} lines of output:\n${output}\n` +
        "Do this instead: fix the error above, commit, then try again.",
    );
  }

  process.stdout.write(JSON.stringify({ systemMessage: `Pre-push check passed: npm run ${SCRIPT} took ${seconds}s.` }));
});
