# Status

This is the repo's status page. Business priorities live in the Google Doc "00 Huston Logic: Source of Truth", which links
here. Update it in place at the end of every run; do not create dated handoff files. Task list for autonomous runs:
`docs/PLAN.md`. Rules: CLAUDE.md and `docs/PROCESS.md`. Older history: `docs/history/STATUS-history.md`.

## Current state

Updated 2026-11-24.

- **Merged:** Revision 8 (two offers, new Home, /systems), the autonomy hooks and auto-merge rules, the status rules in
  CLAUDE.md, and the website process port. Merging into `main` deploys through Cloudflare Workers Builds; I have not
  checked the live site, so "live" is not confirmed here.
- **Open, PR A (form to the app):** the contact Worker sends each submission to the Pipeline app when `INTAKE_SECRET` is
  set and falls back to the Sheet otherwise; rate limiter ids are now 2101 and 2102. Auto-merge queued behind the
  required checks. Until you set the secret nothing changes for visitors: leads still go to the Sheet.
- **Open, PR B (#70, hosting wording):** copy only. Auto-merge is not enabled; it waits for you to approve the wording on
  its preview.
- **Process:** this repo follows the site template's `docs/PROCESS.md` (template commit 99e5378). The pre-commit hook
  still runs the full `npm run check` until the owner batch below is run; `check:process` rule 7 stays off until then.
- **Stop queue:** the owner-only files (hooks, agents, settings), written as proposals. **Flagged dependencies:** none.

## Needs Grant

In order:

1. **Connect the form to the Pipeline app** (after PR A has deployed; until then nothing changes). Make one long random
   secret and set the same value in the site and in your Pipeline copy. Each `secret put` asks for the value with hidden
   input, so paste the same one both times and don't save it anywhere else:

   ```bash
   openssl rand -base64 32
   ```

   In this repo's folder (the site's Worker):

   ```bash
   npx wrangler secret put INTAKE_SECRET
   ```

   In the Pipeline repo's folder (your copy; `ls .copies` shows its name):

   ```bash
   npx wrangler secret put INTAKE_SECRET -c .copies/<your-copy>/wrangler.jsonc
   ```

   Then send one real test through hustonlogic.com/contact. The email to you should say "Saved to: the Pipeline app" and
   the lead should be on the board. If it says "Pipeline app: NOT saved", the two values differ or the app is down; the
   lead went to the Sheet, so nothing is lost. Previews never call the app, so they need no secret.
2. **Make the secret required**, but only after step 1 works on the live site: ask me to add `"INTAKE_SECRET"` to
   `secrets.required` in `wrangler.jsonc` (a one-line PR). Do it earlier and every deploy fails until the secret is set.
3. **Approve the hosting wording** on PR B's preview link (PR #70, copy only). It lists every changed line before and
   after, and three things I flagged (the "no subscription" lines I had to change, the fee mentioned without a number,
   and what I left alone). Merge it yourself when you're happy; I did not enable auto-merge on it.
4. After the port PR is merged, run the owner batch in your own terminal. It makes the branch `chore/owner-fast-hooks`,
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
5. Check that the deploy of Revision 8 finished in Cloudflare Workers Builds and that the live Home and /systems match
   the Revision 8 mockups at 1440 and 390 wide.
6. Read the copy listed under "Copy written without verbatim Rev 8 text" in `docs/history/STATUS-history.md` on the live
   site, and tell me which lines to change.
7. Decide on the three review agents (`.claude/agents/review-{a11y,code,security}.md`). They differ from the template only
   in naming "the Huston Tech site" where the template says "this site". I kept ours; the batch does not copy them.
8. Decide which of these template parts this site should get. I did not build any (process port only):
   - the config system: `site.config.ts`, `scripts/sync-config.mjs`, `npm run check:config` and its CI step;
   - the change-scope tools: `docs/CHANGE-SCOPE.md`, `check:scope`, `change-report`, and the two CI jobs that run them
     (PROCESS.md rule 7 names `check:scope`, which this repo lacks);
   - the other script tests: redirects, image alt text, image metadata stripping;
   - `src/lib/*.test.ts` in the `test:worker` run, `docs/TEMPLATE.md`, `docs/SECRETS.md`, `docs/ruleset-protect-main.json`.
9. CI does not run `check:process` or `test:scripts` yet; only your local `npm run check` and `check:fast` do. Adding
   them to `.github/workflows/ci.yml` is an owner-only edit; I did not propose one.

## For the master

- This repo now follows the site template's docs/PROCESS.md.
- The site has two offers: Accelerated Websites and AI-Centric System Redesign. The Workflow Review and the Zoho
  specialty are no longer offers.
- No price, rate or dollar amount appears anywhere on the site; prices are discussed in person.
- New /systems page; Home rebuilt to the Revision 8 layout.
- The contact form still accepts the old "workflow" topic and need and maps them to the system topic and label, so old
  links keep working.
- hustonlogic.com form contacts now go to the Pipeline app (once the secret is set).
- Site wording now describes managed hosting (after Grant approves).

## Last run: Form to the app, and hosting wording (2026-11-24)

Two branches, two PRs. Plan: `docs/superpowers/plans/2026-11-24-w1-w3.md`. The previous run (Port the website process,
#69) moved unchanged to `docs/history/STATUS-history.md`.

- **PR A, `feat/form-to-pipeline` (W1):** new `worker/intake.ts`. In production, with `INTAKE_SECRET` set, the Worker
  posts name, email, business and a labelled message (need, topic link, tools, current website, heard-about) to
  `https://pipeline.hustonlogic.com/intake` and skips the Sheet. Unset, a non-2xx, a redirect or a network failure falls
  back to the Sheet. The email to you always sends and starts its trailer with "Saved to: ...". Visitors see success if
  the app, the Sheet or the email got it. Previews never call the app. `INTAKE_SECRET` is not in `secrets.required`.
  Rate limiter ids 1001 and 1002 became 2101 and 2102 (a counter reset on deploy; the old ids are shared with other
  Workers). The `wrangler.jsonc` edit went through, so nothing is queued for hand-copying.
- **Reviews:** review-code and review-security ran once on the branch. Fixed with tests that failed first: a redirect
  from the app is never followed (it would resend the secret), the message is cut on a character boundary with a visible
  note, and retries are covered. Deferred minors: a missing space in the existing "Business:" line of the email; a 429
  from the app is retried at once; a very long message in 3-byte characters could pass the app's 16 KB limit (the Sheet
  then takes it).
- **PR B, `feat/hosting-wording` (W3, #70):** 22 copy lines changed in `src/content/` plus one amendment bullet in
  `docs/website-rev8.md`. No price added; the site says hosting is a flat fee, with no figure. Auto-merge not enabled.
- `docs/pipeline/` is a copy of the template's handbook, so I did not update it for the app hand-off or the new wording.

Timing (this Mac; start time not noted, so the span is approximate):

| Measure | Value |
|---|---|
| Wall-clock time | not measured; commits run 21:25 to 21:30 by this Mac's clock, plus reading and review time before |
| Commits | 6 (5 on PR A, including this file, and 1 on PR B) |
| Time in checks (all runs this session) | about 1.5 minutes (6 fast checks, 2 full checks) |
| Time waiting on CI | not measured: PR A's auto-merge was queued and the run ended |
| Reviews | review-code and review-security, once, on PR A |
