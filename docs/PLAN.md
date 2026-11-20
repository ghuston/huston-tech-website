# Autonomous run plan

The task list for an autonomous run described in CLAUDE.md, "Autonomous runs". Progress is tracked in
`docs/STATUS.md`. One PR per task. Grant fills in the task list before starting a run; Claude does not invent tasks.

## Tasks

0. **Autonomy hooks and rules (done by hand-copy, 2026-11-20).** Port the site-template process v2 changes: the hooks
   allow exactly `gh pr merge <number> --auto --squash|--merge`, the five "ask" files stop asking, the selftest and
   workflow comments are updated, and CLAUDE.md gets the "Autonomous runs" section plus this plan and the status log.

(Add the next tasks here, one per line, each small enough for one PR.)

## Stop list

Queue the item and continue with other tasks on: secrets or credentials, DNS, accounts or money, sending real email,
deleting user data, lowering any threshold or required check, or any owner-only path (`.claude/hooks|agents|skills|
settings*.json`, `.github/workflows`). For owner-only changes, write `<file>.proposed` to the scratchpad and list it.

New dependencies: exact-pinned, at least 7 days old (`npm view <pkg> time`), and `dependency-review` must pass. Flag
them in the summary.

## End of run

Post one summary with every PR link and whether it merged, anything flagged (dependencies, judgment calls), the stop
queue, and the exact hand-copy commands for all proposals in one batch. Update `docs/STATUS.md`.
