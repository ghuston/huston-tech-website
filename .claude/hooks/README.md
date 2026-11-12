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
| `guard-bash.mjs` | before Bash | Blocks commits/pushes on main, force push, `--no-verify`, `gh pr merge`, `wrangler deploy/publish`, risky `rm -r`, `curl \| sh`, staging or reading secret files. Asks before Bash writes to protected files. |
| `precommit-check.mjs` | before Bash (`git commit`) | Runs the `check` script from `package.json`; blocks the commit if it fails and shows the error. |
| `protect-config.mjs` | before Edit/Write | Asks before changing settings, hooks, skills, workflows, `wrangler.jsonc`, `.gitignore`, `CLAUDE.md`, `AGENTS.md`, `package.json`. |
| `scan-src.mjs` | after Edit/Write | Warn-only scan of changed `src/` files: hard-coded colors, `rounded-`/`shadow-`, `dangerouslySetInnerHTML`, copy in JSX. |

`lib.mjs` is shared helpers (command parser, output format). `selftest.mjs`
checks everything with sample inputs: `node .claude/hooks/selftest.mjs`.

## Reusing in a client repo

1. Copy the whole `.claude/hooks/` folder and the `hooks` block of `settings.json`.
2. Make sure `package.json` has a `check` script (lint, typecheck, build).
3. Edit the lists at the top of each file if the repo differs (protected files in
   `lib.mjs`, allowed `rm -r` folders in `guard-bash.mjs`, `COLOR_EXEMPT` in `scan-src.mjs`).
4. Run `node .claude/hooks/selftest.mjs`.

## Known limits

- In auto mode, Hook 3's "ask" does not prompt (the auto-mode classifier decides instead). Hooks 1, 2 and 4 work in every mode.

## Rules these scripts follow

- Exit code 2 = block. Any other failure exit does NOT block, so every guard
  catches its own crashes and `settings.json` sets `"onFailure": "block"`.
- Hooks never answer "allow", so they cannot override a `permissions.deny` rule.
- Hooks are a seatbelt against honest mistakes, not a security boundary.
