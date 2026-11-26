# Status

This is the repo's status page. Business priorities live in the Google Doc "00 Huston Logic: Source of Truth", which links
here. Update it in place at the end of every run; do not create dated handoff files. Task list for autonomous runs:
`docs/PLAN.md`. Rules: CLAUDE.md and `docs/PROCESS.md`. Older history: `docs/history/STATUS-history.md`.

## Current state

Updated 2026-11-26.

- **Merged and live:** Revision 8, the website process port (#69), the hosting wording (#70) and the form-to-app hand-off
  (#71). Merging into `main` deploys through Cloudflare Workers Builds.
- **Open, "Catch up to the template":** one PR on `chore/catch-up-to-template`, not merged, no auto-merge. The site now
  follows the site template (`huston-logic/site-template` main at 8c49fcd): pages are data files built from blocks,
  testimonials, business details and brand are data files, and the site editor, uploads, collections and forms are in
  the code, all switched off. Every page is pixel-identical to main at 390 and 1440 wide.
- **Process:** `docs/PROCESS.md` follows the template at 8c49fcd (rules 1 to 17). The pre-commit hook still runs the full
  `npm run check` until the owner batch below is installed.
- **Stop queue:** the owner-only files (hooks, agents, settings, workflows), written as proposals.
  **Flagged dependency:** `@cloudflare/workers-oauth-provider` 1.2.4 (exact; published 2026-10-22; no dependencies of
  its own), used only by `worker/index.ts` for the editor's sign-in.

## Needs Grant

In order:

1. **Review and merge the PR** from its preview link (it lists the pixel result per page). Merging deploys.
2. **Owner batch** (after the merge). It makes `chore/owner-template-batch`, copies the template's hooks (pre-commit
   runs `check:fast`, new pre-push check), the `scout` and `docs-writer` agents, `settings.json` and the three
   workflows (`ci.yml` gains `check:config` and the non-required `change-scope` and `change-report` jobs), switches
   `check:process` rule 7 on, then runs the hook selftest and the checks. If Dependabot PR #72 merged first, keep its
   newer `dependency-review-action` line in `dependency-review.yml`. Then commit and open the PR yourself:

   ```bash
   zsh /private/tmp/claude-501/-Users-granthuston--claude-spares-spare-XqfR7V/37db1240-9a17-4c64-a1d0-b430252162bf/scratchpad/owner-proposals/apply-owner-batch.sh
   ```

   The scratchpad can be cleared by a reboot; the same files are the template's at 8c49fcd.
3. **If not done yet:** make one random value (`openssl rand -base64 32`) and set it as `INTAKE_SECRET` in this repo
   (`npx wrangler secret put INTAKE_SECRET`) and in your Pipeline copy
   (`npx wrangler secret put INTAKE_SECRET -c .copies/<your-copy>/wrangler.jsonc`), send one real test through
   hustonlogic.com/contact (the email should say "Saved to: the Pipeline app"), then ask me to make it required.
4. **Turn the site editor on** (template `docs/EDITING.md`, steps a to g; values go in `site.config.ts` `editor`, never
   in chat or a PR description):
   - a. GitHub App on the `ghuston` account (the repo is `ghuston/huston-tech-website`, not the `huston-logic` org):
     name `Huston Logic editor`, homepage `https://hustonlogic.com`, webhook off, permissions exactly as EDITING.md
     step a, "Only on this account", installed only on `huston-tech-website`. Note the App ID, installation id and
     bot login (`<app slug>[bot]`).
   - b. `npx wrangler secret put GITHUB_APP_PRIVATE_KEY < path/to/key.pem` (production only), then delete the file.
   - c. `npx wrangler kv namespace create OAUTH_KV` and `npx wrangler kv namespace create EDITOR_KV`.
   - d. Cloudflare Access, self-hosted app `Huston Logic owner`, domain `hustonlogic.com`, path `owner`, One-time PIN,
     one Allow policy with your owner email(s) only. Note the AUD tag and the team name. Do not protect `/mcp`,
     `/oauth` or `/.well-known`.
   - e. In `site.config.ts` `editor`: `ownerEmails`, `access.teamDomain`, `access.aud`, `github.owner` `"ghuston"`,
     `github.repo` `"huston-tech-website"`, `github.appId`, `github.installationId`, `github.botLogin`,
     `workersSubdomain` `"granthuston7"`, `kv.oauth`, `kv.editor`; `rateLimitId` is already `"2103"` (in
     `docs/HOSTING.md`). Then `enabled: true` last, `npm run sync:config`, commit, PR, merge.
   - f. GitHub repo settings: turn on Allow auto-merge; create the label `owner-request`; Watch → All activity.
   - g. Test: sign in at `https://hustonlogic.com/owner`, add the Claude connector `https://hustonlogic.com/mcp`, make
     one small change, ask "is it live yet?", check `https://hustonlogic.com/site-version.json` names the merge, try a
     preview and an undo, and check `https://hustonlogic.com/blocks` is a 404. Note the yes-to-live time.
5. **Turn uploads on** (after step 4; EDITING.md steps h to l):
   - h. `npx wrangler r2 bucket create huston-site-uploads` (private, no public access, no custom domain).
   - i. `npx wrangler r2 bucket lifecycle add huston-site-uploads expire-inbox --expire-days 31`.
   - j. Check Cloudflare Images is available on the account (Free plan is enough).
   - k. `site.config.ts` `editor.uploads`: `bucket` `"huston-site-uploads"`, then `enabled: true`; `npm run sync:config`,
     commit, PR, merge.
   - l. From a phone at `https://hustonlogic.com/owner`: an iPhone photo shows upright, a PDF downloads, a video is
     refused, a gallery from the uploads publishes upright.
6. **Before the first owner-built form saves to the Sheet:** add tabs `Forms` and `Forms preview` to the contact Sheet,
   each with the header row `Received (UTC) | Form | Name | Email | Answers | Mode`. No new secret.
7. **Decide** (none blocks the merge):
   - Audit `/blocks` in Lighthouse the template's way (no SEO category)? With gzip it scored 1.0 performance and 1.0
     accessibility locally. It changes `lighthouserc.cjs` (no threshold change), so I left it.
   - Health words in owner-built forms only warn (template rule); AGENTS.md says never ask for health records. Make them
     a refusal on this site?
   - Each owner-built form gets its own rate-limit budget per visitor (template design). Keep, or one budget per visitor?
   - Off-brand in the `/blocks` showcase only: the template's example photos (blue and rust vases) clash with this
     site's green. Replace them for this site, or leave them (production builds remove `/blocks`)?
   - Turn the blog on: write `blog.json` (title, description, words), then I port `src/app/(site)/blog/`.
   - The template divergences listed in the PR (site-owned hooks): port them to the template, or change this site?
8. Still open from before: check the live Home and /systems against the Revision 8 mockups; read the copy listed under
   "Copy written without verbatim Rev 8 text" in `docs/history/STATUS-history.md`; decide on the three review agents'
   wording ("the Huston Tech site").

## For the master

- This repo now follows the site template's docs/PROCESS.md.
- The site has two offers: Accelerated Websites and AI-Centric System Redesign. The Workflow Review and the Zoho
  specialty are no longer offers.
- No price, rate or dollar amount appears anywhere on the site; prices are discussed in person.
- hustonlogic.com form contacts go to the Pipeline app once the secret is set, with the Sheet as fallback.
- Site wording describes managed hosting.
- hustonlogic.com is built the template's way: pages are data files made of blocks, ready for owner editing by chat.
- The site editor, photo uploads, collections and owner-built forms are in place on hustonlogic.com but switched off.
- hustonlogic.com has no blog yet; turning one on needs real words for the blog page first.

## Last run: Catch up to the template (2026-11-25 to 26)

One branch, `chore/catch-up-to-template`, one PR, not merged. Plan: `docs/superpowers/plans/2026-11-25-catch-up-to-template.md`.
Gate for every step: screenshots of 12 pages at 390 and 1440 against a build of main (all identical), head tags and
visible text (same; extra section ids on /about, /how-i-work and /services only), anchor jumps, sticky nav and the
mobile menu (same), plus `check:fast`. The contact Worker path is unchanged from main.

- **Step 1, convert to blocks:** arbitrary Tailwind values became tokens (same pixels); the template's block system,
  config generators (`site.config.ts`, `sync:config`, `check:config`, `check:content`, `check:design`) and libraries
  came in; all 9 pages became `src/content/pages/*.json` made of 28 site blocks; menus come from the page files.
- **Step 2, move the content:** 5 testimonials became collection items (every field kept), business details and brand
  moved to `business.json` and `brand.json` (palette generated), the notice is wired and empty. No articles existed.
- **Step 3, editor ports:** site editor and uploads (off), collections and brand settings, forms and downloads (route
  `/api/forms/<id>`, same save chain as the contact form, no form added). Blog routes and the template's placeholder
  example items left out: they would add a live placeholder page.
- **Step 4, process items:** PROCESS.md rules 13 to 17, gzip in the preview server, `_redirects` and its check,
  OFFBOARDING, TEMPLATE, proposals, the ruleset JSON, `.npmrc` without `engine-strict`.
- **Reviews:** review-code, review-a11y and review-security once on the branch, then a design critique of `/blocks`
  at 1440 and 390. Fixed: client code on every page, copy that had moved into a component, the showcase's extra h1s
  and duplicate ids, README and AGENTS.md accuracy. Live pages load 11 KB more gzipped JavaScript than main (198 KB
  against 187 KB, a chunk Next shares with the new form code); Home still scores 1.0 for performance. Decisions above
  under Needs Grant 7.

| Measure | Value |
|---|---|
| Wall-clock time | about 2 hours 40 minutes (23:45 to about 02:25, this Mac's clock) |
| Commits | 24 on the branch, including this file's fix |
| Time in checks | about 75 minutes, estimated: about 13 full gate runs (build, 24 screenshots, behaviour, `check:fast`) |
| Time waiting on CI | none in the run: CI starts with the PR, which I did not wait on |
