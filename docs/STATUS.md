# Status

This is the repo's status page. Business priorities live in the Google Doc "00 Huston Logic: Source of Truth", which links
here. Update it in place at the end of every run; do not create dated handoff files. Task list for autonomous runs:
`docs/PLAN.md`. Rules: CLAUDE.md and `docs/PROCESS.md`. Older history: `docs/history/STATUS-history.md`.

## Current state

Updated 2026-11-24.

- **Merged:** Revision 8 (two offers, new Home, /systems), the autonomy hooks and auto-merge rules, and the status rules
  in CLAUDE.md with this file's restructure. Merging into `main` deploys through Cloudflare Workers Builds; I have not
  checked the live site, so "live" is not confirmed here.
- **Open:** the PR "Port the website process" (this run; auto-merge queued behind the required checks). It changes no page,
  copy, image or style.
- **Process:** this repo follows the site template's `docs/PROCESS.md` (template commit 99e5378). The pre-commit hook
  still runs the full `npm run check` until the owner batch below is run; `check:process` rule 7 stays off until then.
- **Stop queue:** the owner-only files (hooks, agents, settings), written as proposals. **Flagged dependencies:** none.

## Needs Grant

In order:

1. After the port PR is merged, run the owner batch in your own terminal. It makes the branch `chore/owner-fast-hooks`,
   copies the template's hooks, the `scout` and `docs-writer` agents and `settings.json` into `.claude/`, sets
   `precommitHookFastOnly` to true, then runs the hook selftest, `npm run check:process` and `npm run check`:

   ```bash
   zsh /private/tmp/claude-501/-Users-granthuston-Code-huston-tech-site/c208e578-dae3-4bc2-97fa-718f88db521b/scratchpad/owner-batch/apply-owner-batch.sh
   ```

   The selftest must end with `All 132 passed` and `check:process` with `all 7 rules passed`. The proposals are the
   `*.proposed` files next to the script. The scratchpad can be cleared by a reboot; if it is gone, the same files are
   the template's `.claude/hooks/{README.md,precommit-check.mjs,prepush-check.mjs,selftest.mjs}`,
   `.claude/agents/{scout,docs-writer}.md` and `.claude/settings.json` (`huston-logic/site-template`, commit 99e5378).
   Then stage, commit and open the PR yourself.
2. Check that the deploy of Revision 8 finished in Cloudflare Workers Builds and that the live Home and /systems match
   the Revision 8 mockups at 1440 and 390 wide.
3. Read the copy listed under "Copy written without verbatim Rev 8 text" in `docs/history/STATUS-history.md` on the live
   site, and tell me which lines to change.
4. Decide on the three review agents (`.claude/agents/review-{a11y,code,security}.md`). They differ from the template only
   in naming "the Huston Tech site" where the template says "this site". I kept ours; the batch does not copy them.
5. Decide which of these template parts this site should get. I did not build any (process port only):
   - the config system: `site.config.ts`, `scripts/sync-config.mjs`, `npm run check:config` and its CI step;
   - the change-scope tools: `docs/CHANGE-SCOPE.md`, `check:scope`, `change-report`, and the two CI jobs that run them
     (PROCESS.md rule 7 names `check:scope`, which this repo lacks);
   - the other script tests: redirects, image alt text, image metadata stripping;
   - `src/lib/*.test.ts` in the `test:worker` run, `docs/TEMPLATE.md`, `docs/SECRETS.md`, `docs/ruleset-protect-main.json`.
6. CI does not run `check:process` or `test:scripts` yet; only your local `npm run check` and `check:fast` do. Adding
   them to `.github/workflows/ci.yml` is an owner-only edit; I did not propose one.

## For the master

- This repo now follows the site template's docs/PROCESS.md.
- The site has two offers: Accelerated Websites and AI-Centric System Redesign. The Workflow Review and the Zoho
  specialty are no longer offers.
- No price, rate or dollar amount appears anywhere on the site; prices are discussed in person.
- New /systems page; Home rebuilt to the Revision 8 layout.
- The contact form still accepts the old "workflow" topic and need and maps them to the system topic and label, so old
  links keep working.

## Last run: Port the website process (2026-11-24)

One branch (`chore/port-website-process`), one PR (#69). No page, copy, image or style changed.

- Added `scripts/check-process.mjs`, its 12 tests and `scripts/process-rules.json` (rule 7 off); `package.json` gets
  `check:process`, `test:scripts` and `check:fast`, and `check` is now `check:fast` then the build.
- `lighthouserc.cjs`: `numberOfRuns` 5 to 3 (approved). No threshold or assertion touched; the README sentence says 3.
- Added `docs/PROCESS.md` (follows the template, with this repo's own timings), `docs/LAUNCH-CHECKLIST.md`, the one
  line at the top of `docs/pipeline/README.md`, and this plan: `docs/superpowers/plans/2026-11-24-port-website-process.md`.
- Stale "5 runs" and command-list text fixed after the review: the Lighthouse summary heading in
  `scripts/lighthouse-summary.mjs`, the Checks block in AGENTS.md and the command list in README.md.
- CLAUDE.md: "Autonomous runs" is the template's; the full-check-on-every-commit lines now say `check:fast` per commit
  and `check` before the PR; the Status rules match the new four-part, 150-line file.
- This file cut to its four parts; the Changelog and the Archive moved unchanged to `docs/history/STATUS-history.md`.
  The old Needs Grant item "review and merge the two docs PRs" is done (both merged) and was dropped; items 2 and 3 of
  the old list are kept as items 2 and 3 above.
- PROCESS.md is the template's text, so its "Where facts live" and rule 7 still describe the template repo and name
  `check:scope` and `docs/CHANGE-SCOPE.md`, which this repo lacks (Needs Grant, item 5). Left as copied on purpose.
- Owner-only files written as proposals in the scratchpad, plus one batch script (Needs Grant, item 1).

Timing (this Mac, cold build):

| Measure | Value |
|---|---|
| Wall-clock time | about 8 minutes (14:40 to 14:48 by this Mac's clock) |
| Commits | 6 |
| Time in checks (all runs this session) | about 2 minutes |
| Time waiting on CI | not measured: auto-merge was queued and the run ended |
| Old `npm run check` | 10.5 s |
| New `npm run check:fast` | 5.8 s |
| New `npm run check` | 11.8 s |
