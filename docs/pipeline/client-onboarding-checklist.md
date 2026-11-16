# Client onboarding checklist

An ordered checklist for standing up a **new client site** on this pipeline. Follow it top to
bottom. Every account is created **in the client's name** (the Services copy promises "Websites are
hosted on Cloudflare, in an account in your name"), with the builder added as a member where the
platform allows it, so the client owns the site, the domain and the mail from day one.

Each step says where it comes from. Steps marked **UNVERIFIED (dashboard)** describe a dashboard the
repo cannot read; confirm them on screen the first time and update this file. Steps marked
**owner-confirmed 2026-11-15** were supplied by the owner from their own setup and are recorded in no
repo file. Secrets appear by name only.

Back to the [map](./README.md). The gotchas are collected at the end.

## 0. Before you start

- [ ] Decide the Worker name (this repo: `huston-site`), the apex domain and whether `www.` redirects
      to the apex (this repo: yes, 301).
- [ ] Decide public or private repo. This repo is **public**, which is why business names of third
      parties, client sales notes and raw source images were trimmed out of it (`docs/website-plan.md`
      "Public-repo trim", PR 52 "neutral filenames", `.gitignore` `/incoming/`). A private repo
      removes that pressure but the CodeQL workflow then needs GitHub Advanced Security.
- [ ] Have the builder's Mac ready: Node 22.19 or newer, npm 10 (`npx --yes npm@10.9.9` in front of
      `npm install` and `npm ci` if the default npm is 11), Claude Code, `gh` logged in, `wrangler`
      logged in to the client's Cloudflare account (`npx wrangler login` from the repo folder;
      **UNVERIFIED** that a per-folder profile is needed, see wrangler's `--profile` flag).

## 1. The repo (GitHub, client's organisation or account)

- [ ] Create the repo. Default branch `main`. Copy this repo's tree, then strip the content.
- [ ] Copy Gate 1 as a block: `.claude/hooks/`, `.claude/settings.json`, `.claude/agents/`,
      `.claude/skills/`. Edit the lists at the top of `lib.mjs`, `guard-bash.mjs` and `scan-src.mjs` if
      the repo differs ([gate1-local.md](./gate1-local.md#reusing-the-hooks-in-a-client-repo)). Keep a
      `check` script in `package.json`. Run `node .claude/hooks/selftest.mjs`; the last line must say
      `All N passed`.
- [ ] Copy Gate 2: `.github/workflows/ci.yml`, `codeql.yml`, `dependency-review.yml`,
      `.github/dependabot.yml`, `lighthouserc.cjs`, `playwright.config.ts`, `tests/a11y/`,
      `scripts/preview.mjs`, `scripts/lighthouse-summary.mjs`, `src/lib/routes.ts`. Keep the job names
      `check`, `a11y`, `lighthouse`, `dependency-review` exactly.
- [ ] Copy `.npmrc` (`engine-strict=true`) and the `engines` block of `package.json`. Generate the
      lockfile with npm 10.
- [ ] Copy `.gitignore` (it covers `.env*` except `.env.example`, `.dev.vars*`, `secrets/`,
      `.wrangler`, `/incoming/`, `.lighthouseci/`, `playwright-report/`, `test-results/`).
- [ ] Write `AGENTS.md` and `CLAUDE.md` for the client repo from this repo's, replacing every
      business-specific rule (copy source, pricing, framework names) and keeping the pipeline rules
      (git workflow, Protect main facts, protected folders, decision authority, command style).
- [ ] Open the first PR with the skeleton so the four workflows run at least once (a status check
      cannot be made required until GitHub has seen it report).
- [ ] **Create the "Protect main" ruleset** (Settings, Rules, Rulesets, New branch ruleset, or
      `gh api -X POST repos/<owner>/<repo>/rulesets` with the JSON in
      [gate2-ci.md](./gate2-ci.md#the-protect-main-ruleset), minus `id`, `node_id`, `_links`,
      `created_at`, `updated_at`, `source`, `source_type`, `current_user_can_bypass`). Start with
      `check` as the only required status check; add the others as they pass the promotion rule
      below. Target `~DEFAULT_BRANCH`, enforcement `active`, no bypass actors.
- [ ] Settings, Code security: confirm Dependabot alerts are on (this repo: on) and that code
      scanning **default setup is off** (`codeql.yml` is the advanced setup; the two conflict).
- [ ] Repo Settings, General, Pull Requests: this repo allows merge, squash and rebase, allows
      auto-merge, and does not delete branches on merge. Match or choose deliberately.
- [ ] **Promotion** for `a11y`, `lighthouse`, `dependency-review` and the code-scanning rule: 5
      consecutive clean runs on separate PR or `main` runs (at least one PR that changes the UI for
      `a11y`), then one deliberate-failure proof PR each, titled `PROOF - DO NOT MERGE: <name>`, closed
      with `gh pr close --delete-branch`, never merged. Recipes in
      [gate2-ci.md](./gate2-ci.md#proof-pr-recipes). Then add the check to the ruleset (for CodeQL,
      the "Require code scanning results" rule, not a status check). Record the dates in `CLAUDE.md`.

## 2. Cloudflare (client's account)

- [ ] Add the client's domain as a **zone** in the account (or register it there). The custom domain
      step below needs the zone in the same account.
- [ ] **Do not enable Email Routing** on the zone if Google Workspace (or any other provider) will
      handle the domain's mail: both need the root MX records, so only one can receive mail (gotcha
      G3). If it is already on: Email, Email Routing, Settings, **Disable**; delete its
      `route*.mx.cloudflare.net` MX records and its SPF (`include:_spf.mx.cloudflare.net`) from the
      root before adding Google's records in step 4. A leftover `cf2024-1._domainkey` TXT is harmless.
- [ ] Workers & Pages, Create, connect the GitHub repo (Workers Builds). Settings
      (**UNVERIFIED (dashboard)**, from this repo's README): production branch `main`, build command
      `npm run build`, deploy command `npx wrangler deploy`, root directory `/`, build variable
      `NODE_VERSION=22`. Add `NEXT_PUBLIC_SITE_URL=https://<apex>` as a build variable only if the
      default in `src/content/site.ts` is not already the apex.
- [ ] `wrangler.jsonc`: set `name`, keep `assets`, `run_worker_first: ["/api/*"]`, `secrets.required`,
      the `ratelimits` binding (pick two fresh `namespace_id` values; **UNVERIFIED** whether ids must be
      unique per account or per Worker), `observability`, and the `previews` block (required even if
      empty). Run `npx wrangler types worker/worker-configuration.d.ts` after any change.
- [ ] Push a branch and confirm Cloudflare comments a preview URL on the PR
      (`<branch-slug>-<worker>.<account>.workers.dev`).
- [ ] After the first merge: **Deployments** shows an Active production version. Practise the rollback
      runbook once ([gate3-deploy-ops.md](./gate3-deploy-ops.md#rollback-runbook-readme-practised-2026-11-13))
      while nothing is at stake.
- [ ] At launch: change the build command to `npm run build:launch` and add the apex as a **Custom
      domain** on the Worker (**UNVERIFIED (dashboard)**; click paths in
      [gate3-deploy-ops.md](./gate3-deploy-ops.md#custom-domains-and-the-www-redirect)).
- [ ] **www redirect** (owner-confirmed 2026-11-15): zone, Rules, Redirect Rules, template **"Redirect
      from WWW to root"**, deploy; **and** add a proxied `AAAA` record `www` to `100::`. Without a
      `www` DNS record the name does not resolve and the rule never runs (gotcha G21).

## 3. Turnstile (client's Cloudflare account)

- [ ] Turnstile, Add widget, **Managed** mode. Hostnames: the apex (covers its subdomains) and the
      account's `<account>.workers.dev` so previews work (error 110200 on a preview means it is not
      covered). **UNVERIFIED (dashboard)**.
- [ ] Put the **site key** in `src/content/providers.ts` (`turnstileSiteKey`; public).
- [ ] The **secret key** becomes the Worker secret `TURNSTILE_SECRET_KEY` (step 7). Never in the repo.
- [ ] The widget's `action` is hard-coded as `contact` in `useTurnstile.ts` and `contact.ts`; keep
      them equal if you change it.

## 4. Mail: Google Workspace (client's domain)

- [ ] Workspace owns the mailbox the form writes to (`providers.email`). Its records on the **root**:
      Google's 5 MX records, the single SPF TXT `v=spf1 include:_spf.google.com ~all`, DKIM at
      `google._domainkey` (from the Workspace admin console).
- [ ] Add a DMARC TXT at `_dmarc`. On this repo's domain it was created by Cloudflare's **DMARC
      Management** as `v=DMARC1; p=none; rua=<Cloudflare reporting address>` (owner-confirmed
      2026-11-15). It passes for both Workspace and Resend mail through DKIM alignment. Plan: move to
      `p=quarantine` after 2 to 4 weeks of clean reports.
- [ ] Rule: **never add Resend (or anyone else) to the root SPF.** Resend's mail authenticates on its
      own subdomain (step 5).

## 5. Mail: Resend (client's Resend account)

- [ ] Resend, Domains, Add the apex. Resend proposes its **Forge** records. Add them in the Cloudflare
      zone exactly as given, all **DNS only** (grey cloud):

  | Type | Name | Content |
  |---|---|---|
  | TXT | `resend._domainkey` | DKIM key from Resend |
  | CNAME | `send` | `send.forge.rmta.net` |
  | CNAME | `rsend` | `rsend.forge.rmta.net` |

- [ ] Do **not** add an MX or an SPF TXT on `send`: a CNAME cannot share its name with other records,
      and Resend serves the bounce records through the CNAME target (gotcha G4).
- [ ] Wait for Resend to show the domain verified. Turn open and click tracking **off**.
- [ ] Create an API key with **Sending access** for this domain only. It becomes the Worker secret
      `RESEND_API_KEY`.
- [ ] Set the `from` display name and address: the Worker builds `FROM` as
      `Huston Logic <providers.email>` in `worker/contact.ts`; change the display name for the
      client.

## 6. Google Sheet and service account (client's Google account)

- [ ] Create the Sheet with two tabs, `Submissions` and `Preview`, each with the header row
      `Received (UTC) | Need | Topic | Name | Email | Business | Message | Tools | Website | Source | Mode`.
      Its ID (between `/d/` and `/edit`) becomes the Worker secret `GOOGLE_SHEET_ID`.
- [ ] Google Cloud Console: create a project (this repo: `huston-logic-site`). Enable the **Google
      Sheets API**.
- [ ] IAM & Admin, Service Accounts, Create (this repo: `contact-form-writer`). Grant **no project
      roles**.
- [ ] **Create a JSON key** for it. A new Google Workspace creates a Google Cloud organisation with
      Secure-by-Default policies, and `iam.managed.disableServiceAccountKeyCreation` **blocks key
      creation** (gotcha G2). Fix (owner-confirmed 2026-11-15): the Workspace **super admin** grants
      themselves **Organization Policy Administrator** at the **organisation** level; then in the
      project, IAM & Admin, **Organization Policies**, that policy, **Manage policy**, **Override
      parent's policy**, enforcement **Off**. This is project-only; the organisation default stays on.
      Then "Create new key" works.
- [ ] Share the Sheet with the service account's email as **Editor**, and with no one else who does
      not need it.
- [ ] The whole JSON key file becomes the Worker secret `GOOGLE_SERVICE_ACCOUNT_KEY`
      (`npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY < path/to/key.json`). Delete the local
      file afterwards; never put it in the repo folder.

## 7. Worker secrets (from the builder's own terminal, in the repo folder)

Full commands in [contact-form.md](./contact-form.md#secrets-by-name).

- [ ] Production: `npx wrangler secret put <NAME>` for `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`,
      `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_SHEET_ID`. A deploy fails while one is missing
      (`secrets.required`). If `secret put` says the latest version isn't deployed, use the dashboard
      (Settings, Variables and Secrets).
- [ ] **Preview base config, before pushing any branch that should have a working form:**
      `npx wrangler preview base-config secret put <NAME>` for the same four. Previews copy the base
      config **when created**; an existing preview needs
      `npx wrangler preview secret put <NAME> --name <branch>` (gotcha G1).
- [ ] Check names only: `npx wrangler secret list`, `npx wrangler preview base-config secret list`.

## 8. Code-side settings

- [ ] `src/content/providers.ts`: `email`, `schedulerUrl`, `linkedInUrl`, `turnstileSiteKey`. All
      four must be non-null for `npm run check:placeholders` (and so `npm run build:launch`) to pass.
- [ ] `src/content/site.ts`: the site URL default and `decisionsConfirmed`.
- [ ] `public/_headers`: if the scheduler is embedded in an iframe, add its exact origin to
      `frame-src`; if analytics is added, add its exact origin to `script-src` and `connect-src`; a
      plain link (this repo's choice) needs no CSP change. Document every origin in the README.
- [ ] Resolve every `[[placeholder]]` in `src/content/` and `src/app/`.

## 9. Monitoring

- [ ] UptimeRobot (free plan), new HTTP monitor on the production URL, 5-minute interval, email alert
      to the client (and the builder). **UNVERIFIED (dashboard)**.
- [ ] Prove it: add a temporary monitor on a page that does not exist, wait for the Down email, delete
      the temporary monitor. Never break the production monitor on purpose.
- [ ] When the custom domain goes live, edit the monitor's URL to the apex and repeat the proof.
- [ ] Tell the client in writing: a failed deploy sends no email (the red "Workers Builds" check on the
      merge commit is the only signal), and a failed build leaves the previous version live.

## 10. End-to-end test (on a preview first, then on the live domain)

- [ ] Submit the form with your own address. Preview: the site inbox gets `[Preview] New note...`
      and `[Preview → would go to ...]`, the `Preview` tab gets a row, `Submissions` does not.
      Production: the client inbox gets the note, you get the automatic reply, `Submissions` gets a
      row. Delete the test row.
- [ ] Gmail "Show original" on both emails: SPF, DKIM and DMARC all **PASS**.
- [ ] Turnstile works on the preview host and on the apex and `www.`.
- [ ] `?topic=partner` (or the client's variants), a missing field, six quick submits (the sixth
      gets the rate-limit message).
- [ ] Phone: the form, the widget if it appears, the thanks page.
- [ ] `curl -sI https://<apex>/`: HTTP 200 and the security headers from `_headers`;
      `curl -s -X GET https://<apex>/api/contact` returns `{"error":"method_not_allowed"}`.

## 11. Search

- [ ] Google Search Console: verify the property, submit `https://<apex>/sitemap.xml`.
- [ ] Confirm `robots.txt` allows all and nothing noindexes the apex (only `*.workers.dev` and
      `*.pages.dev` hosts carry `X-Robots-Tag: noindex` from `_headers`; only `/contact/thanks` and the
      404 are page-level noindex).

## 12. Handoff to the client

- [ ] The client holds the owner role on: the GitHub organisation or repo, the Cloudflare account,
      the Resend account, the Google Workspace tenant, the Google Cloud project, the Google Sheet, the
      UptimeRobot account. The builder is a member, removable without breaking anything.
- [ ] Hand over, in writing: the four secret **names** and where each value came from (so they can be
      rotated), the weekly Sheet check (every `Submissions` row should have had a reply), the rollback
      runbook, the "do not click" list (Delete, Disconnect, Split versions, Retry build, build or
      deploy command, production branch), and the rule that merging to `main` is the deploy.
- [ ] Record the ruleset, the Workers Builds settings and the dates of every promotion in the client
      repo's `CLAUDE.md`, the way this repo's does.

## Gotchas hit on this pipeline

Each one is either in a repo file or PR (cited) or supplied by the owner for this handbook
(**owner-confirmed 2026-11-15**, no repo file records it).

- **G1. Preview secrets are separate from production, and are copied at creation.** A preview made
  before the base config had the four secrets kept failing with the owner's "Something broke" error.
  Set the base config first; fix an existing preview with `wrangler preview secret put --name`.
  (README "Secrets", `wrangler.jsonc` comment, commit `1f1fa8d`.)
- **G2. Service-account key creation blocked by the Workspace organisation policy.** A new Workspace
  creates a Google Cloud organisation whose Secure-by-Default policy
  `iam.managed.disableServiceAccountKeyCreation` blocks "Create new key". The super admin grants
  themselves Organization Policy Administrator at the organisation level, then overrides the policy
  at the project (IAM & Admin, Organization Policies, Manage policy, Override parent's policy,
  enforcement Off). Project-only; the organisation default stays on. (Owner-confirmed 2026-11-15.)
- **G3. Cloudflare Email Routing versus Google Workspace MX.** Both need the root MX records, so only
  one can receive mail. Workspace replaced Email Routing: disable Email Routing, remove its
  `route*.mx.cloudflare.net` MX records and its `include:_spf.mx.cloudflare.net` SPF, add Google's 5
  MX records, the single root SPF `v=spf1 include:_spf.google.com ~all` and Google's DKIM. The
  leftover `cf2024-1._domainkey` TXT is harmless. (Owner-confirmed 2026-11-15.)
- **G4. Resend's records are CNAME-based (Forge).** `send` and `rsend` are CNAMEs to
  `*.forge.rmta.net`; there is no MX or SPF TXT to add on `send`, and nothing is added to the root
  SPF. The classic Resend guide (MX plus SPF TXT on `send`) does not apply. (README, commit
  `3eafc71`.)
- **G5. Business names out of filenames in a public repo.** Screenshots are `systems-1.webp` to
  `systems-4.webp`, the headshot is the owner's own name, raw source images live in the git-ignored
  `/incoming/`, and the plan document had its internal notes and third-party business names trimmed
  (`docs/website-plan.md` "Public-repo trim", PR 52).
- **G6. npm 10 `engine-strict`.** A lockfile written by npm 11 broke CI's `npm ci` on PR 31. Now
  `engines.npm` is `>=10.9.2 <11` and `.npmrc` has `engine-strict=true`, so `npm install`/`npm ci`
  refuse under npm 11; use `npx --yes npm@10.9.9 ci`. Always watch the first CI run's Install
  dependencies step after a lockfile change. (PR 34, `CLAUDE.md`.)
- **G7. `NO_NAVSTART` on `lighthouse`.** A Lighthouse trace-recording hiccup, not a site problem.
  "Re-run failed jobs" on the run. (`CLAUDE.md`, README.)
- **G8. Dependabot grouped a TypeScript major into the npm group** and `check` failed with
  "typescript-eslint does not support TS 7.0" (PR 16). The npm group is now minor and patch only, with
  majors of `typescript`, `eslint`, `@types/node`, `typescript-eslint` and `@typescript-eslint/*`
  ignored (PR 18).
- **G9. The `previews` block is required** in `wrangler.jsonc` even when empty, or Cloudflare's
  preview build fails with "Your Wrangler configuration is missing a `previews` block" (PR 7). And
  previews do not inherit top-level `vars` or bindings, so `SITE_ENV` and the rate limit are repeated
  inside it.
- **G10. A hook's "ask" may not prompt in Auto mode.** Owner-only paths are therefore blocked (exit
  2) rather than asked, and `settings.json` repeats the rules as `deny`/`ask` (PRs 37, 38).
- **G11. `disable-model-invocation: true` did not stop the model** from starting `/ship-check`
  through the Skill tool (Claude Code 2.1.321), so the skill carries an in-body STOP CHECK (PR 14).
- **G12. The pre-commit hook refuses a deliberately failing commit**, so proof PR 26's commit had to
  be made through the GitHub API (PR 26).
- **G13. A required check with a `paths:` filter or `[skip ci]` never reports** and leaves the PR
  stuck. Never add either to `check`, `a11y`, `lighthouse` or `dependency-review` (`CLAUDE.md`).
- **G14. Turnstile hostnames.** The widget must list the account's `<account>.workers.dev` for
  previews, and the apex plus `www.` for production; error 110200 means a host is missing (README,
  PR 53).
- **G15. The Turnstile widget's test keys return hostname `example.com` and no action**, so the
  Worker skips the hostname and action checks only in development mode (`worker/contact.ts`).
- **G16. `upload-artifact` skips hidden folders** such as `.lighthouseci/` unless
  `include-hidden-files: true` (commit `281461b`).
- **G17. Lighthouse CI's default aggregation is `optimistic`** (passes if any one run passes); use
  `median` with three runs (PR 24).
- **G18. `@lhci/cli` pulls in a vulnerable `basic-ftp`** it never uses; override it in
  `package.json` and remove the override when upstream fixes it (PR 24).
- **G19. `codeql-action`'s release tag is annotated**; pin the commit the tag points to, not the tag
  object (PR 23).
- **G20. Cloudflare has no email alert for a failed Workers Builds deploy.** The red check on the
  merge commit is the only signal (README "Monitoring").
- **G21. The www redirect needs a DNS record to run.** A Worker custom domain cannot redirect, so the
  redirect is a zone Redirect Rule (template "Redirect from WWW to root"). If no `www` record exists,
  `www` does not resolve and the rule never runs. Add a **proxied** `AAAA` record `www` to `100::`
  (a dummy address that is never contacted). (Owner-confirmed 2026-11-15.)
- **G22. Never run two Claude Code chats in the same checkout at once.** They switch branches under
  each other: on 2026-11-15 a commit landed on the wrong branch and had to be cherry-picked. Use a
  separate git worktree for parallel work (`git worktree add ../<folder> -b type/short-name`), and
  run `git branch --show-current` right before every commit. (Owner-confirmed 2026-11-15.)
