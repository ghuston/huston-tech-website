// HOOK 3: protect-config (runs before Claude's Edit and Write tools).
//
// WHAT IT DOES, and why:
//   Owner-only paths are BLOCKED (exit 2, in every mode). Claude may never change:
//     .claude/hooks/**, .claude/agents/**, .claude/skills/**, .github/workflows/**,
//     .claude/settings*.json
//   The owner edits these by hand (see README.md, "Changing protected files").
//
//   wrangler.jsonc, .gitignore, CLAUDE.md, AGENTS.md and package.json used to ASK for approval.
//   They no longer do (owner decision, Nov 18); GitHub's required checks and review are the gate.
//
// The lists, and the case-insensitive matching, live in lib.mjs (protectionOf).
// It never answers "allow", so it can only add friction, never remove it.
// Hook 1 applies the same owner-only list to Bash commands that write files.

import path from "node:path";
import { blockOwnerOnly, guard, projectDirOf, protectionOf } from "./lib.mjs";

guard("protect-config", (input) => {
  const filePath = input.tool_input?.file_path;
  if (typeof filePath !== "string") throw new Error("no file_path in the hook input");
  const projectDir = projectDirOf(input);
  const hit = protectionOf(path.resolve(input.cwd ?? projectDir, filePath), projectDir);
  if (hit?.level === "deny") blockOwnerOnly(hit.path);
});
