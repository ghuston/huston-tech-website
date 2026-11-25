# Status history

Older history moved out of `docs/STATUS.md` on 2026-11-24, unchanged (the Changelog and the Archive as they stood
after the Revision 8 run). `docs/STATUS.md` keeps only the current state, Needs Grant, For the master and the last run.
PR numbers here are the numbers they had when written.

## Changelog

- 2026-11-21: this file restructured into Current state, Changelog, Needs Grant and For the master; the earlier task
  table, judgment calls and run notes moved to the Archive below (this PR). CLAUDE.md gets the "Status and source of
  truth" rules (#67, open).
- 2026-11-20: Revision 8 merged: two offers, Home rebuilt, new /systems page, /services, How I work, Past work, About
  and Contact updated, section motion with a JS failsafe, pipeline screenshots from demo data (#66).
- 2026-11-20: autonomy hooks, settings, selftest, Autonomous runs rules, PLAN.md and STATUS.md (#65).

## Archive

Notes from earlier runs, kept as written.

### Tasks

| # | Task | PR | State |
| --- | --- | --- | --- |
| 0 | Autonomy hooks, settings, selftest, workflow comments, Autonomous runs rules, PLAN.md, STATUS.md | #65 | merged |
| R8-1 | Inputs in, docs repointed | #66 | open, not merged (Grant merges after the preview) |
| R8-2 | Nav, offers, footer, contact topics (form, validation, Worker) | #66 | open |
| R8-3 | Home rebuilt to B1 (799 words) | #66 | open |
| R8-4 | New page /systems | #66 | open |
| R8-5 | /services: Websites, Care, FAQ | #66 | open |
| R8-6 | How I work, Past work, About, Contact | #66 | open |
| R8-7 | Section motion (§9.4), with a JS failsafe | #66 | open |
| R8-8 | Pipeline screenshots from local demo data (wired in R8-3) | #66 | open |
| R8-9 | Sweep: titles, OG alt, README, style-guide notes | #66 | open |

### Judgment calls

#### Revision 8 run (2026-11-20)

One branch (`feat/rev8-rework`), one PR (#66), one commit per task plus review fixes. Not merged: Grant merges after the preview.

**Copy written without verbatim Rev 8 text (please check on the preview):**
- /services SEO title "Services | Accelerated Websites | Huston Logic" and description "Every site I build is designed from scratch for one business. Fixed, and agreed in writing before I start." (B3 gives none; built from B3 sentences.)
- /services hero intro kept from Rev 7.1: "Some people come to me for a website. Some come because work keeps slipping between their tools. The process is the same either way…" It now sits above a websites-only page.
- /services closing: "Website, system or both: the free call sorts out which." (was "workflow").
- How I work: meta description "One process for websites and systems: …"; step zero "a new site, a system for your business, or both"; Website Ship paragraph "For six weeks after launch, small changes are included, and I fix anything that doesn't work as agreed." (B3's sentence, per Section F #5).
- Contact meta description: "Need a website, or an AI system for your business? …"; thanks page link "See the system →" to /systems (was "How a Workflow Review works →").
- About: removed "So a custom site, tested properly, starts at $750." (Section A: no price anywhere).
- Past work: "Custom systems" also in the sub-nav and SEO title ("Past Work | Websites & Custom Systems | Huston Logic"). Kept "(Systems projects.)" on How I work and "Client systems projects (2024–2025)" on Past work, since they describe past projects.
- /systems: the closing split into H2 "Start with the free call." and "I'll show it to you on my phone. The demo takes 90 seconds." The optional opener (two old pain lines) is left out.
- Interface strings: "Client quotes" and "App screens, demo data" (swipe-row names), screen captions "Today / Pipeline / Brief / Rule preview", "Demo data" under the screens, alt text for the four screenshots.

**Design calls:**
- Why-hire-me track: a straight track (the mockup's geometry: the arc's 16px bar, 60px stations, rust dot), horizontal from 1200px, vertical below, not a curved arc.
- Installing section: one column below 1024px, pairs beside screens from 1024px, three columns from 1280px.
- Hero stack on phones: a fixed 350×580 stage, scaled in steps below 390px so it fits from 320px.
- Phone door nudge: each door plays when it is half in view.
- Proof chips restyled as chips sitewide, so /past-work's survey row (copy unchanged) now looks like Home's and pops in once.
- Real app screenshots (local demo data from ~/huston-pipeline, captured read-only) instead of the drawn fallback. The Pipeline shot is the list view scrolled; the rule shot is the Rules page (the app has no separate rule-preview screen).
- Motion start frames have a 4-second CSS failsafe and a print reset, so copy can never stay hidden if JavaScript fails.

**Process calls:** worked in the main checkout (not a worktree); nav stays in `nav.ts` (offers in `site.ts`); contact topic values changed end to end in Task 2 so every commit compiles; local Lighthouse skipped (CI's required job is the gate).

**Left as is (minor):** swipe rows are a tab stop on desktop where nothing scrolls; crossing 1200px or 767px can replay the track or door moment; below ~280px the track's last label must stay on one line; "Two ways to start" names both the door band and the Contact intro; no current-page underline on /services (hash links never mark current; predates this run).

#### Autonomy hooks run

- Ported from `huston-logic/site-template` main (process v2, its PR #16), file by file, not copied blind. The hooks here
  matched the template except for the autonomy changes, so `guard-bash.mjs`, `protect-config.mjs`, `selftest.mjs`,
  `README.md` (hooks) and `settings.json` are the template's versions.
- Not ported: the template's genericized "this site" wording in `.claude/agents/review-*.md` (this is Grant's own site, so
  "Huston Tech site" stays), `npm run check:config` in `ci.yml` (no such script here), and the Lighthouse timeout fix from
  `huston-logic/pipeline` PR #26 (it is for a 17-page board; here Lighthouse runs 10 routes in about 9 minutes under the
  15-minute limit).
- Workflow edits are comment-only: the "informational, not required" comments were stale, since `a11y`, `lighthouse` and
  `dependency-review` are required in the ruleset.

### Stop queue

- none (Revision 8 run: nothing needed secrets, DNS, money, accounts or real email; the pipeline screenshots worked, so the fallback was not needed)

### Flagged dependencies

none

## Run: Port the website process (2026-11-24, moved from STATUS.md unchanged)

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
