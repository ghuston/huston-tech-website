# Autonomous run status

Plan: `docs/PLAN.md`. Rules: CLAUDE.md, "Autonomous runs". Updated after every task.

## Tasks

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

## Judgment calls

### Revision 8 run (2026-11-20)

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

### Autonomy hooks run

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

- none (Revision 8 run: nothing needed secrets, DNS, money, accounts or real email; the pipeline screenshots worked, so the fallback was not needed)

## Flagged dependencies

none
