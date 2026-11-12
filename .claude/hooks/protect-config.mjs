// HOOK 3: protect-config (runs before Claude's Edit and Write tools).
//
// WHAT IT DOES, and why:
//   It ASKS (pauses and shows an approve/decline prompt; it does not block)
//   before Claude changes a file that controls safety rules, deploys or Claude's
//   own behavior:
//     .claude/settings.json, .claude/settings.local.json, .claude/hooks/**,
//     .claude/skills/**, .github/workflows/**, wrangler.jsonc, .gitignore,
//     CLAUDE.md, AGENTS.md, package.json
//   Asking (not blocking) means the owner can always approve a legitimate fix,
//   so these hooks can never lock Claude out of repairing itself.
//
// It never answers "allow", so it can only add friction, never remove it.
// Hook 1 applies the same list to Bash commands that write files.

import path from "node:path";
import { ask, guard, projectDirOf, protectedMatch } from "./lib.mjs";

guard("protect-config", (input) => {
  const filePath = input.tool_input?.file_path;
  if (typeof filePath !== "string") throw new Error("no file_path in the hook input");
  const projectDir = projectDirOf(input);
  const hit = protectedMatch(path.resolve(input.cwd ?? projectDir, filePath), projectDir);
  if (hit) {
    ask(
      `Claude wants to change protected file "${hit}". It controls safety rules, deploys, or Claude's behavior. ` +
        "Approve only if you asked for this change.",
    );
  }
});
