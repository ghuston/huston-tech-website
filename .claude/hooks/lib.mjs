// Shared helpers for the Claude Code hooks in this folder.
//
// What lives here: reading the JSON that Claude Code sends to a hook, printing
// "blocked" / "ask" / "warning" answers in the format Claude Code understands,
// a small shell-command parser, and the list of files that need approval.
//
// Why a parser: searching a command for the text "--no-verify" would wrongly
// block `git commit -m "never use --no-verify"`. The parser splits a command
// into real commands and real words, so only actual flags are matched.
//
// Honest limit: these hooks are a seatbelt against Claude's own mistakes, not a
// security wall. A determined person could still get around them.
//
// Nothing here names a business or project. Repo facts come from package.json.

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

export const PROTECTED_BRANCHES = ["main", "master"];

// Owner-only paths (relative to the project root, lower-case because macOS is
// case-insensitive). Claude may never change these: the hooks BLOCK (exit 2) in
// every mode. The owner edits them by hand (see README.md, "Changing protected files").
const OWNER_ONLY_DIRS = [".claude/hooks/", ".claude/agents/", ".claude/skills/", ".github/workflows/"];
const OWNER_ONLY_FILE = /^\.claude\/settings[^/]*\.json$/;

// Files Claude must ASK the owner about before changing (lower-case).
// Hook 3 uses the lists for Edit/Write; Hook 1 reuses them for Bash.
const ASK_FILES = ["wrangler.jsonc", ".gitignore", "claude.md", "agents.md", "package.json"];

const SUBST_OPEN = "\u0001";
const SUBST_CLOSE = "\u0002";

// ---------- talking to Claude Code ----------

// Exit code 2 means "block". The text on stderr is shown as the reason.
export function block(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

// Exit 0 with this JSON means "pause and ask the user to approve or decline".
export function ask(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

export function readInput() {
  const raw = readFileSync(0, "utf8");
  const input = JSON.parse(raw);
  if (!input || typeof input !== "object") throw new Error("input is not a JSON object");
  return input;
}

// Fail closed: if the hook body throws for any reason, block and say so.
export function guard(hookName, body) {
  try {
    body(readInput());
  } catch (error) {
    block(
      `Blocked: the "${hookName}" hook crashed or could not read its input (${error.message}). ` +
        `Blocking to be safe. Do this instead: fix .claude/hooks/${hookName}.mjs ` +
        `(run "node .claude/hooks/selftest.mjs" to see what broke), or ask the repo owner.`,
    );
  }
}

// ---------- repo facts ----------

export function projectDirOf(input) {
  return process.env.CLAUDE_PROJECT_DIR || input.cwd;
}

export function readPackageJson(dir) {
  try {
    return JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

// Returns the branch name, or null when HEAD is detached. Throws if not a git
// repo, which makes the calling guard fail closed.
export function currentBranch(cwd) {
  try {
    return execFileSync("git", ["-C", cwd, "symbolic-ref", "--short", "-q", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch (error) {
    if (error.status === 1) return null;
    throw error;
  }
}

// { path, level } where level is "deny" (owner-only, block) or "ask", or null.
// Matching ignores letter case and resolves ".." (path.resolve), but does not follow symlinks.
export function protectionOf(absPath, projectDir) {
  const rel = path.relative(projectDir, absPath).split(path.sep).join("/");
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  const key = rel.toLowerCase();
  if (OWNER_ONLY_FILE.test(key) || OWNER_ONLY_DIRS.some((dir) => key.startsWith(dir) || `${key}/` === dir)) {
    return { path: rel, level: "deny" };
  }
  if (ASK_FILES.includes(key)) return { path: rel, level: "ask" };
  return null;
}

// Older callers (and copies of this folder in other repos) only want the path.
export function protectedMatch(absPath, projectDir) {
  return protectionOf(absPath, projectDir)?.path ?? null;
}

export function blockOwnerOnly(rel) {
  block(
    `Blocked: ${rel} is an owner-only protected path (hooks, agents, skills, workflows, settings). ` +
      "Claude cannot change it in any mode. Do this instead: write the proposed content to the scratchpad " +
      "folder and tell the owner which file to copy it to; the owner edits it by hand (see .claude/hooks/README.md).",
  );
}

// ---------- shell command parser ----------

export const hasSubstitution = (word) => word.includes(SUBST_OPEN);
export const substitutionText = (word) =>
  [...word.matchAll(new RegExp(`${SUBST_OPEN}([^${SUBST_CLOSE}]*)${SUBST_CLOSE}`, "g"))]
    .map((m) => m[1])
    .join(" ");

// Remove heredoc bodies (cat <<'EOF' ... EOF). Their text is data, not commands.
function stripHeredocs(src) {
  const start = /(?<!<)<<(?!<)-?[ \t]*(['"]?)([A-Za-z_]\w*)\1/;
  let out = src;
  for (let n = 0; n < 20; n++) {
    const m = start.exec(out);
    if (!m) return out;
    const markerEnd = m.index + m[0].length;
    const newline = out.indexOf("\n", markerEnd);
    if (newline < 0) throw new Error("heredoc has no body");
    const terminator = new RegExp(`^\\t*${m[2]}[ \\t]*$`, "m");
    const rest = out.slice(newline + 1);
    const found = terminator.exec(rest);
    if (!found) throw new Error("heredoc is never closed");
    const afterTerminator = newline + 1 + found.index + found[0].length;
    out =
      out.slice(0, m.index) +
      out.slice(markerEnd, newline) +
      "\n" +
      out.slice(afterTerminator + 1);
  }
  throw new Error("too many heredocs to verify");
}

// Finds the matching ")" for a "$(" or "<(" whose inside starts at `start`.
function readParen(src, start) {
  let depth = 1;
  let i = start;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      i += 2;
    } else if (c === "'") {
      const j = src.indexOf("'", i + 1);
      if (j < 0) throw new Error("unbalanced quote");
      i = j + 1;
    } else if (c === '"') {
      i++;
      while (i < src.length && src[i] !== '"') i += src[i] === "\\" ? 2 : 1;
      if (i >= src.length) throw new Error("unbalanced quote");
      i++;
    } else {
      if (c === "(") depth++;
      if (c === ")" && --depth === 0) return { inner: src.slice(start, i), end: i + 1 };
      i++;
    }
  }
  throw new Error("unbalanced parenthesis");
}

// Splits a command string into segments: [{ words, piped, inner }].
// `piped` = this segment receives the previous one's output (cmd1 | cmd2).
// `inner` = this segment came from inside $( ), backticks or <( ).
// Anything inside $( ) is also kept inside the outer word as a marker so later
// checks know "this word is computed, I cannot see its value".
function parseShell(source, depth = 0) {
  if (depth > 5) throw new Error("command is nested too deeply to verify");
  const src = stripHeredocs(source);
  const segments = [];
  let words = [];
  let word = null;
  let piped = false;

  const endWord = () => {
    if (word !== null) words.push(word);
    word = null;
  };
  const endSegment = (nextPiped) => {
    endWord();
    if (words.length) segments.push({ words, piped, inner: false });
    words = [];
    piped = nextPiped;
  };
  const addInner = (text) => {
    for (const s of parseShell(text, depth + 1)) segments.push({ ...s, inner: true });
  };

  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];

    if (c === "\\") {
      if (next !== "\n") word = (word ?? "") + (next ?? "");
      i += 2;
    } else if (c === "'") {
      const j = src.indexOf("'", i + 1);
      if (j < 0) throw new Error("unbalanced single quote");
      word = (word ?? "") + src.slice(i + 1, j);
      i = j + 1;
    } else if (c === '"') {
      i++;
      word = word ?? "";
      for (;;) {
        if (i >= src.length) throw new Error("unbalanced double quote");
        const d = src[i];
        if (d === '"') {
          i++;
          break;
        }
        if (d === "\\") {
          word += src[i + 1] ?? "";
          i += 2;
        } else if (d === "$" && src[i + 1] === "(") {
          const { inner, end } = readParen(src, i + 2);
          addInner(inner);
          word += SUBST_OPEN + inner + SUBST_CLOSE;
          i = end;
        } else if (d === "`") {
          const j = src.indexOf("`", i + 1);
          if (j < 0) throw new Error("unbalanced backtick");
          addInner(src.slice(i + 1, j));
          word += SUBST_OPEN + src.slice(i + 1, j) + SUBST_CLOSE;
          i = j + 1;
        } else {
          word += d;
          i++;
        }
      }
    } else if ((c === "$" || c === "<" || c === ">") && next === "(") {
      const { inner, end } = readParen(src, i + 2);
      addInner(inner);
      word = (word ?? "") + SUBST_OPEN + inner + SUBST_CLOSE;
      i = end;
    } else if (c === "`") {
      const j = src.indexOf("`", i + 1);
      if (j < 0) throw new Error("unbalanced backtick");
      addInner(src.slice(i + 1, j));
      word = (word ?? "") + SUBST_OPEN + src.slice(i + 1, j) + SUBST_CLOSE;
      i = j + 1;
    } else if (c === " " || c === "\t") {
      endWord();
      i++;
    } else if (c === "\n" || c === ";") {
      endSegment(false);
      i++;
    } else if (c === "&") {
      if (next === "&") {
        endSegment(false);
        i += 2;
      } else if (word !== null && /[<>]$/.test(word)) {
        word += c; // redirect such as 2>&1
        i++;
      } else {
        endSegment(false);
        i++;
      }
    } else if (c === "|") {
      if (next === "|") {
        endSegment(false);
        i += 2;
      } else {
        endSegment(true);
        i += next === "&" ? 2 : 1;
      }
    } else if (c === "(" || c === ")") {
      endSegment(false);
      i++;
    } else if (c === "#" && word === null) {
      while (i < src.length && src[i] !== "\n") i++;
    } else {
      word = (word ?? "") + c;
      i++;
    }
  }
  endSegment(false);
  return segments;
}

const WRAPPERS = new Set(["sudo", "command", "env", "time", "nohup", "exec", "builtin", "nice", "xargs"]);
const SHELLS = new Set(["sh", "bash", "zsh", "dash", "ksh"]);
export const baseName = (word) => path.basename(word);

// Parses a command into a flat list of real commands:
// [{ prog, args, words, piped, inner }]. Looks inside `bash -c "..."` too.
export function commandsOf(source, depth = 0) {
  const result = [];
  for (const segment of parseShell(source, depth)) {
    let w = segment.words.slice();
    const isAssignment = (x) => /^[A-Za-z_]\w*=/.test(x);
    while (w.length && isAssignment(w[0])) w.shift();
    while (w.length && WRAPPERS.has(baseName(w[0]))) {
      w.shift();
      while (w.length && (w[0].startsWith("-") || isAssignment(w[0]))) w.shift();
    }
    if (!w.length) continue;
    const command = {
      prog: baseName(w[0]),
      args: w.slice(1),
      words: segment.words,
      piped: segment.piped,
      inner: segment.inner,
    };
    result.push(command);
    if (SHELLS.has(command.prog)) {
      const k = command.args.findIndex((a) => /^-[a-zA-Z]*c$/.test(a));
      if (k >= 0 && command.args[k + 1] !== undefined) {
        for (const c of commandsOf(command.args[k + 1], depth + 1)) result.push({ ...c, inner: true });
      }
    }
  }
  return result;
}

// Splits "git -C dir commit -m x" into { sub: "commit", rest: ["-m","x"], dir }.
export function parseGit(command) {
  const withValue = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path"]);
  const a = command.args;
  let dir = null;
  let i = 0;
  while (i < a.length && a[i].startsWith("-")) {
    if (a[i] === "-C") dir = a[i + 1];
    i += withValue.has(a[i]) ? 2 : 1;
  }
  return { sub: a[i] ?? null, rest: a.slice(i + 1), dir };
}
