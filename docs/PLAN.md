# Autonomous run plan

The task list for an autonomous run described in CLAUDE.md, "Autonomous runs". Progress is tracked in
`docs/STATUS.md`. One PR per task. Grant fills in the task list before starting a run; Claude does not invent tasks.

## Tasks

0. **Autonomy hooks and rules (done by hand-copy, 2026-11-20).** Port the site-template process v2 changes: the hooks
   allow exactly `gh pr merge <number> --auto --squash|--merge`, the five "ask" files stop asking, the selftest and
   workflow comments are updated, and CLAUDE.md gets the "Autonomous runs" section plus this plan and the status log.

**Revision 8 rework (run of 2026-11-20).** Grant's run message, one branch `feat/rev8-rework`, one PR, one commit per
task, not merged by Claude (the live site must not be half old and half new; Grant merges after the preview). The
detailed implementation plan is `docs/superpowers/plans/2026-11-20-rev8-rework.md`; the copy source is
`docs/website-rev8.md`.

1. **Inputs in.** This task list here; AGENTS.md, CLAUDE.md and the copy comments point at Revision 8; STYLE-GUIDE §9
   amended with Revision 8 Section C (motion), noting Revision 8 is now the copy source.
2. **site.ts:** nav, the two offers, footer tagline, contact topics (Section A).
3. **Home** rebuilt to B1: seven sections, about 750 words. Keep HeroStack and all of its motion; change only the cards.
4. **New page /systems** (B2).
5. **/services:** Websites, Care and the new FAQ (B3).
6. **How I work, Past work, About, Contact** (B4 to B7), including the form's topic values in the Worker.
7. **Motion,** exactly as Section C lists it: one moment per section, played once. No animation library.
8. **Pipeline screenshots** (Section D), from a local demo-data instance of `~/huston-pipeline`, read-only. Fallback:
   HTML-drawn screens, and a STOP-queue entry.
9. **Sweep.** Sitemap, page titles and descriptions, Organization JSON-LD, OG image text; /systems in the accessibility
   and Lighthouse lists; the Section A wording sweep returns nothing.

Done means: the five required checks green on the PR; Lighthouse ≥ 90 mobile in all four categories on /, /systems,
/services and /contact, CLS 0; reduced motion and no-JS show the end state on every page; Home ≤ 800 words; the
wording sweep returns nothing.

## Stop list

Queue the item and continue with other tasks on: secrets or credentials, DNS, accounts or money, sending real email,
deleting user data, lowering any threshold or required check, or any owner-only path (`.claude/hooks|agents|skills|
settings*.json`, `.github/workflows`). For owner-only changes, write `<file>.proposed` to the scratchpad and list it.

New dependencies: exact-pinned, at least 7 days old (`npm view <pkg> time`), and `dependency-review` must pass. Flag
them in the summary.

## End of run

Post one summary with every PR link and whether it merged, anything flagged (dependencies, judgment calls), the stop
queue, and the exact hand-copy commands for all proposals in one batch. Update `docs/STATUS.md`.
