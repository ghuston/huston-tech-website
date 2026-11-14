# Huston Tech website

Marketing site for **Huston Tech**, a one-person business systems consultancy run by Grant Huston. Built with Next.js (App Router), strict TypeScript and Tailwind CSS, exported as a fully static site for **Cloudflare Workers**.

Permanent architecture, security and content rules are in [`AGENTS.md`](./AGENTS.md). Read it before making changes.

## Pages

| Route | Page |
|---|---|
| `/` | Home |
| `/services` | Services (Start here, Common fixes, Systems work, FAQ) |
| `/past-work` | Past Work and testimonials |
| `/about` | About Grant |
| `/insights` | Insights (polished "coming soon" placeholder in V1) |
| `/contact` | Scheduler and contact form placeholders (`?topic=partner` shows the Zoho partner variant) |
| `/contact/thanks` | Form confirmation (noindex, not linked until a form provider exists) |
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
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # static export to ./out
npm run check       # lint + typecheck + build
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

`playwright.config.ts` starts `npm run preview` (port 4822) and scans the built site in Chromium at desktop (1280 px) and phone (375 px) width, with `prefers-reduced-motion` set. Each page is checked against axe's WCAG 2.0/2.1/2.2 level A and AA rules plus axe's best-practice rules, twice: once at the top of the page (every rule) and once scrolled to the bottom, where the mobile call bar appears and the sticky header sits over dark sections. It also scans `/services` with every FAQ open and the opened mobile menu.

One rule is skipped, in one place: `target-size` in the scrolled pass on `/services` at desktop width (added 2026-11-12). At maximum scroll the sticky header and sub-nav cover the last CTA button, so axe reports it as partly obscured, although scrolling up uncovers it. The same button is checked by every rule in the top-of-page pass. The skip and its reason are in a comment in `tests/a11y/site.a11y.spec.ts`; do not widen it. The page list comes from `src/lib/routes.ts`, the same list the sitemap uses, and a test fails if a built page is missing from it.

Automated checks find only part of the accessibility problems. Keyboard, screen reader, zoom and wording checks are still manual.

A genuine false positive may be recorded in `tests/a11y/known-issues.ts` (one rule on one selector, with a written reason). Never add an entry just to get green.

In CI this is the `a11y` job in `.github/workflows/ci.yml`. It is a required check in the "Protect main" ruleset, so a red result blocks merge. On a failure the Playwright HTML report is uploaded as the `playwright-report` artifact (kept 7 days).

### Lighthouse CI

```bash
npm run build
npm run test:lighthouse
```

`npm run build && npm run test:lighthouse` audits the built site with Lighthouse CI (mobile preset, median of 3 runs per page) against the seven pages in `src/lib/routes.ts` (indexable routes only: a `noindex` page cannot pass the SEO check, and the 404 page returns an error status). It serves `out/` through `scripts/preview.mjs`, so the headers in `public/_headers` apply, and uses the Google Chrome installed on your machine (or `CHROME_PATH`). Reports are written to `.lighthouseci/` (git-ignored). Accessibility and SEO must score 0.95 or higher and best-practices 0.9 or higher; performance only warns. The preview server does not compress files or set cache headers the way Cloudflare does, so its performance score understates the deployed site.

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
| Site URL | `NEXT_PUBLIC_SITE_URL` (see `.env.example`), default `https://hustontech.com` in `src/content/site.ts` | Used for canonical URLs, Open Graph, sitemap, robots and JSON-LD. Public value, not a secret. |
| Contact email, scheduler URL, LinkedIn URL | `src/content/site.ts` | `null` renders a visible placeholder. |
| Framework step names, numbers, one-liners | `framework.steps` in `src/content/site.ts` | The only place "Find it / Fix it / Flick it" is defined. Content strings use `{find}`, `{fix}`, `{flick}`, `{steps}` tokens via `fw()` (`src/lib/framework.ts`). Rename a step here and every page follows. |
| Review price | `siteConfig.reviewPrice` in `src/content/site.ts` | `null` (default) keeps all prices out of the copy. A value such as `"$500"` switches the Review bar and the Services "Find it" stop-point to their with-price wording. Also update the FAQ cost answer if you publish it. |
| Hero option | `siteConfig.heroOption` in `src/content/site.ts` | `"A"` (recommended), `"B"`, `"C"` or `"D"` from the spec. Option B restores "Sound familiar?" as the problems heading. |

## Motion

Animation is CSS only (no library), driven by shared tokens in `src/app/globals.css` and rules in `src/app/motion.css`: one ease-out curve and four durations (150ms feedback, 200ms panels, 350ms intros, 400ms illustration steps). Headlines fade in with an 8px rise, button and link arrows nudge 3px on hover and keyboard focus, the mobile menu and FAQ share one open/close transition, and the homepage process diagram plays once when it scrolls into view. With `prefers-reduced-motion: reduce`, or with JavaScript off, the final static design shows immediately. See "Motion rules" in `AGENTS.md` before adding any.

## Placeholders and launch gate

Anything only Grant can supply is written as `[[double brackets]]` in `src/content/*` and renders as a highlighted marker on the page. Provider-dependent values (`email`, `schedulerUrl`, `linkedInUrl`) are `null` in `src/content/site.ts`.

```bash
npm run check:placeholders   # lists every unresolved item, exits 1 while any remain
npm run build:launch         # runs the gate, then builds
```

The gate also fails while any flag in `decisionsConfirmed` (`src/content/site.ts`) is `false`: hero option, publish the Review price, step 3 name, line-art style. Set each to `true` once Grant has confirmed the choice.

Normal builds (and CI) allow placeholders so the site can be previewed. **Use `npm run build:launch` as the Cloudflare build command for the real launch** (see below) so a build with unresolved placeholders cannot go live.

### Contact and scheduling are placeholders

There is intentionally **no working form and no scheduler**. `ContactFormPlaceholder` renders disabled fields (not a `<form>`, no handler) and `SchedulerPanel` renders a disabled button, both clearly marked. Every "Book a free call" button points at `/contact#book` until `siteConfig.schedulerUrl` is set, then points at the scheduler.

To wire real providers later:

1. **Scheduler** (Zoho Bookings, Calendly, Cal.com): set `schedulerUrl` in `src/content/site.ts`. If embedding in an iframe, add the provider origin to `frame-src` in `public/_headers`.
2. **Form**: choose a provider (for example a Cloudflare Worker with Turnstile plus an email service, or a hosted form service). Replace `ContactFormPlaceholder` with a real `<form>`, add the provider origin to `connect-src`/`form-action`/`script-src` as needed, add spam protection, and make `/contact/thanks` the redirect target.
3. **Email and LinkedIn**: set `email` and `linkedInUrl` in `site.ts`.
4. **Analytics**: none is installed. The privacy copy mentions privacy-friendly analytics, so either add a cookieless tool (and its CSP origin) or edit the privacy text.

## Deploy to Cloudflare Workers

Merging a pull request into `main` deploys the site automatically through Cloudflare Workers Builds. Other branches get preview URLs. Never run `wrangler deploy` by hand. The Worker config is `wrangler.jsonc` (static assets from `./out`).

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

`public/_headers` is copied into `out/` and applied by Workers static assets. It also adds `X-Robots-Tag: noindex` to `*.workers.dev` (and `*.pages.dev`) URLs so preview hostnames stay out of search results.

`output: "export"` means there is no Node server at runtime.

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
- [ ] `email`, `schedulerUrl`, `linkedInUrl` set in `src/content/site.ts`
- [ ] `npm run check:placeholders` passes (photos, screenshots, titles, location, background wording, musician line, certifications, privacy date)
- [ ] Real contact form and scheduler wired, tested end to end on desktop and phone, CSP updated
- [ ] Privacy policy checked against the tools actually used
- [ ] Screenshots supplied with names blurred (or placeholders removed)
- [ ] Submit `sitemap.xml` to Google Search Console
- [ ] Decisions confirmed in `decisionsConfirmed`: hero option, Review price (default: none), step 3 name, geometric framework icons
- [ ] Framework wording matches everywhere: three steps (step zero is the call, not a fourth step), 20-minute call, reply within one business day, 14-day correction window, "5/5 handoff & training" and "3 of 3", 21 client accounts, Review fee credited toward the fix, the stop-point line on Home and Services
- [ ] Final claims check: no prices (unless the Review price is published), no "Uncarved Dream", no real client data in images, no "we/our team"

## Project structure

```
src/
  app/            routes, metadata files (sitemap, robots, icon, og.png)
  components/
    ui/           buttons, cards, chips, FAQ, testimonial, placeholders
    sections/     case study and phase strip, Review bar, scheduler and contact-form placeholders
    layout/       header, nav, footer, mobile CTA bar
    illustrations/ decorative SVG (hero board, framework icons and connectors)
  content/        typed copy and site settings (single source of truth)
  lib/            metadata, JSON-LD and text-token helpers
scripts/          placeholder gate, static preview server
public/_headers   Cloudflare Workers security and cache headers
```
