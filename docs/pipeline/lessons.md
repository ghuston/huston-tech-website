# Lessons: decisions and why, rejected options and why

Read this before changing how the pipeline works, so a rejected option is not tried twice. Every
entry names where the decision is recorded (a file, a commit or a PR). Entries marked **UNVERIFIED**
state a reason the records do not spell out.

Back to the [map](./README.md).

## Hosting and deploy

| Decision | Why | Rejected | Where |
|---|---|---|---|
| **Cloudflare Workers static assets**, with one Worker for `/api/*` | A fully static export with one API route; `_headers` honoured; previews per branch; Workers Builds deploys on merge | **Cloudflare Pages** (the first README said Pages; docs were corrected in PRs 13 and 17). **OpenNext** (`docs/website-plan.md` E1: "Not Pages, not OpenNext"). A Node server at runtime (`output: "export"` forbids it) | PR 5, PR 17, `AGENTS.md`, `next.config.ts` |
| **Deploy only by merging to `main`**; `wrangler deploy` by hand is blocked by a hook | One path to production, always through the required checks; a human merge is the last gate | Deploying from the Mac; auto-merge by the agent (blocked, including through `gh api`) | `CLAUDE.md`, `guard-bash.mjs` |
| **`npm run build:launch` as the production build command at launch** | A build with unresolved `[[placeholders]]` or a null provider setting cannot go live | Trusting the launch checklist alone | README, `package.json`, `scripts/check-placeholders.mjs` |
| **Rollback through Cloudflare Deployments, never through Git force-pushes** | About a minute to recover; `main` stays true; the next merge replaces the rollback | Reverting under pressure without a rollback (allowed, but slower: about 6 minutes of checks) | README "Rollback runbook", practised 2026-11-13 |
| **UptimeRobot free monitor** | Zero cost, email alerts, no token involved | A deploy-failure alert (Cloudflare has none without a Queue plus a Worker plus a webhook; not built) | README "Monitoring", PR 36 |
| **Preview URLs stay public**, kept out of search by `noindex` | Simplicity; Cloudflare adds `noindex` to previews itself and `_headers` repeats it | Cloudflare Access in front of previews (possible, not done) | PR 7 |

## Gate 1: hooks and permissions

| Decision | Why | Rejected | Where |
|---|---|---|---|
| **Hooks as Node scripts with a real shell parser**, no business name inside | A text search for `--no-verify` would block a commit message that mentions it; the folder can be copied to any repo | Regex-only matching; shell-script hooks | `lib.mjs` header, PR 10 |
| **Fail closed** (`try/catch` to `block`, plus `onFailure: "block"`) | A crashed guard must not let the action through | Hooks that fail open on error | `lib.mjs` `guard()`, `settings.json` |
| **Hooks never answer "allow"** | They can only add friction, so they can never override a `permissions.deny` rule | Hooks that whitelist | hooks README "Rules these scripts follow" |
| **Owner-only paths are blocked (exit 2), not asked** | In Auto mode a hook's "ask" may not prompt; the classifier can decide first. Hooks, agents, skills, workflows and settings control the agent's own behaviour, so the agent may never change them | "Ask" for everything (the first version, PR 10) | PR 37, `lib.mjs` `OWNER_ONLY_DIRS` |
| **A second lock in `settings.json`** (`deny` and `ask` rules anchored at the project root) | Mode-independent; the Claude Code docs say deny applies in every mode and hooks cannot override it. Live tests had shown the hook-only ask tier applying edits with no block in both default and Auto mode | Relying on hooks alone | PR 38 |
| **The owner edits protected files by hand** (agent writes to the scratchpad, owner copies, runs the selftest, agent commits) | Nothing in the repo can unlock the paths, so the agent cannot flip it either | A `.claude/unlock` flag or similar | hooks README, PR 37 |
| **`precommit-check` runs the full `npm run check`** before every commit | The project rule is "run the checks before every commit"; it took about 5 seconds when written (now longer with the Worker tests and build) | A lighter pre-commit (lint only) | `precommit-check.mjs`, PR 10 |
| **`scan-src` warns, never blocks** | Heuristics miss things and flag harmless ones; a block would stall honest work | Blocking on a heuristic | `scan-src.mjs` header |
| **`rm -r` allowed only in scratch and build folders**, and refused after a `cd` or with a variable | A recursive delete the hook cannot verify is not worth the risk | Allowing `rm -rf` anywhere in the repo | `guard-bash.mjs` `checkRm` |
| **Secret files denied to the Read tool AND to Bash** | The `permissions.deny` rules cover only Claude's Read tool; `cat .env` goes through Bash | Deny rules alone | PR 6, `guard-bash.mjs` check 9 |
| **One plain command per Bash call, no `&&` chains, no variables** | Each call matches one allow rule, so permission prompts stay rare; the parser can verify it | Long chained commands | `CLAUDE.md` "Command style", PR 25 |

## Gate 1: skills and agents

| Decision | Why | Rejected | Where |
|---|---|---|---|
| **`/ship-check` is report-only and owner-invoked** | A self-review that could also edit would blur who decides; `disable-model-invocation: true` was found not to stop the model (Claude Code 2.1.321), so an in-body STOP CHECK was added | A skill that fixes what it finds | PR 14, `SKILL.md` |
| **Three reviewers with `tools: Read, Grep, Glob, LSP`** | Read-only by construction, not by instruction; each checks this repo's written rules only, so the built-in `/review` and `/security-review` are not duplicated | One general reviewer; reviewers with Bash | PR 11, `.claude/agents/*.md` |
| **Fixed FLAGGED / OK / UNSURE output with `file:line` on every line** | The `/ship-check` report copies lines verbatim; UNSURE never changes the verdict, so a reviewer cannot be bullied into OK | Free-form review prose | `.claude/agents/*.md`, `SKILL.md` |
| **Skills vendored into the repo from pinned upstream commits** | They are owner-only paths, so a change is a PR, not a silent upstream update | Marketplace skills that update themselves | PR 9 |
| **Reviewer models: sonnet for code and a11y, opus for security** | **UNVERIFIED**: not stated in PR 11; presumably cost for the two broad rule sets and depth for the security one | | `.claude/agents/*.md` frontmatter |

## Gate 2: CI and the ruleset

| Decision | Why | Rejected | Where |
|---|---|---|---|
| **Every Action pinned to a full commit SHA**, at least 7 days old when added, with the version as a comment | A moved or tampered tag cannot change what runs; the week lets a bad release surface | Floating tags (`@v4`); same-day releases | PR 15, PR 23, `AGENTS.md` |
| **`persist-credentials: false`, `permissions: contents: read`** everywhere; `security-events: write` only on the CodeQL job | Least privilege; nothing in CI pushes | GitHub's starter-template permissions (`packages: read`, `actions: read`) | PR 15, PR 23 |
| **Required checks tied to job names; never `paths:`, never job-level `if:`, never `[skip ci]`** | A required check that never reports leaves the PR stuck forever | Path-filtered jobs to save minutes | `CLAUDE.md` "Protect main" |
| **Change the ruleset first, then the workflow** | The ruleset is the lock; the workflow is what it locks | Renaming a job and fixing the ruleset afterwards (PR stuck meanwhile) | `CLAUDE.md` |
| **Promotion: 5 clean runs plus a deliberate-failure proof PR** | A check that has never gone red proves nothing; the proof PR shows the merge button actually blocks | Making a check required the day it is added | PRs 22, 23, 24, 26, 28, 29, 31, 32, 33 |
| **Proof PRs are closed with `--delete-branch`, never merged**, titled `PROOF - DO NOT MERGE` | The repo history must never contain a deliberately broken commit on `main` | Merging the proof and reverting | `CLAUDE.md`, PRs 26 to 32 |
| **CodeQL enforced through the "Require code scanning results" rule, not a status check on the `codeql` job** | The job goes red only if the scan itself broke; the rule blocks on actual alerts | Requiring the `codeql` status check | PR 23, README |
| **CodeQL advanced setup (a workflow file), `build-mode: none`** | The file is owned and SHA-pinned; JS/TS needs no build | Default setup (conflicts with a workflow file); scanning the `actions` language (deferred, never added) | PR 23, `codeql.yml` |
| **`dependency-review` on pull requests only, `fail-on-severity: low`, `fail-on-scopes: runtime, development`** | It compares base and head, so push and schedule runs have nothing to compare; almost everything here is a dev dependency and still runs in CI | The action's default (runtime only) | `dependency-review.yml` |
| **Zero required approvals** | One-person shop; the owner merges their own PRs | Requiring a review that the same person would give | ruleset `pull_request` rule |
| **`strict_required_status_checks_policy: false`** | A PR need not be rebased onto the latest `main` to merge | Strict mode (extra pushes for every merge) | ruleset |
| **Both `a11y` and `lighthouse` build the site themselves** | Each job stands alone; no artifact hand-off | Building once in `check` and downloading `out/` | `ci.yml` |
| **`npm 10` with `engine-strict`** (`>=10.9.2 <11`) | A lockfile written by npm 11 broke CI's `npm ci` (PR 31); the range accepts both CI's 10.9.9 and Cloudflare's 10.9.2 | Upgrading CI to npm 11 (Cloudflare's image was 10.9.2) | PR 34, `.npmrc`, `package.json` |

## Gate 2: the a11y suite

| Decision | Why | Rejected | Where |
|---|---|---|---|
| **Scan the built `out/` through `scripts/preview.mjs`**, not the dev server | What ships is what is scanned, and `_headers` (the CSP) applies | `next dev` or `next start` | `playwright.config.ts` |
| **Two passes per page: top and scrolled to the bottom** | The sticky header over the last section only shows at the bottom; PR 20 and PR 21 were found this way | One pass | `site.a11y.spec.ts`, PR 22 |
| **`reducedMotion: "reduce"`** | Animations end in the static design, so a scan never catches a half-faded colour | Waiting on animations | `playwright.config.ts` |
| **One route list, `src/lib/routes.ts`, for the sitemap, the suite and Lighthouse, plus a drift-guard test** | A new page can never escape the scan or the sitemap | Hard-coded page lists in three places | `bab4528`, PR 22 |
| **Exactly one skipped rule, in one pass, on one page, with the date and reason in the file** | Honest about the one false positive; the comment forbids widening it | Disabling `target-size` globally; a `KNOWN_ISSUES` entry | `site.a11y.spec.ts` |
| **`known-issues.ts` stays empty, and a test fails if an entry stops matching** | "Never add an entry just to get CI green"; stale entries delete themselves | A growing allow-list | `known-issues.ts`, `AGENTS.md` |
| **Exact pins (no `^`) for `@playwright/test` and `@axe-core/playwright`; `playwright-core` overridden to the same version; never also install `playwright`** | One Playwright version, reproducible installs | `^` ranges (older deps such as `typescript ^5`, `eslint ^9`, `@types/node ^20` still carry them; the rule is "tooling added from now on") | PR 22, `AGENTS.md` |
| **The contact form tested against a stubbed Worker and a stubbed Turnstile** | Nothing leaves the machine; every error branch is reachable | A live Worker in CI (needs secrets) | `contact-form.spec.ts` |

## Gate 2: Lighthouse

| Decision | Why | Rejected | Where |
|---|---|---|---|
| **Median of 3 runs, mobile preset** | LHCI's default `optimistic` passes if any one run passes; one local run of `/` scored 0.91 while the others scored 1.0 | Single run; optimistic aggregation | PR 24, `lighthouserc.cjs` |
| **Indexable routes only** | A `noindex` page cannot pass the SEO "is crawlable" audit; the 404 returns an error status | Auditing every page | `lighthouserc.cjs` |
| **All four categories at `error`** (performance was `warn` until PR 49) | The plan's E7 says Lighthouse at or above 90 in all four categories, "enforced by the `lighthouse` check" | Performance warn-only (the first version) | `0fd29d3`, `docs/website-plan.md` E7 |
| **Reports as a workflow artifact (14 days) and a summary table**, not `temporary-public-storage` | Nothing uploaded to a public store | LHCI's public temporary storage | PR 24 |
| **The preinstalled Google Chrome on `ubuntu-latest`** | No browser download in CI | Downloading Chromium for Lighthouse | `ci.yml` comment |
| **`require("./src/lib/routes.ts")` from a `.cjs` config** | LHCI reads only CommonJS; Node 22.18+ strips types natively, so the route list is shared without a build step. Costs: `engines.node >= 22.19` and `routes.ts` must stay import-free | A duplicated route list in the config | `lighthouserc.cjs`, PR 24 |

## Dependencies

| Decision | Why | Rejected | Where |
|---|---|---|---|
| **Runtime dependencies are only Next, React and React DOM** | Smallest surface; everything else is dev-only and never ships | Component, state, animation and CSS-in-JS libraries | `AGENTS.md`, `package.json` |
| **Overrides for `playwright-core`, `basic-ftp`, and `minimatch` plus `@isaacs/nonrecursive-glob-match` under `typescript-estree`**, each with a stated reason and a "remove when upstream fixes it" | Clears known advisories in code paths never run, without forking | Ignoring the audit; waiting for upstream | PR 12, PR 22, PR 24, `package.json` |
| **Dependabot weekly, 7-day cooldown, grouped; npm group minor and patch only; majors of the TypeScript/ESLint toolchain and `@types/node` ignored** | PR 16 grouped TypeScript 7 in and `check` failed ("typescript-eslint does not support TS 7.0"); `@types/node` should match Node 22 | Grouping majors; no cooldown | PR 15, PR 18, `dependabot.yml` |

## The contact Worker

| Decision | Why | Rejected | Where |
|---|---|---|---|
| **A Worker on `/api/*` with `run_worker_first`**, the site still a static export | A static export has no server routes; the Worker runs only where needed | Next.js API routes or server actions (impossible with `output: "export"`); a third-party form service | `docs/website-plan.md` E6, `wrangler.jsonc` |
| **No libraries in the Worker**: Web Crypto for the Google JWT, `fetch` for everything | Nothing to audit or update; the JWT is 50 lines | `googleapis`, a JWT library, Resend's SDK | `worker/sheets.ts`, `AGENTS.md` |
| **Resend** as the email service | Its free tier covers this volume, it has a simple REST API usable with `fetch` (no SDK dependency), and Cloudflare's dashboard auto-configures its DNS records (owner-confirmed 2026-11-15) | Postmark (the plan allowed "Resend or Postmark") | `docs/website-plan.md` E6 |
| **Workspace replaced Cloudflare Email Routing on the domain** | Both need the root MX records, so only one can receive mail; the business mailbox is a Workspace one (owner-confirmed 2026-11-15) | Keeping Email Routing alongside Workspace (impossible: one set of root MX records) | [contact-form.md](./contact-form.md#dns-for-google-workspace-plus-resend) |
| **Org policy overridden for one project only, to allow a service-account key** | Google's Secure-by-Default policy blocks key creation; overriding at the project leaves the organisation default on (owner-confirmed 2026-11-15) | Turning the policy off for the whole organisation | [contact-form.md](./contact-form.md#the-google-side) |
| **DMARC starts at `p=none`, moves to `p=quarantine` after 2 to 4 weeks of clean reports** | Monitor first so a misaligned sender is seen before mail is rejected (owner-confirmed 2026-11-15) | Starting at `quarantine` or `reject` | [contact-form.md](./contact-form.md#dns-for-google-workspace-plus-resend) |
| **www redirect: Cloudflare "Redirect from WWW to root" rule template plus a proxied `AAAA` record `www` to `100::`** | A Worker custom domain cannot redirect, and with no `www` record in DNS the name does not resolve, so the rule never runs; the proxied dummy record makes the name resolve to Cloudflare, which then applies the redirect (owner-confirmed 2026-11-15) | A redirect rule alone (www does not resolve); adding `www` as a second custom domain on the Worker | [gate3-deploy-ops.md](./gate3-deploy-ops.md#custom-domains-and-the-www-redirect) |
| **One Claude Code chat per checkout; parallel work in a separate git worktree** | Two chats in the same folder switch branches under each other: on 2026-11-15 a commit landed on the wrong branch and had to be cherry-picked (owner-confirmed 2026-11-15) | Several chats sharing one working folder | [client-onboarding-checklist.md](./client-onboarding-checklist.md#gotchas-hit-on-this-pipeline) |
| **Plain-text email only, never HTML** | Nothing a visitor types can become markup in anyone's inbox | HTML templates | `worker/email.ts`, `AGENTS.md` |
| **Success only when the note reached the owner** (Sheet row or email); no fake success | Honesty to the visitor; the email says when the Sheet failed, the thanks page says when the reply failed | A success page after the request was merely accepted | `worker/contact.ts`, README |
| **Sheet first, then the email** | The email to the owner can say whether the row was saved | Parallel calls | `worker/contact.ts` |
| **The honeypot gets an honest 400, never a pretend success** | `AGENTS.md`: "an honest error, never a pretend success" | Silently dropping bot posts with a 200 | `worker/contact.ts` |
| **One shared validation module** (`src/lib/contact-validation.ts`) and import-free content modules, imported by both the form and the Worker with `.ts` extensions | One set of rules, no drift between browser and server; `site.ts` is excluded because it reads `process.env` | Duplicated validation | `AGENTS.md`, `worker/tsconfig.json` |
| **First name and auto-reply result travel in `sessionStorage`, never the URL** | Nothing personal in a URL, history or server log; storage blocked means a plain thanks page | `/contact/thanks?name=` | `src/lib/contact-handoff.ts` |
| **Turnstile loaded only on first focus, `interaction-only`, with `action` and hostname checked server-side** | No third-party script at page load; a token from another widget or site is refused | Loading Turnstile at page load; a visible checkbox | `useTurnstile.ts`, `worker/turnstile.ts` |
| **A missing or refused Turnstile secret is a 502 (our fault), not a 403 (the visitor's)** | The visitor did nothing wrong; it also made the preview-secrets gotcha visible | One generic "couldn't verify" | `1f1fa8d`, PR 53 |
| **Preview mode mails only the site's own address and writes to the `Preview` tab; any non-production `workers.dev` host counts as a preview** | A test on a preview can never email a stranger or pollute the real rows, even with a wrong `SITE_ENV` | Trusting `SITE_ENV` alone | `worker/env.ts` |
| **Development mode works only on a local host** | A stray `SITE_ENV=development` can never turn the live form into one that sends nothing | | `worker/env.ts` |
| **Cloudflare's rate-limit binding (5 per minute per IP)** | Native, no storage to manage; previews get their own namespace | KV-based counters; no limit | `wrangler.jsonc` |
| **`valueInputOption=RAW` plus a leading apostrophe on `= + - @`** | Sheets never parses a formula, and an export opened elsewhere is safe too (OWASP CSV injection) | `USER_ENTERED` | `worker/sheets.ts` |
| **Logs hold fixed event names and status codes only; invocation logs off** | No personal data in logs | Logging the submission for debugging | `worker/env.ts`, `wrangler.jsonc` |
| **Secrets exist only in Cloudflare, names listed in `wrangler.jsonc` `secrets.required`** | A deploy fails loudly when one is missing; nothing in the repo or chat | `.dev.vars` with real values; GitHub Actions secrets | README, `.env.example` |
| **The scheduler is a link, not an iframe** | No CSP change, no third-party frame | An embedded scheduler (would need `frame-src`) | PR 53 |
| **Analytics dropped from the privacy copy rather than installed** | No analytics was installed; the copy must not claim one | Adding a cookieless tool and its CSP origin (still possible) | PR 53 |

## Mail and DNS

| Decision | Why | Rejected | Where |
|---|---|---|---|
| **Google Workspace keeps the root MX, the single root SPF and `google._domainkey`; Resend lives on its Forge CNAME records** | The two providers never touch; one SPF record on the root; DMARC passes through aligned DKIM | Adding Resend's include to the root SPF; the classic MX plus SPF TXT on `send` | README "Accounts and DNS", `3eafc71` |
| **All Resend records "DNS only"**; open and click tracking off | Mail records must not be proxied; tracking rewrites links in plain-text mail | Proxied records; tracking on | README |
| **A Google Cloud service account with no project roles, shared on one Sheet as Editor** | Least privilege: it can write that one Sheet and nothing else | OAuth as the owner; an Apps Script web app | README |

## Content and repo hygiene (pipeline-relevant)

| Decision | Why | Rejected | Where |
|---|---|---|---|
| **The repo is public, so third-party business names, sales notes and raw images are kept out** | A public repo is read by anyone; filenames and docs are content too | Keeping client names in filenames | `docs/website-plan.md` "Public-repo trim", PR 52, `.gitignore` `/incoming/` |
| **Copy lives only in `src/content/`, verbatim from the plan; `[[placeholders]]` for unknowns; a launch gate that fails on any** | The gate is the only honest way to stop a half-finished page going live; `scan-src` nudges copy out of JSX | Copy in JSX; deleting a placeholder to hide a gap | `AGENTS.md`, `scripts/check-placeholders.mjs` |
| **Every PR description starts with a "Needs your eyes" line** | The owner is told exactly which rule or config files moved | Reading every diff for `package.json` changes | `CLAUDE.md` |
| **CLAUDE.md records dashboard and ruleset facts with the date they were read** | The repo cannot read dashboards; a dated note says how stale it may be | Treating dashboard facts as code | `CLAUDE.md` "Protect main", README |

## Things still open (not decisions)

- A deploy-failure alert (Queue plus Worker plus webhook) is not built.
- The `actions` language in CodeQL was deferred and never added.
- `.claude/hooks/README.md` still says Hook 3 runs "before Edit/Write" (it also covers `NotebookEdit`).
- README "Scheduler and analytics are still placeholders" is out of date: the scheduler URL is set
  (a link, no iframe) and the privacy copy no longer mentions analytics.
- The vendored skills' exact upstream commits are not recorded in any repo file (**UNVERIFIED**).
- The reason for running `review-security` on opus while the other two run on sonnet is not recorded
  (**UNVERIFIED**; the table row above says the same).
- Whether `_headers`' `workers.dev` host pattern matches a real preview URL was never confirmed.
- Whether Dependabot's npm passes `engine-strict` is untested in isolation (PR 19 merged after
  PR 34, which suggests yes).
