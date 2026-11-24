# Port the website process: plan

Run: "Port the website process" (process run, 2026-11-24). Brief approved by Grant; brainstorming skipped.
Executed inline (`superpowers:executing-plans`), one branch (`chore/port-website-process`), one PR.

## Goal

Bring this repo in line with the build process in `huston-logic/site-template` (`docs/PROCESS.md`): fast check per
commit, full check once per PR, process rules checked by `npm run check:process`, short STATUS.md. Port the process
only. Change no page, copy, image or style. Never remove a test, weaken an assertion, lower a threshold or change
which checks are required.

## Source

Read-only clone of the template's `main` in the scratchpad (commit `99e5378`). Never edited. Pre-flight passed:
`docs/PROCESS.md`, `scripts/check-process.mjs`, `check:fast`, the agents `scout` and `docs-writer`, and
`"precommitHookFastOnly": true` in the template's `scripts/process-rules.json` all exist.

## Not ported (listed under Needs Grant, not built)

The config system (`site.config.ts`, `check:config`, `sync-config.mjs`), the change-scope tools (`check:scope`,
`docs/CHANGE-SCOPE.md`, `change-report`), the other script tests (redirects, image alt and metadata), `docs/TEMPLATE.md`,
`docs/SECRETS.md`, the `src/lib/*.test.ts` run in the template's `test:worker`.

## Tasks (one commit each, `npm run check:fast` before each commit)

1. **Scripts.** Copy `scripts/check-process.mjs`, `scripts/check-process.test.mjs`, `scripts/process-rules.json`
   (`precommitHookFastOnly` false). In `package.json` add `check:process`, `test:scripts`, `check:fast` (process
   check, lint, typecheck, worker tests, script tests) and make `check` = `check:fast` then `build`.
2. **Lighthouse.** `numberOfRuns` 5 to 3 in `lighthouserc.cjs`; the two comments and the README sentence that say
   "5 runs" say 3. Thresholds and assertions untouched.
3. **PROCESS.md and LAUNCH-CHECKLIST.md.** Copy both from the template. PROCESS.md gets the "follows the template as of
   <commit>" line under its title and this repo's own Timings.
4. **CLAUDE.md.** "Autonomous runs" replaced with the template's; the lines that say the full check runs on every
   commit (Git workflow, Decision authority, Commands, Status rules) updated. Site-specific text kept.
5. **STATUS.md.** Current state, Needs Grant, For the master and the last run only, under 150 lines. Older history and
   the Archive move unchanged to `docs/history/STATUS-history.md`. Every open Needs Grant item kept.
6. **Pipeline handbook.** One line at the top of `docs/pipeline/README.md`; nothing else changes.
7. **Owner-only files.** For each file under `.claude/hooks`, `.claude/agents` and `.claude/settings.json` that differs
   from the template, write the template's version as a `.proposed` file in the scratchpad, plus one batch script
   (`apply-owner-batch.sh`) that makes `chore/owner-fast-hooks`, copies them in, sets `precommitHookFastOnly` to true
   and runs the hook selftest, `npm run check:process` and `npm run check`. Site-specific differences are kept and
   listed (the "Huston Tech site" wording in the three review agents).
8. **Closing.** Full `npm run check`, whole-branch review, PR, auto-merge (`gh pr merge <n> --auto --squash`). STATUS.md
   gets this run's timing table; Needs Grant gets the batch steps; For the master gets one line.

## Verification

- `npm run check:process` passes (6 of 7 rules; rule 7 stays off until the owner batch).
- `npm run test:scripts` passes (12 tests). `npm run check` passes.
- `git diff main --stat` shows no file under `src/`, `public/` or `worker/`.
- CI's four required checks and CodeQL are the gate; CI workflow files are not touched.
