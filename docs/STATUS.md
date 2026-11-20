# Autonomous run status

Plan: `docs/PLAN.md`. Rules: CLAUDE.md, "Autonomous runs". Updated after every task.

## Tasks

| # | Task | PR | State |
| --- | --- | --- | --- |
| 0 | Autonomy hooks, settings, selftest, workflow comments, Autonomous runs rules, PLAN.md, STATUS.md | this PR | open, ready for auto-merge |

## Judgment calls

- Ported from `huston-logic/site-template` main (process v2, its PR #16), file by file, not copied blind. The hooks here
  matched the template except for the autonomy changes, so `guard-bash.mjs`, `protect-config.mjs`, `selftest.mjs`,
  `README.md` (hooks) and `settings.json` are the template's versions.
- Not ported: the template's genericized "this site" wording in `.claude/agents/review-*.md` (this is Grant's own site, so
  "Huston Tech site" stays), `npm run check:config` in `ci.yml` (no such script here), and the Lighthouse timeout fix from
  `huston-logic/pipeline` PR #26 (it is for a 17-page board; here Lighthouse runs 10 routes in about 9 minutes under the
  15-minute limit).
- Workflow edits are comment-only: the "informational, not required" comments were stale, since `a11y`, `lighthouse` and
  `dependency-review` are required in the ruleset.

## Stop queue

- none

## Flagged dependencies

none
