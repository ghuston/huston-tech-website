// HOOK 1: guard-bash (runs before every Bash command Claude wants to run).
//
// WHAT IT BLOCKS, and why:
//   - git commit / git push while on main or master (work happens on branches;
//     a commit chained after a branch switch is also blocked because the branch
//     can't be verified in advance)
//   - git push that targets main/master from any branch (changes reach main
//     only through a pull request)
//   - git push --force (and --force-with-lease, +branch): it can destroy history
//   - --no-verify on git commands: it skips the safety checks
//   - gh pr merge (even with gh's global flags like -R owner/repo) and merging
//     through gh api (pulls/<n>/merge, mergePullRequest, enablePullRequestAutoMerge):
//     the repo owner merges, never Claude
//   - wrangler deploy / publish (also via npx, or an npm script that runs them):
//     deploys happen only by merging to main
//   - rm -r / rm -rf unless every target is a scratch folder or a build folder
//   - curl or wget piped into a shell or interpreter (runs unread code)
//   - git add of secret files (.env, .dev.vars, secrets/) and Bash commands that
//     read them (the permissions.deny rules only cover Claude's Read tool)
//   Anything it cannot parse is also blocked ("fail closed").
//
// WHAT IT ASKS ABOUT (pauses for the owner to approve):
//   - Bash commands that write to protected files (settings, hooks, workflows,
//     .gitignore, CLAUDE.md, AGENTS.md, package.json, wrangler.jsonc), the same
//     list Hook 3 guards for the Edit and Write tools.
//
// It never says "allow", so it can only make things stricter than the
// permission rules already are.

import path from "node:path";
import {
  PROTECTED_BRANCHES,
  ask,
  baseName,
  block,
  commandsOf,
  currentBranch,
  guard,
  hasSubstitution,
  parseGit,
  projectDirOf,
  protectedMatch,
  readPackageJson,
  substitutionText,
} from "./lib.mjs";

const SCRATCH_PREFIX = "/private/tmp/claude-";
const BUILD_FOLDERS = ["out", ".next", ".wrangler", "node_modules"];
const SHELL_LIKE = new Set(["sh", "bash", "zsh", "dash", "ksh", "node", "python", "python3", "perl", "ruby", "php", "deno", "bun"]);
const NPM_LIKE = new Set(["npm", "pnpm", "yarn", "bun"]);
const READ_OK = new Set(["ls", "stat", "test", "[", "[[", "git", "gh", "echo", "printf", "rm"]);
const CODE_RUNNERS = new Set(["node", "python", "python3", "perl", "ruby", "deno", "bun", "awk", "sed"]);
const WRITERS = new Set(["tee", "cp", "mv", "rm", "install", "ln", "truncate", "patch", "dd"]);

const stripRedirect = (w) => w.replace(/^[0-9]*[<>]+/, "");
const isDynamic = (w) => hasSubstitution(w) || /[$*?[\]~{}]/.test(w);

function isSecretPath(word) {
  const w = stripRedirect(word);
  const parts = w.split("/");
  const last = parts[parts.length - 1];
  return (
    /^(\.env(\.(?!example$)[\w.-]+)?|\.dev\.vars(\.[\w.-]+)?)$/.test(last) ||
    parts.slice(0, -1).includes("secrets") ||
    w === "secrets"
  );
}

// Words after gh, skipping gh's global flags (-R owner/repo, --repo owner/repo, --repo=...).
function ghPositionals(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-R" || a === "--repo") i++;
    else if (!a.startsWith("-")) out.push(a);
  }
  return out;
}

// True if a gh api argument merges a PR: REST pulls/<n>/merge (any method), or the
// GraphQL mutations, including inside -f/-F query=... values.
function mergesViaApi(arg) {
  const text = `${arg} ${substitutionText(arg)}`;
  return /pulls\/\d+\/merge/.test(text) || /mergePullRequest|enablePullRequestAutoMerge/.test(text);
}

function runsWrangler(words) {
  const i = words.findIndex((w) => baseName(w) === "wrangler");
  if (i < 0) return false;
  const after = words.slice(i + 1);
  return after.some((w, k) => w === "deploy" || w === "publish" || (w === "upload" && after[k - 1] === "versions"));
}

function deploysViaScript(command, pkg, seen, depth) {
  if (!NPM_LIKE.has(command.prog) || depth > 4) return false;
  const scripts = pkg.scripts ?? {};
  for (const arg of command.args) {
    if (!scripts[arg] || seen.has(arg)) continue;
    seen.add(arg);
    for (const inner of commandsOf(scripts[arg])) {
      if (runsWrangler([inner.prog, ...inner.args]) || deploysViaScript(inner, pkg, seen, depth + 1)) return true;
    }
  }
  return false;
}

function checkRm(command, cwd, projectDir, scratchDir, sawCd) {
  const flags = command.args.filter((a) => a.startsWith("-") && a !== "--");
  const recursive = flags.some((f) => f === "--recursive" || (!f.startsWith("--") && /[rR]/.test(f)));
  if (!recursive) return null;
  const targets = command.args.filter((a) => !a.startsWith("-"));
  if (targets.length === 0) return "rm -r with no target I can verify";
  if (sawCd) return "rm -r after a cd, so the folder can't be verified";
  const allowedRoots = [
    ...(scratchDir ? [path.resolve(scratchDir)] : []),
    ...BUILD_FOLDERS.map((f) => path.join(projectDir, f)),
  ];
  for (const target of targets) {
    if (isDynamic(target)) return `rm -r target "${target}" uses a variable, wildcard or ~, so it can't be verified`;
    const abs = path.resolve(cwd, target);
    const okScratch = abs.startsWith(SCRATCH_PREFIX);
    const okRoot = allowedRoots.some((root) => abs === root || abs.startsWith(root + path.sep));
    if (!okScratch && !okRoot) return `rm -r target "${target}" is not a scratch or build folder`;
  }
  return null;
}

function isForcePush(rest) {
  return rest.some(
    (a) =>
      a === "--force" ||
      a.startsWith("--force-with-lease") ||
      a === "--force-if-includes" ||
      (/^-[a-zA-Z]+$/.test(a) && a.includes("f")) ||
      /^\+[^\s]/.test(a),
  );
}

guard("guard-bash", (input) => {
  const command = input.tool_input?.command;
  if (typeof command !== "string") throw new Error("no Bash command in the hook input");
  const cwd = input.cwd;
  const projectDir = projectDirOf(input);
  const pkg = readPackageJson(projectDir);
  const cmds = commandsOf(command);

  const git = cmds.filter((c) => c.prog === "git").map((c) => ({ command: c, ...parseGit(c) }));
  const mutating = git.filter((g) => g.sub === "commit" || g.sub === "push");
  const sawCd = cmds.some((c) => c.prog === "cd" || c.prog === "pushd");

  // 1. Never commit or push while on a protected branch.
  if (mutating.length) {
    const switchesBranch =
      sawCd ||
      git.some(
        (g) =>
          g.sub === "switch" ||
          (g.sub === "checkout" && !g.rest.includes("--")) ||
          (g.sub === "branch" && g.rest.some((a) => /^-[mM]$/.test(a) || a === "--move")),
      );
    if (switchesBranch) {
      block(
        "Blocked: this command switches branch or folder and then commits or pushes, so I can't verify which branch it will land on. " +
          "Do this instead: run the switch as its own command first, then commit or push in a separate command.",
      );
    }
    for (const g of mutating) {
      const branch = currentBranch(g.dir ? path.resolve(cwd, g.dir) : cwd);
      if (branch === null) {
        block(
          `Blocked: git ${g.sub} on a detached HEAD (not on any branch). Do this instead: git switch -c type/short-name, then try again.`,
        );
      }
      if (PROTECTED_BRANCHES.includes(branch)) {
        block(
          `Blocked: git ${g.sub} while on "${branch}". Work never goes straight to ${branch}. ` +
            "Do this instead: git switch -c type/short-name (for example feat/faq-section), commit there, and open a pull request.",
        );
      }
    }
  }

  for (const g of git) {
    // 2. Pushes aimed at main/master, and force pushes.
    if (g.sub === "push") {
      const positional = g.rest.filter((a) => !a.startsWith("-"));
      const refspecs = positional.length > 1 ? positional.slice(1) : positional;
      for (const spec of refspecs) {
        const dest = spec.replace(/^\+/, "").split(":").pop().replace(/^refs\/heads\//, "");
        if (PROTECTED_BRANCHES.includes(dest)) {
          block(
            `Blocked: git push targeting "${dest}". Changes reach ${dest} only by merging a pull request. ` +
              "Do this instead: push your feature branch and open a PR.",
          );
        }
      }
      if (isForcePush(g.rest)) {
        block(
          "Blocked: git push --force (or --force-with-lease, or +branch). It can destroy other people's history. " +
            "Do this instead: use a normal git push; if history truly must change, tell the repo owner and let them decide.",
        );
      }
    }
    // 3. Skipping safety checks.
    const skips =
      g.rest.includes("--no-verify") || (g.sub === "commit" && g.rest.some((a) => /^-[a-zA-Z]*n[a-zA-Z]*$/.test(a)));
    if (skips) {
      block(
        "Blocked: --no-verify (or -n) skips the safety checks. Do this instead: fix whatever the check reports, then commit normally.",
      );
    }
    // 4. Staging secret files.
    if (g.sub === "add") {
      const forced = g.rest.some((a) => a === "-f" || a === "--force");
      if (forced || g.rest.some((a) => !a.startsWith("-") && isSecretPath(a))) {
        block(
          "Blocked: git add of a secret file (.env, .dev.vars, secrets/) or git add --force. Secrets are never committed. " +
            "Do this instead: stage specific safe files by name; only .env.example may be committed.",
        );
      }
    }
  }

  for (let i = 0; i < cmds.length; i++) {
    const c = cmds[i];

    // 5. The owner merges: gh pr merge, and merging through gh api.
    if (c.prog === "gh") {
      const sub = ghPositionals(c.args);
      if (sub[0] === "pr" && sub[1] === "merge") {
        block("Blocked: gh pr merge. The repo owner merges pull requests. Do this instead: tell the owner the PR is ready and link it.");
      }
      if (sub[0] === "api" && c.args.some(mergesViaApi)) {
        block(
          "Blocked: merging a PR through gh api. The repo owner merges. Do this instead: tell the owner the PR is ready and link it.",
        );
      }
    }

    // 6. Deploys happen only by merging to main.
    if (runsWrangler([c.prog, ...c.args]) || deploysViaScript(c, pkg, new Set(), 0)) {
      block(
        "Blocked: a wrangler deploy or publish (directly or through an npm script). Deploys happen only by merging to main. " +
          "Do this instead: open a PR and let the owner merge it.",
      );
    }

    // 7. Recursive delete outside scratch and build folders.
    if (c.prog === "rm") {
      const problem = checkRm(c, cwd, projectDir, input.scratchpad_dir, sawCd);
      if (problem) {
        block(
          `Blocked: ${problem}. rm -r is allowed only inside the scratchpad, /private/tmp/claude-*, or this repo's out, .next, .wrangler and node_modules. ` +
            "Do this instead: delete one named file with plain rm, or ask the repo owner.",
        );
      }
    }

    // 8. Downloaded code piped straight into a shell or interpreter.
    if (SHELL_LIKE.has(c.prog)) {
      const feeds = c.piped && (() => {
        for (let j = i - 1; j >= 0; j--) if (!cmds[j].inner) return ["curl", "wget"].includes(cmds[j].prog);
        return false;
      })();
      const substitutes = c.words.some((w) => hasSubstitution(w) && /\b(curl|wget)\b/.test(substitutionText(w)));
      if (feeds || substitutes) {
        block(
          "Blocked: curl or wget feeding a shell or interpreter. That runs code nobody has read. " +
            "Do this instead: download to a file (curl -o file), read it, and ask the repo owner before running it.",
        );
      }
    }

    // 9. Reading secret files through Bash (the Read deny rules don't cover this).
    if (!READ_OK.has(c.prog)) {
      const direct = c.words.slice(1).some(isSecretPath);
      const embedded =
        CODE_RUNNERS.has(c.prog) && c.words.some((w) => /(^|[/\s'"=<>])\.(env(\.(?!example\b)[\w.-]+)?|dev\.vars)\b/.test(w));
      if (direct || embedded) {
        block(
          "Blocked: a command that reads a secret file (.env, .dev.vars, secrets/). Secrets stay out of my view. " +
            "Do this instead: ask the repo owner to read the value, or use .env.example for variable names.",
        );
      }
    }
  }

  // 10. Writes to protected files through Bash: ask, don't block.
  const touched = new Set();
  for (const c of cmds) {
    const writes =
      WRITERS.has(c.prog) ||
      (["sed", "perl", "awk"].includes(c.prog) && c.args.some((a) => /^-[a-zA-Z]*i/.test(a) || a === "--in-place")) ||
      (c.prog === "git" && ["apply", "restore", "checkout"].includes(parseGit(c).sub)) ||
      c.words.some((w) => /^[0-9]*>/.test(w));
    if (!writes) continue;
    for (const w of c.words) {
      const target = stripRedirect(w);
      if (!target || isDynamic(target) || target.startsWith("-")) continue;
      const hit = protectedMatch(path.resolve(cwd, target), projectDir);
      if (hit) touched.add(hit);
    }
  }
  if (touched.size) {
    ask(
      `This Bash command writes to protected file(s): ${[...touched].join(", ")}. ` +
        "These control safety rules, deploys or Claude's behavior. Approve only if you asked for this change.",
    );
  }
});
