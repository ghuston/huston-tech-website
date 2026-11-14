# Claude Code hooks (Gate 1)

Small Node scripts that Claude Code runs automatically around its own tool calls.
They are registered in `.claude/settings.json`. They hold no business name; repo
facts come from `package.json`, so the folder can be copied into another repo.

## If a hook breaks and blocks everything (recovery)

The guards "fail closed": if a script crashes, the action is blocked. Hooks only
gate Claude's tools, never you, so fix it from your own terminal or editor:

```bash
node .claude/hooks/selftest.mjs        # shows which hook or case fails
git restore .claude/                   # undo uncommitted changes to hooks and settings
```

Or temporarily switch branches (`git switch main`) to get the last good copy.

## The four hooks

| File | Event | Does |
|---|---|---|
| `guard-bash.mjs` | before Bash | Blocks commits/pushes on main, force push, `--no-verify`, `gh pr merge`, `wrangler deploy/publish`, risky `rm -r`, `curl \| sh`, staging or reading secret files, and Bash writes to the owner-only paths above. Asks before Bash writes to the "ask" files. |
| `precommit-check.mjs` | before Bash (`git commit`) | Runs the `check` script from `package.json`; blocks the commit if it fails and shows the error. |
| `protect-config.mjs` | before Edit/Write | **Blocks** (exit 2) any change to `.claude/hooks/**`, `.claude/agents/**`, `.claude/skills/**`, `.github/workflows/**` and `.claude/settings*.json`. **Asks** before changing `wrangler.jsonc`, `.gitignore`, `CLAUDE.md`, `AGENTS.md`, `package.json`. |
| `scan-src.mjs` | after Edit/Write | Warn-only scan of changed `src/` files: hard-coded colors, `rounded-`/`shadow-`, `dangerouslySetInnerHTML`, copy in JSX. |

`lib.mjs` is shared helpers (command parser, output format). `selftest.mjs`
checks everything with sample inputs: `node .claude/hooks/selftest.mjs`.

## Reusing in a client repo

1. Copy the whole `.claude/hooks/` folder and the `hooks` block of `settings.json`.
2. Make sure `package.json` has a `check` script (lint, typecheck, build).
3. Edit the lists at the top of each file if the repo differs (protected files in
   `lib.mjs`, allowed `rm -r` folders in `guard-bash.mjs`, `COLOR_EXEMPT` in `scan-src.mjs`).
4. Run `node .claude/hooks/selftest.mjs`.

## Changing protected files (owner only)

Claude cannot edit the owner-only paths (hooks, agents, skills, workflows, settings) in any
mode. To change one:

1. Claude writes the proposed file (or a patch) into the scratchpad folder and tells you the target path.
2. In your own terminal or editor, copy it into place, for example `cp <scratchpad>/ci.yml.new .github/workflows/ci.yml`.
3. Run `git diff --stat` and `node .claude/hooks/selftest.mjs`; the last line must say `All N passed`.
4. Ask Claude to `git add`, commit and open the PR. Staging and committing are not blocked.

Nothing in the repo can unlock these paths, so Claude cannot flip it either. Reading them
(`cat`, `cp` from them) is fine.

## Known limits

- A hook that exits 2 stops the tool call and Claude sees the message. The Claude Code docs do not name every permission mode for this, so after any change run the live tests (try an edit of a workflow in default and in Auto mode and confirm "Blocked").
- A hook's "ask" goes to the normal permission prompt; in Auto mode the classifier can still decide some protected-path writes first. That is why the owner-only paths are blocked, not asked.
- Bash is only partly parsed: `cp`, `mv`, `rm`, `tee`, `sed -i`, redirects and `git restore` are checked, but a script that opens the file itself (`node -e`, `python -c`) is not. The hooks are a seatbelt, not a wall.
- Matching is case-insensitive (macOS) and resolves `..`, but it does not follow symlinks.

## Rules these scripts follow

- Exit code 2 = block. Any other failure exit does NOT block, so every guard
  catches its own crashes and `settings.json` sets `"onFailure": "block"`.
- Hooks never answer "allow", so they cannot override a `permissions.deny` rule.
- Hooks are a seatbelt against honest mistakes, not a security boundary.
