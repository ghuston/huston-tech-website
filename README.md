# Huston Logic website

Marketing site for **Huston Logic**, a one-person consultancy that builds custom websites and fixes the workflows behind them, run by Grant Huston. Built with Next.js (App Router), strict TypeScript and Tailwind CSS, exported as a fully static site for **Cloudflare Workers**.

Permanent architecture, security and content rules are in [`AGENTS.md`](./AGENTS.md). Read it before making changes.

## Pages

| Route | Page |
|---|---|
| `/` | Home |
| `/services` | Services (Start here, Common fixes, Systems work, FAQ) |
| `/past-work` | Past Work and testimonials |
| `/about` | About Grant |
| `/insights` | Insights ("coming soon" until the first article) |
| `/contact` | Scheduler placeholder and the contact form (`?topic=partner` shows the Zoho partner variant) |
| `/contact/thanks` | Form confirmation, reached only after a real send (noindex) |
| `POST /api/contact` | The contact form Worker (`worker/contact.ts`), not a page |
| `/privacy` | Privacy policy (draft, needs review) |
| `404` | Not found |

## Develop

Requires Node 22.19+ and npm 10 (`>=10.9.2 <11`; matches `engines` in package.json and `engine-strict` in `.npmrc`; CI uses Node 22 with npm 10.9.9). `npm install` and `npm ci` refuse to run under npm 11, so if your default npm is 11, put `npx --yes npm@10.9.9` in front of them.

```bash
npx --yes npm@10.9.9 install   # or plain `npm install` when your npm is 10
npm run dev          # http://localhost:4821
```

All copy lives in typed modules under `src/content/`. Components are in `src/components/`, routes in `src/app/`.

### Checks

```bash
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit for the site, then for the Worker (worker/tsconfig.json)
npm run test:worker   # contact Worker tests (Node's built-in test runner; no network)
npm run build         # static export to ./out
npm run check         # lint + typecheck + test:worker + build
```

CI runs the same checks on every pull request (`.github/workflows/ci.yml`).

### Required checks

Four checks must pass before a pull request can merge into `main`: `check`, `a11y` and `lighthouse` (jobs in `.github/workflows/ci.yml`) and `dependency-review` (`.github/workflows/dependency-review.yml`); this is the "Protect main" ruleset. A fifth lock, the "Require code scanning results" rule (CodeQL; Alerts = Errors, Security alerts = High or higher), blocks the merge while a new CodeQL alert is open. It shows no "Required" badge: the merge box says "CodeQL has detected N security relevant alert(s) blocking this code from being merged". A new check becomes required only after 5 clean runs plus a deliberate-failure proof PR that shows it blocks the merge.

### Preview the production build

```bash
npm run build
PORT=4822 npm run preview   # http://localhost:4822
```

`scripts/preview.mjs` serves `./out` with clean URLs and `404.html`, and applies the site-wide headers from `public/_headers` (including the CSP) so header problems show up locally.

### Accessibility check (Playwright + axe)

```bash
npm run build
npx playwright install chromium   # once; downloads the browser (see Playwright's cache folder)
npm run test:a11y
```

`playwright.config.ts` starts `npm run preview` (port 4822) and scans the built site in Chromium at desktop (1280 px) and phone (375 px) width, with `prefers-reduced-motion` set. Each page is checked against axe's WCAG 2.0/2.1/2.2 level A and AA rules plus axe's best-practice rules, twice: once at the top of the page (every rule) and once scrolled to the bottom, where the sticky header sits over the last section. It also scans `/services` with every FAQ open and the opened mobile menu.

One rule is skipped, in one place: `target-size` in the scrolled pass on `/services` at desktop width (added 2026-11-12). At maximum scroll the sticky header and sub-nav cover the last CTA button, so axe reports it as partly obscured, although scrolling up uncovers it. The same button is checked by every rule in the top-of-page pass. The skip and its reason are in a comment in `tests/a11y/site.a11y.spec.ts`; do not widen it. The page list comes from `src/lib/routes.ts`, the same list the sitemap uses, and a test fails if a built page is missing from it.

Automated checks find only part of the accessibility problems. Keyboard, screen reader, zoom and wording checks are still manual.

A genuine false positive may be recorded in `tests/a11y/known-issues.ts` (one rule on one selector, with a written reason). Never add an entry just to get green.

In CI this is the `a11y` job in `.github/workflows/ci.yml`. It is a required check in the "Protect main" ruleset, so a red result blocks merge. On a failure the Playwright HTML report is uploaded as the `playwright-report` artifact (kept 7 days).

### Lighthouse CI

```bash
npm run build
npm run test:lighthouse
```

`npm run build && npm run test:lighthouse` audits the built site with Lighthouse CI (mobile preset, median of 5 runs per page) against the eight indexable pages in `src/lib/routes.ts` (a `noindex` page cannot pass the SEO check, and the 404 page returns an error status). It serves `out/` through `scripts/preview.mjs`, so the headers in `public/_headers` apply, and uses the Google Chrome installed on your machine (or `CHROME_PATH`). Reports are written to `.lighthouseci/` (git-ignored). Accessibility and SEO must score 0.95 or higher, and best-practices and performance 0.9 or higher; all four fail the job (`lighthouserc.cjs`). The preview server does not compress files or set cache headers the way Cloudflare does, so its performance score understates the deployed site.

In CI this is the `lighthouse` job in `.github/workflows/ci.yml`. It is a required check in the "Protect main" ruleset, so a red result blocks merge. Scores for every page are in the run's Summary, and the full HTML and JSON reports are the `lighthouse-reports` artifact (kept 14 days; open the `.report.html` for the failing URL to see which audits failed). If it fails with `NO_NAVSTART` (a Lighthouse trace-recording hiccup, not a site problem), click "Re-run failed jobs" on the run.

`package.json` overrides `basic-ftp` to 6.2.6 because Lighthouse CI 0.16.0 bundles a version with known denial-of-service advisories in code it never runs; remove the override when Lighthouse CI ships a fix.

### Security scans (dependency review and CodeQL)

Two security jobs, each in its own workflow file. Both block merging through the "Protect main" ruleset: `dependency-review` as a required status check, and CodeQL through the "Require code scanning results" rule. Both are SHA-pinned and get only the permissions they need.

| Job (check name) | File | Runs on | What it does |
|---|---|---|---|
| `dependency-review` | `.github/workflows/dependency-review.yml` | Pull requests | Fails if the PR adds or changes a dependency to a version with a known vulnerability (any severity; runtime and development dependencies). It only judges what the PR changes, not what is already in `main`. |
| `codeql` | `.github/workflows/codeql.yml` | Pull requests, pushes to `main`, and weekly (Mondays 04:17 UTC) | GitHub's CodeQL scans our JavaScript and TypeScript for security bugs. No build step is needed. |

**Reading a `dependency-review` failure:** a red `dependency-review` means a package the PR adds has a known vulnerability; the log names the package and its GHSA. Open the failed check's Details, then the job log or its Summary. It lists each flagged package, the version the PR adds, the severity and a GitHub advisory (GHSA) link. Fix it by moving to the patched version the advisory names, choosing another package, or removing the dependency. A deliberate, understood exception goes in the workflow as `allow-ghsas` with a written reason; never add one silently.

**Reading CodeQL results:** there are two signals. The `codeql` job goes red only if the scan itself broke (read its log). Findings show up as a separate check, "Code scanning results / CodeQL", which fails for new alerts of severity error, critical or high. The PR's Conversation and Files changed tabs show each alert on its line; "Show more details" opens the path from source to sink. All alerts are under Security and quality, then Code scanning. Fix the code, or dismiss the alert with a reason. A merge blocked by code scanning means the PR adds a new CodeQL alert of severity Error / High or higher (lower ones do not block); open the Code scanning results / CodeQL check to see it. The rule also blocks while the CodeQL scan is still running or not set up, so a PR with no alerts can show the same message until the scan finishes.

Scheduled runs only happen on the default branch, and GitHub disables schedules in a public repository after 60 days without activity.

**Required:** both are enforced in "Protect main" and were proven with deliberate-failure PRs: #31 for `dependency-review` and #32 for the CodeQL alert. To change either, change the ruleset first (see CLAUDE.md).

### Configuration

| Setting | Where | Notes |
|---|---|---|
| Site URL | `NEXT_PUBLIC_SITE_URL` (see `.env.example`), default `https://hustonlogic.com` in `src/content/site.ts` | Used for canonical URLs, Open Graph, sitemap, robots and JSON-LD. Public value, not a secret. |
| Contact email, scheduler URL, LinkedIn URL, Turnstile site key | `src/content/providers.ts` (re-exported by `site.ts`) | `null` renders a visible placeholder. The Worker reads this file too. The Turnstile site key is public. |
| Content-Security-Policy | `public/_headers` | `https://challenges.cloudflare.com` is allowed in `script-src` and `frame-src` for Turnstile on the contact form, and `https://static.cloudflareinsights.com` (`script-src`) and `https://cloudflareinsights.com` (`connect-src`) for Cloudflare Web Analytics. Nothing else is loaded from outside. `_headers` covers static files only; the Worker sets its own headers on `/api/*`. |
| Worker settings | `wrangler.jsonc` | Secret **names** only, never values. After changing it, run `npx wrangler types worker/worker-configuration.d.ts`. |
| Framework step names, numbers, one-liners | `framework.steps` in `src/content/site.ts` | The only place "Scope it / Shape it / Ship it" is defined. Content strings use `{scope}`, `{shape}`, `{ship}`, `{steps}` tokens via `fw()` (`src/lib/framework.ts`). Rename a step here and every page follows. |

## Motion

Animation is CSS only (no library), in `src/app/hl.css`, following `docs/STYLE-GUIDE.md` §9: the Home hero cards fan in, link arrows nudge 3px and the slow underline draws on hover and keyboard focus, doors swing, the mobile menu opens with one short transition, the homepage process diagram plays once when it scrolls into view, and the header badge turns with the scroll. With `prefers-reduced-motion: reduce`, or with JavaScript off, the final static design shows immediately. See "Motion rules" in `AGENTS.md` before adding any.

## Placeholders and launch gate

Anything only Grant can supply is written as `[[double brackets]]` in `src/content/*` and renders as a highlighted marker on the page. Provider-dependent values (`email`, `schedulerUrl`, `linkedInUrl`, `turnstileSiteKey`) stay `null` in `src/content/providers.ts` until set.

```bash
npm run check:placeholders   # lists every unresolved item, exits 1 while any remain
npm run build:launch         # runs the gate, then builds
```

The gate also fails while any flag in `decisionsConfirmed` (`src/content/site.ts`) is `false`: publish the Review price, line-art style. Set each to `true` once Grant has confirmed the choice.

Normal builds (and CI) allow placeholders so the site can be previewed. **Use `npm run build:launch` as the Cloudflare build command for the real launch** (see below) so a build with unresolved placeholders cannot go live.

### Scheduler and analytics are still placeholders

The contact page shows a disabled "Pick a time" button, clearly marked, and every "Book a free call" button points at `/contact#book` until `schedulerUrl` is set in `src/content/providers.ts`. If the scheduler is embedded in an iframe, add its origin to `frame-src` in `public/_headers`. Analytics is Cloudflare Web Analytics, which is cookieless: its two origins are in the CSP and the privacy page says so. Turn it on in the Cloudflare dashboard (nothing is added to the site's code).

## Contact form

The form on `/contact` (`src/components/hl/ContactForm.tsx`) posts JSON to `POST /api/contact`, handled by a small Worker script, `worker/contact.ts`. `wrangler.jsonc` runs the Worker **only for `/api/*`** (`run_worker_first`); every page and file is still the static export in `./out`.

**What one submission does**, in order: same-origin check, JSON only, at most 16 KB; rate limit (5 per minute per IP, the `CONTACT_RATE_LIMIT` binding); spam-trap field (`company_fax`, refused with an honest error); the same validation as the form (`src/lib/contact-validation.ts`); Cloudflare Turnstile verified server-side (hostname and `action: "contact"` must match). Then it appends a row to Grant's Google Sheet, emails the submission to grant@hustonlogic.com (Reply-To = the visitor) with a line saying whether the Sheet row was saved, and sends the visitor the B7b automatic reply. The notification is **plain text only**, through Resend, from `Huston Logic <grant@hustonlogic.com>`. The automatic reply is multipart (HTML + plain text, same words) from `Grant Huston <grant@hustonlogic.com>`, with `Auto-Submitted: auto-replied` and `X-Auto-Response-Suppress: All` headers. The Sheet is written with `valueInputOption=RAW`, and cells starting with `= + - @` get a leading `'`.

**What the visitor sees.** Success only when the note reached Grant (the Sheet row or the email). Then the form saves the first name and whether the automatic reply went out in `sessionStorage` (never the URL) and moves to `/contact/thanks`, which says "Got it, thanks {name}." If the automatic reply failed, the thanks page says so. Every failure keeps the visitor's answers and shows one of the three B7 send errors. Without JavaScript nothing is sent.

| Sheet | Email to Grant | Result |
|---|---|---|
| saved | sent | Success. |
| failed | sent | Success. The email says "Sheet: NOT saved - add this one by hand". |
| saved | failed | Success (the row is real), logged as `notify_failed_sheet_saved`. Covered by the weekly Sheet check below. |
| failed | failed | Error "Something broke on my end…", and no automatic reply. |

**Weekly check:** once a week, open the Sheet's `Submissions` tab and make sure every row has had a reply. A row with no email in the inbox means the notification failed.

**Modes** (`SITE_ENV`, from `wrangler.jsonc`):
- `production`: the live site.
- `preview`: branch previews (Cloudflare Worker Previews). Rows go to the Sheet's `Preview` tab, every subject starts with `[Preview]`, and the automatic reply goes to grant@hustonlogic.com instead of the visitor (its subject names who it would have gone to). Any `*.workers.dev` host other than `huston-site.<account>.workers.dev` is treated as a preview even if `SITE_ENV` says production.
- `development`: `wrangler dev` on localhost only. Turnstile is checked with Cloudflare's test keys, then nothing is emailed or written.

**Turnstile errors.** "That didn't go through" (403) means the visitor's check failed (logged as `turnstile_failed` with a `reason`: `not_success`, `hostname_mismatch` or `action_mismatch`, plus Cloudflare's error codes). A missing `TURNSTILE_SECRET_KEY`, a secret Cloudflare refuses, or an unreachable siteverify is our fault, so it is "Something broke on my end…" (502), logged as `turnstile_config_missing` or `turnstile_unavailable`.

**Logs:** Workers Logs is on, invocation logs are off. The Worker logs fixed event names, status codes and Cloudflare's fixed error codes only (for example `sheet_append_failed` with `status=403`), never names, emails, messages, IP addresses or keys.

### Secrets

Four Worker secrets, set by Grant in his own Terminal from the repo folder, never in the repo, chat or logs. `wrangler.jsonc` lists their names (`secrets.required`), and a deploy fails while one is missing. Each command asks for the value with hidden input.

| Name | Value |
|---|---|
| `RESEND_API_KEY` | Resend API key, "Sending access" for hustonlogic.com only |
| `TURNSTILE_SECRET_KEY` | The Turnstile widget's secret key |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | The whole service-account JSON key file |
| `GOOGLE_SHEET_ID` | The Sheet ID (between `/d/` and `/edit` in its URL) |

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY < path/to/key.json
npx wrangler secret put GOOGLE_SHEET_ID
```

Previews do not share production secrets. Set the same four for all previews with `npx wrangler preview base-config secret put <NAME>` (same values). A preview copies the base secrets **when it is created**, so set them before pushing a branch; later changes don't reach existing previews. To fix an existing preview, also set the secret on it: `npx wrangler preview secret put <NAME> --name <branch-name>` (this creates a new deployment of that preview). Names only, never values: `npx wrangler secret list` (production), `npx wrangler preview base-config secret list` (new previews), `npx wrangler preview secret list --name <branch-name>` (one preview). Each `secret put` creates a new production version (a row in Deployments). If it fails with "latest version of your Worker isn't currently deployed", use the dashboard instead: Workers & Pages, huston-site, Settings, Variables and Secrets.

### Accounts and DNS

- **Turnstile:** Cloudflare dashboard, Turnstile, widget `huston-site contact`, Managed mode. Hostnames: `hustonlogic.com` (covers its subdomains) and the account's `<account>.workers.dev` (meant to cover the production and preview workers.dev hosts, which are its subdomains; Cloudflare's docs don't mention workers.dev, so the first preview test confirms it, and error 110200 there means it doesn't). The site key goes in `src/content/providers.ts`; the secret key is the Worker secret.
- **Resend:** domain `hustonlogic.com`, set up by Resend with its Forge records (as added on 2026-11-15). They sit on their own names, so they never touch Google Workspace's. All "DNS only". Open and click tracking stay off.

  | Type | Name | Content |
  |---|---|---|
  | TXT | `resend._domainkey` | DKIM key (value from Resend) |
  | CNAME | `send` | `send.forge.rmta.net` |
  | CNAME | `rsend` | `rsend.forge.rmta.net` |

  There is **no MX and no SPF TXT on `send`**: a CNAME can't share its name with other records, and Resend serves the bounce (Return-Path) records through the CNAME target. Don't add any.
- **Google Workspace** owns mail for the root domain (grant@ must be a Workspace mailbox or alias): root MX, the root SPF `v=spf1 include:_spf.google.com ~all` (the only SPF record on the root; **never add Resend to it**) and DKIM at `google._domainkey`. DMARC (`_dmarc`) passes for Resend mail through the aligned DKIM signature on `hustonlogic.com`, and SPF passes on `send.hustonlogic.com` (aligned under relaxed alignment).
- **Google Sheet** `Huston Logic contact form`, tabs `Submissions` and `Preview`, header row `Received (UTC) | Need | Topic | Name | Email | Business | Message | Tools | Website | Source | Mode`, shared as Editor with the service account only. Google Cloud project `huston-logic-site`, Google Sheets API enabled, service account `contact-form-writer` with no project roles. The Worker signs the service-account JWT with Web Crypto (no library).

### Local test of the Worker

```bash
npm run build
npx wrangler dev --port 4823 --ip localhost --var SITE_ENV:development --var TURNSTILE_SECRET_KEY:1x0000000000000000000000000000000AA --var RESEND_API_KEY:x --var GOOGLE_SERVICE_ACCOUNT_KEY:x --var GOOGLE_SHEET_ID:x
```

This serves the built site and the Worker at http://localhost:4823 in development mode (also in `.claude/launch.json` as `worker`). On localhost the form uses Cloudflare's always-pass test site key. To see the "couldn't verify" error, use the always-fail secret `2x0000000000000000000000000000000AA`. These are Cloudflare's published test values, not secrets. A local `.dev.vars` file would also work and is git-ignored, but never put real keys in it.

## Deploy to Cloudflare Workers

Merging a pull request into `main` deploys the site automatically through Cloudflare Workers Builds. Other branches get preview URLs (Cloudflare Worker Previews, configured by the `previews` block in `wrangler.jsonc`). Never run `wrangler deploy` by hand. The Worker config is `wrangler.jsonc`: static assets from `./out`, plus the contact form Worker (`worker/contact.ts`), which wrangler bundles at deploy time. The build and deploy commands did not change when the Worker was added.

Current settings in the Cloudflare dashboard (read by the owner on 2026-11-12, so check them if they may have changed):

- **Production branch:** `main`
- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy` (run automatically by Workers Builds)
- **Root directory:** `/`
- **Build variables:** `NODE_VERSION=22` is the only one set.

Before launch:

1. Add the build variable `NEXT_PUBLIC_SITE_URL=https://<final domain>`. It is **not set yet**, so canonical URLs, Open Graph, sitemap, robots and JSON-LD use the default in `src/content/site.ts`.
2. Change the production build command to `npm run build:launch` so a build with unresolved placeholders cannot go live.
3. Add the custom domain, then confirm DNS, HTTPS and (for email) SPF, DKIM and DMARC.

`public/_headers` is copied into `out/` and applied by Workers static assets (not to Worker responses). It also adds `X-Robots-Tag: noindex` to `*.workers.dev` (and `*.pages.dev`) URLs so preview hostnames stay out of search results.

`output: "export"` means there is no Node server at runtime. The only server code is the contact Worker on `/api/*`.

## Monitoring

- **Site down or erroring:** an UptimeRobot Free monitor checks the production URL every 5 minutes and emails the owner when it gets an error response (anything other than 2xx or 3xx), a timeout or no answer. It only sees the public HTTP response; no token or secret is involved.
- **Tested on 2026-11-13:** a temporary monitor pointed at a page that does not exist (a 404) went Down and sent the alert email, then was deleted. The production monitor was never broken on purpose.
- **Failed deploys have no alert.** Cloudflare has no email for a failed Workers Builds deploy; the documented route is a Queue plus a small Worker that posts to a Slack or Discord webhook. A failed production build leaves the previous version live, and the red "Workers Builds: huston-site" check on the merge commit is the only signal.
- **When the custom domain goes live:** edit the monitor's URL (three-dot menu, Edit) to `https://<final domain>/`, then re-run the test: add a temporary monitor on a page that does not exist, wait for the Down email, delete it.

## Rollback runbook

A rollback points the live site at an older version within about a minute. It changes nothing in Git: `main` still contains the bad commit, and the next merge to `main` redeploys `main`'s HEAD over the rollback. Use it when a deploy broke the live site and it must be fixed now.

**Roll back:** Cloudflare dashboard, Workers & Pages, `huston-site`, Deployments. Pick an older row that was a real production deployment (match its time to the merge time of the PR; never a preview). Three-dot menu, **Rollback**. Read the dialog, add a message, confirm. The Active deployment card switches to the older version (the move is recorded under View rollout history; the Deployments list itself does not gain a row).

**Roll forward:** on the newer row you rolled back from, the same menu item is labelled **Promote version**. Read the dialog and confirm.

**Check the live site after each move** (`curl -sI https://<site>/`): HTTP 200; the `etag` changes after a rollback and returns to its old value after rolling forward; the `/_next/static/chunks/...` files named in the page's HTML change and then return too. Practised on 2026-11-13 (rolled back from #35 to #25, then forward): both checks moved and returned exactly.

**The contact Worker and rollbacks.** A version holds its code, config and static files together, so a rollback moves the form and its Worker as one. Rolling back to a version from before the Worker (before PR 13) gives the old form that sends nothing, which is consistent. `curl -s -X GET https://<site>/api/contact` returns `{"error":"method_not_allowed"}` (405) while the Worker is live. Cloudflare's rollback docs don't say whether secret values roll back with a version, so never delete or rename a secret while older versions may still be needed. Each `wrangler secret put` adds a version to the Deployments list; keep picking rows by merge time.

**Do not click:** Delete (the Worker), Disconnect (breaks auto-deploys), Split versions (gradual deployment), Retry build, or any change to the build command, deploy command or production branch.

**Bad merge: recovery sequence**
1. Freeze: merge nothing else.
2. Roll back to the last good production version and check the live site.
3. Revert the bad merge on a new branch (`git revert -m 1 <merge-sha>`) and open a PR. Every lock applies (`check`, `a11y`, `lighthouse`, `dependency-review`, code scanning), so allow about 6 minutes; the rollback holds meanwhile.
4. The owner merges the revert. Workers Builds then deploys `main`'s HEAD (the revert), which replaces the rollback.
5. In Deployments, confirm a new Workers Builds deployment is Active and the live site is good. Then fix forward in a new PR.

If a production build itself fails, nothing is deployed and the old version stays live, so no rollback is needed.

## Launch checklist

- [ ] Domain, DNS and business email working; `NEXT_PUBLIC_SITE_URL` set to the final domain
- [ ] `email`, `schedulerUrl`, `linkedInUrl`, `turnstileSiteKey` set in `src/content/providers.ts`
- [ ] `npm run check:placeholders` passes (photos, screenshots, titles, location, background wording, musician line, certifications, privacy date)
- [ ] Contact form tested end to end on desktop and phone on the live domain: the email to grant@, the automatic reply (SPF, DKIM and DMARC all PASS in "Show original"), the Sheet row; then delete the test row
- [ ] Scheduler wired and its CSP origin added
- [ ] Privacy policy checked against the tools actually used
- [ ] Screenshots supplied with names blurred (or placeholders removed)
- [ ] Submit `sitemap.xml` to Google Search Console
- [ ] Decisions confirmed in `decisionsConfirmed`: Review price (default: none), geometric framework icons
- [ ] Framework wording matches everywhere: three steps (step zero is the call, not a fourth step), 20-minute call, reply within one business day, 14-day correction window, "5/5 handoff & training" and "3 of 3", 21 client accounts, Review fee credited toward the fix, the stop-point line on Home and Services
- [ ] Final claims check: no prices (unless the Review price is published), no "Uncarved Dream", no real client data in images, no "we/our team"

## Project structure

```
src/
  app/            routes, metadata files (sitemap, robots, icon, og.png)
  components/
    hl/           the v3 design: buttons, cards, doors, hero, steps, FAQ, contact form
    layout/       header, nav, badge turn, footer
    ui/           copy helpers (Text, Placeholder, JsonLd, InViewOnce, BookCallButton)
    illustrations/ framework step icons
  content/        typed copy and site settings (single source of truth)
  lib/            fonts, metadata, JSON-LD, routes and text-token helpers
scripts/          placeholder gate, static preview server
worker/           contact form Worker (POST /api/contact) and its tests
public/_headers   Cloudflare Workers security and cache headers (static files)
```
