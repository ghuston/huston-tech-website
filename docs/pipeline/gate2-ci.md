# Gate 2: CI, on GitHub

Everything here was read from the repo, from `gh api` against GitHub, or from the pull-request
history on 2026-11-15. Gate 2 is the set of GitHub Actions workflows plus the "Protect main"
ruleset that decides when a pull request may merge. Nothing merges without it, and no account can
bypass it.

Back to the [map](./README.md). Previous gate: [gate1-local.md](./gate1-local.md). Next gate:
[gate3-deploy-ops.md](./gate3-deploy-ops.md).

## The files

```
.github/
  workflows/
    ci.yml                   workflow "CI": jobs check, a11y, lighthouse  (required checks)
    codeql.yml               workflow "CodeQL": job codeql  (enforced by the code-scanning rule)
    dependency-review.yml    workflow "Dependency review": job dependency-review  (required check)
  dependabot.yml             weekly grouped updates, 7-day cooldown (covered in gate3-deploy-ops.md)
lighthouserc.cjs             Lighthouse CI config (pages from src/lib/routes.ts, median of 3, thresholds)
playwright.config.ts         Playwright config for the a11y suite (desktop and mobile projects, preview server)
tests/a11y/
  site.a11y.spec.ts          axe scan of every page, two passes, plus menu, FAQ, drift and staleness tests
  contact-form.spec.ts       the form against a stubbed Worker and a stubbed Turnstile
  known-issues.ts            allowed axe findings, one rule on one selector each (currently empty)
scripts/
  preview.mjs                static server for out/ that applies the /* block of public/_headers
  lighthouse-summary.mjs     writes the per-page score table to the GitHub job summary
src/lib/routes.ts            the single route list the sitemap, the a11y suite and Lighthouse all read
```

All four workflow jobs that gate the merge (`check`, `a11y`, `lighthouse`, `dependency-review`)
are tied to their **job names**. `CLAUDE.md` is explicit: never rename or remove them, never add a
`paths:` filter or a job-level `if:`, never put `[skip ci]` in a commit message, because a required
check that never reports leaves the PR stuck waiting. To change one, change the ruleset FIRST, then
the workflow. The same coupling applies to `codeql.yml`'s `languages` and `category`.

GitHub lists four active workflows for the repo (`gh api .../actions/workflows`): CI, CodeQL,
Dependency review, and the dynamic "Dependabot Updates". Dependabot alerts are enabled
(`GET /repos/.../vulnerability-alerts` returns 204). Code scanning default setup is
`not-configured`, which is what the advanced setup in `codeql.yml` requires.

## `.github/workflows/ci.yml` (verbatim)

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false

      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      # Contact form Worker tests (worker/*.test.ts): Node's built-in test runner, fetch mocked, no network.
      - name: Worker tests
        run: npm run test:worker

      - name: Build static export
        run: npm run build

      - name: Verify deploy artifacts
        run: |
          for f in out/index.html out/404.html out/sitemap.xml out/robots.txt out/_headers; do
            test -s "$f" || { echo "Missing build artifact: $f"; exit 1; }
          done

      - name: Report unresolved placeholders (informational until launch)
        run: npm run check:placeholders
        continue-on-error: true

  # Accessibility scan (Playwright + axe) of the built site. A required check in the "Protect main" ruleset
  # (required since 2026-11-13, after 5 clean runs and a deliberate-failure proof PR), so a red result blocks merge.
  # No `paths:` filter and no `if:`: a skipped required check would block merging, so this job must always run.
  a11y:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false

      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build static export
        run: npm run build

      - name: Install Chromium
        run: npx playwright install --with-deps chromium

      - name: Accessibility scan
        run: npm run test:a11y

      - name: Upload Playwright report (failures only)
        if: failure()
        uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
          if-no-files-found: ignore

  # Lighthouse CI audit of the built site (served by scripts/preview.mjs so public/_headers applies). A required
  # check in the "Protect main" ruleset (required since 2026-11-13, after 5 clean runs and a deliberate-failure proof
  # PR), so a red result blocks merge. No `paths:` filter and no `if:` on the job: a skipped required check would
  # block merging. The `if:` on the two report steps below keeps the reports on failure too.
  lighthouse:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false

      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build static export
        run: npm run build

      # Uses the Google Chrome preinstalled on ubuntu-latest; no browser is downloaded.
      - name: Lighthouse CI
        run: npm run test:lighthouse

      - name: Score summary
        if: ${{ !cancelled() }}
        run: node scripts/lighthouse-summary.mjs >> "$GITHUB_STEP_SUMMARY"

      - name: Upload Lighthouse reports
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
        with:
          name: lighthouse-reports
          path: .lighthouseci/
          # The folder name starts with a dot, and upload-artifact skips hidden files unless told otherwise.
          include-hidden-files: true
          retention-days: 14
          # warn, not ignore: a missing report folder (the run stopped early) should show as a warning, not a silent success.
          if-no-files-found: warn
```

Notes on what the file does and why (from the PR bodies of 15, 22, 24 and 51):

- **SHA pins.** Every action is a full 40-character commit SHA with the version as a comment, so a
  moved or tampered tag cannot change what runs. PR 15 did this and recorded the age of each pinned
  release (115 days for checkout v7.0.1, 35 days for setup-node v7.1.0). The rule since then is at
  least 7 days old when added.
- **`persist-credentials: false`** on every checkout, so the git token is not left in `.git/config`
  for later steps. Nothing in CI needs to push.
- **`permissions: contents: read`** at the top of every workflow (least privilege).
- **`concurrency`** cancels an older run of the same ref when a newer push arrives, which is why the
  run list shows some `cancelled` runs on PR branches. It never cancels a run on `main` (CodeQL
  makes this explicit; CI relies on the fact that pushes to `main` are merges).
- **Both `a11y` and `lighthouse` build the site themselves** rather than downloading `check`'s
  `out/` as an artifact, so each job stands alone.
- **The comments above say "required since 2026-11-13".** All three jobs became required on that date
  (see "Promotion" below). The YAML comments used to say "Informational for now ... NOT a required
  check", because the promotion changed only the ruleset and the workflow files are owner-only paths;
  they were corrected afterwards by the hand-edit procedure, and the text above is the corrected
  version.

## `.github/workflows/codeql.yml` (verbatim)

```yaml
name: CodeQL

# Scans our own JavaScript/TypeScript for security bugs (GitHub "advanced setup": this file, not default setup).
# JS/TS needs no build, so there is no setup-node, npm ci or autobuild step.
# Enforced through the "Require code scanning results" rule (tool: CodeQL) in the "Protect main" ruleset since
# 2026-11-13, not through a status check on this job: the job goes red only if the scan itself breaks, while the rule
# blocks the merge on new alerts of error severity (security severity high or higher) and while the scan is running.
# No `paths:` filter and no `if:` on the job. `branches:` is the GitHub-documented shape and is not a paths filter.
# Scheduled runs only happen on the default branch, and GitHub disables schedules in a public repo
# after 60 days without repository activity.

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: "17 4 * * 1" # Mondays 04:17 UTC

permissions:
  contents: read

concurrency:
  group: codeql-${{ github.ref }}
  # Only newer pull request runs replace older ones; never cancel a scan on main.
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  codeql:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    # A job-level block replaces the workflow-level one, so contents: read is repeated.
    permissions:
      contents: read
      # Required to upload the results to code scanning.
      security-events: write
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false

      - name: Initialize CodeQL
        uses: github/codeql-action/init@33d7b85da1a04171e211befe2c739303b9a4c066 # v4.39.3
        with:
          languages: javascript-typescript
          build-mode: none

      - name: Perform CodeQL analysis
        uses: github/codeql-action/analyze@33d7b85da1a04171e211befe2c739303b9a4c066 # v4.39.3
        with:
          category: "/language:javascript-typescript"
```

Notes (PR 23): `codeql-action` v4.39.3 is an annotated tag; the pinned value is the **commit** the
tag points to, not the tag object. `packages: read` and `actions: read` from GitHub's starter
template were left out (they matter only for private packs and private repos). The `actions`
language (scanning the workflow YAML itself) was deliberately left for a later PR and has not been
added. The code-scanning rule has been in the ruleset since 2026-11-13, and the header comment now
says so.

## `.github/workflows/dependency-review.yml` (verbatim)

```yaml
name: Dependency review

# Fails a pull request that adds or changes a dependency to a version with a known vulnerability.
# A required check in the "Protect main" ruleset (required since 2026-11-13, after 5 clean runs and a deliberate-failure
# proof PR), so a red result blocks merge. No `paths:` filter and no `if:`: a skipped
# required check would block merging, so this job must always run on pull requests.
# Pull requests only: the action compares the base and head revisions, so a push or schedule run has nothing to compare.

on:
  pull_request:

permissions:
  contents: read

concurrency:
  group: dependency-review-${{ github.ref }}
  cancel-in-progress: true

jobs:
  dependency-review:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false

      - name: Dependency review
        uses: actions/dependency-review-action@a1d282b36b6f3519aa1f3fc636f609c47dddb294 # v5.0.0
        with:
          # Any known vulnerability in a newly added or changed dependency (the action's default, made explicit).
          fail-on-severity: low
          # The default is runtime only. Nearly everything here is a dev dependency (ESLint, TypeScript,
          # Tailwind, Wrangler, Playwright) and still runs in CI, so check both.
          fail-on-scopes: runtime, development
```

It judges only what the PR changes, not what is already in `main`. It does not comment on the PR,
so it needs no write permission. A deliberate, understood exception goes in the workflow as
`allow-ghsas` with a written reason; never add one silently (README).

## `lighthouserc.cjs` (verbatim)

```js
// Lighthouse CI config (run with `npm run test:lighthouse`, after `npm run build`). LHCI reads .cjs, not .mjs or .ts.
// It audits the exported site in ./out, served by scripts/preview.mjs so the headers in public/_headers (CSP) apply.

// LHCI config files must be CommonJS. Node >= 22.18 loads the TypeScript route list natively; keep src/lib/routes.ts
// free of imports and TypeScript-only syntax so this keeps working.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { indexableRoutes } = require("./src/lib/routes.ts");

const origin = "http://localhost:4822";

module.exports = {
  ci: {
    collect: {
      // Indexable pages only: a noindex page cannot pass the SEO "is crawlable" audit and the 404 page returns an error status.
      url: indexableRoutes.map((route) => origin + route),
      numberOfRuns: 3,
      startServerCommand: "npm run preview",
      // preview.mjs prints "Previewing ./out at ..."; the default pattern ("listen|ready") would never match.
      startServerReadyPattern: "Previewing",
      startServerReadyTimeout: 20000,
      settings: {
        // Default preset is mobile. --no-sandbox: Chrome's sandbox can fail on CI runners (see the LHCI troubleshooting
        // guide); the runner is an ephemeral VM that only loads this site from localhost.
        chromeFlags: "--no-sandbox",
      },
    },
    assert: {
      // median of the 3 runs; LHCI's default ("optimistic") would pass if any single run passed.
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.95, aggregationMethod: "median" }],
        "categories:best-practices": ["error", { minScore: 0.9, aggregationMethod: "median" }],
        "categories:seo": ["error", { minScore: 0.95, aggregationMethod: "median" }],
        "categories:performance": ["error", { minScore: 0.9, aggregationMethod: "median" }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
```

Facts around it:

- **Pages.** `indexableRoutes` from `src/lib/routes.ts`: `/`, `/how-i-work`, `/services`,
  `/past-work`, `/about`, `/insights`, `/contact`, `/privacy` (eight today). `noindex` pages and the
  404 are left out on purpose.
- **Thresholds.** All four categories are `error` at the median of three runs, and
  `scripts/lighthouse-summary.mjs` reads the level from this file. The README used to say
  "performance only warns" (now corrected). PR 24 shipped
  performance as `warn`; commit `0fd29d3` in PR 49 (2026-11-15, "remove v1 leftovers, make v3 the
  only design") raised it to `error`.
- **Why the median.** PR 24: one local run of `/` scored 0.91 for performance while the other two
  scored 1.0. LHCI's default `optimistic` aggregation would pass if any single run passed.
- **Why `scripts/preview.mjs` and not LHCI's static server.** So `public/_headers`, including the
  CSP, applies during the audit; header problems then show up in CI, not only on Cloudflare.
  `preview.mjs` reads the `/*` block of `out/_headers` and sends those headers on every response.
- **Chrome.** The Google Chrome preinstalled on `ubuntu-latest`; no browser download. Locally it
  uses the installed Chrome or `CHROME_PATH`.
- **Reports.** `.lighthouseci/` (git-ignored) is uploaded as the `lighthouse-reports` artifact for
  14 days (about 65 MB uncompressed per run, zipped by the upload). The per-page score table in the
  run's Summary comes from `scripts/lighthouse-summary.mjs`, which marks a failing score with a red
  cross when the level is `error` and a warning sign when it is `warn`.
- **`basic-ftp` override.** `package.json` overrides `basic-ftp` to 6.2.6 because `@lhci/cli` 0.16.0
  bundles 5.3.1, which carried nine high denial-of-service advisories in an FTP parser Lighthouse
  never calls. Remove the override when Lighthouse CI ships a fix.
- **`NO_NAVSTART`.** A Lighthouse trace-recording hiccup, not a site problem. Use "Re-run failed
  jobs" on the run (`CLAUDE.md`, README).
- `engines.node` is `>=22.19` because `@lhci/cli` 0.16.0 needs it, and because `lighthouserc.cjs`
  `require()`s a `.ts` file, which Node strips types from natively from 22.18.

## The a11y suite

### `playwright.config.ts` (verbatim)

```ts
import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

// The accessibility check scans the exported site in ./out, served by scripts/preview.mjs
// (clean URLs, 404.html and the site-wide headers from public/_headers, including the CSP).
if (!existsSync("out/index.html")) {
  throw new Error("No build found. Run `npm run build` before `npm run test:a11y`.");
}

const baseURL = "http://localhost:4822";

export default defineConfig({
  testDir: "tests/a11y",
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  globalTimeout: 5 * 60 * 1000,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    // Animations end in the static design under reduced motion, so scans never catch a half-faded colour.
    reducedMotion: "reduce",
  },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1280, height: 720 } } },
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 375, height: 812 }, hasTouch: true } },
  ],
  webServer: {
    command: "npm run preview",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stderr: "pipe",
  },
});
```

### Design of `tests/a11y/site.a11y.spec.ts`

- **Rules.** axe tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` and `best-practice`
  (axe tags are not cumulative, so every level is listed; best-practice adds one `<h1>`, landmarks
  and heading order, which `AGENTS.md` already requires).
- **Pages.** `indexableRoutes` plus `noindexRoutes` (`/contact/thanks`) from `src/lib/routes.ts`,
  plus `/contact?topic=partner` (rendered differently) and `/this-page-does-not-exist` (must return
  404). The 404 status is asserted; every other page must return 200.
- **Two passes per page.** Once at the top of the page with every rule, and once scrolled to the
  bottom (two animation frames after `scrollTo`, so React has committed), because that is where the
  sticky header sits over the last section and the footer.
- **The only skipped rule.** `target-size`, only in the scrolled pass, only on `/services`, only in
  the `desktop` project. Reason recorded in the file with the date (2026-11-12): at maximum scroll
  the sticky header and sticky sub-nav cover the last CTA button, so axe reports it as partly
  obscured (279.2 px by 12.4 px visible, 24 px needed), while the same button passes every rule in
  the top-of-page pass. The comment says: "Do not widen this to other pages or rules."
- **Extra states.** `/services` with every FAQ `<details>` opened (a scrolled pass, same single
  exception) and the open mobile menu on `/` (mobile project only; asserts `aria-expanded="true"`).
- **`known-issues.ts`.** A list of `{ rule, selector, reason, since }` entries that silence one axe
  rule on one selector. It is **empty**. A test fails if an entry no longer matches anything, so
  stale entries get deleted. `AGENTS.md`: "Do not loosen a threshold or add a `known-issues.ts`
  entry just to get green."
- **Drift guard.** A desktop-only test walks `out/` for every `.html` (skipping `_next/`,
  `404.html` and `_not-found.html`), turns the paths into routes and fails if any built route is
  missing from `src/lib/routes.ts`, so a new page can never silently escape the scan (and the
  sitemap). Proof PR 28 tripped exactly this.
- **"Needs review" items** (axe `incomplete`) are printed to the log and never fail the run.
- **Report.** The Playwright HTML report is uploaded only on failure, kept 7 days.

### `tests/a11y/contact-form.spec.ts`

Runs against the same static preview. The Worker is not running there, so `page.route` answers
`**/api/contact` with a scripted status and body, and the Turnstile script from
`https://challenges.cloudflare.com/**` is replaced by a stub that hands back a token (and a new one
after `reset()`, like the real widget). Nothing leaves the machine. It checks: a valid note lands on
`/contact/thanks` with "Got it, thanks Ada." and nothing personal in the URL, and the JSON sent
matches (`need`, `name`, `email`, an empty `company_fax`, `turnstileToken`); an `autoReply: false`
answer shows the "automatic reply failed" text; a 502 keeps the answers and shows the `failed`
message in a `role="status"` region; 429 and 403 show their own messages; an empty submit shows every
field error and sends nothing. Each state is also axe-scanned. Field labels and messages come from
`src/content/contact.ts`, never retyped.

## The "Protect main" ruleset

Read with `gh api repos/ghuston/huston-tech-website/rulesets/27075919` on 2026-11-15. Nothing in it
is secret. The ruleset was created 2026-11-11 and last updated 2026-11-13 (Pacific).

```json
{
  "id": 27075919,
  "name": "Protect main",
  "target": "branch",
  "source_type": "Repository",
  "source": "ghuston/huston-tech-website",
  "enforcement": "active",
  "conditions": { "ref_name": { "exclude": [], "include": ["~DEFAULT_BRANCH"] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "required_reviewers": [],
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "require_extra_approval_for_unattributed_changes": true,
        "allowed_merge_methods": ["merge", "squash", "rebase"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "check", "integration_id": 15368 },
          { "context": "a11y", "integration_id": 15368 },
          { "context": "lighthouse", "integration_id": 15368 },
          { "context": "dependency-review", "integration_id": 15368 }
        ]
      }
    },
    {
      "type": "code_scanning",
      "parameters": {
        "code_scanning_tools": [
          { "tool": "CodeQL", "security_alerts_threshold": "high_or_higher", "alerts_threshold": "errors" }
        ]
      }
    }
  ],
  "bypass_actors": [],
  "current_user_can_bypass": "never",
  "created_at": "2026-11-11T14:49:39.064-08:00",
  "updated_at": "2026-11-13T14:56:15.492-08:00"
}
```

What each rule means in practice:

| Rule | Effect |
|---|---|
| `deletion` | The default branch cannot be deleted. |
| `non_fast_forward` | No force pushes to `main`. |
| `pull_request` | `main` changes only through a PR. Zero approvals required (one-person shop), so the owner merges their own PRs. Merge, squash and rebase all allowed. `require_extra_approval_for_unattributed_changes` is on (a GitHub default for new rulesets; **UNVERIFIED** whether it was chosen deliberately). |
| `required_status_checks` | The four contexts must report success. `integration_id` 15368 is GitHub Actions, so a check with the same name from another app would not count. `strict_required_status_checks_policy: false` means the branch does not have to be up to date with `main`. |
| `code_scanning` | Blocks the merge while a CodeQL alert of severity error, or security severity high or higher, is open on the PR, and also while the scan is still running or not set up. Lower severities do not block. There is no "Required" badge; the merge box says "CodeQL has detected N security relevant alert(s) blocking this code from being merged". |
| `bypass_actors: []` | Nobody, including the owner, can bypass. `current_user_can_bypass: never`. |

Repo-level merge settings (`gh api repos/...`): `allow_auto_merge: true`, `allow_merge_commit`,
`allow_squash_merge` and `allow_rebase_merge` all true, `delete_branch_on_merge: false`. Auto-merge
is something the owner may turn on per PR; the `guard-bash` hook blocks the agent from enabling it
through `gh api` (`enablePullRequestAutoMerge`).

## Promotion: how a check becomes required

The rule, from `CLAUDE.md`: "A new check becomes required only after 5 clean runs plus a
deliberate-failure proof PR." The history shows how it was applied:

| Check | Added informational | Clean-run tally recorded | Proof PR | Required since |
|---|---|---|---|---|
| `check` | PR 1 era (`7a53b98`, 2026-11-10) | the only required check in the first ruleset (2026-11-11) | #26 | 2026-11-11 |
| `a11y` | PR 22 (2026-11-13), "Clean-run tally: 0 of 5" | PR 30 (2026-11-13) | #28 | 2026-11-13 |
| `lighthouse` | PR 24 (2026-11-13), "Clean-run tally: 0 of 5" | PR 30 | #29 | 2026-11-13 |
| `dependency-review` | PR 23 (2026-11-13), "0 of 5" | PR 30 "4 of 5", PR 33 required | #31 | 2026-11-13 |
| code scanning (CodeQL) | PR 23 (2026-11-13), "0 of 5" | PR 30 "4 of 5", PR 33 required | #32 | 2026-11-13 |

PR 22 stated the counting rule for `a11y`: "5 consecutive clean runs on separate PR or `main`
runs, including at least one PR that changes the UI." Proof PRs were excluded from the tally (PR 30).

Each proof PR follows the same recipe: a throwaway branch named `proof/<check>`, a title starting
`PROOF - DO NOT MERGE:`, a body that says what was broken on purpose and which check must go red,
Auto-fix off, and a close with `gh pr close --delete-branch` once the red check and the blocked merge
button were seen. None was ever merged (all five show `state: CLOSED`, `mergedAt: null`).

### Proof-PR recipes

| PR | Branch | What it broke | What went red |
|---|---|---|---|
| #26 "check must go red" | `proof/check-lint` | Added `src/lib/proof-lint.ts` with `export const proofValue: any = 1;` (breaks `@typescript-eslint/no-explicit-any`). The commit had to be made **through the GitHub API** because the local pre-commit hook correctly refuses to commit code that fails `npm run check`. | `check` at the Lint step; `a11y` and `lighthouse` stayed green because they only build |
| #28 "a11y contrast and route drift" | `proof/a11y-contrast` | Lowered `--color-muted` to `#afafaf` (about 2:1 contrast) and added a `/drift-proof` page not listed in `src/lib/routes.ts` | `a11y`: colour-contrast violations and the drift-guard test |
| #29 "lighthouse missing meta description" | `proof/lighthouse-seo` | `pageMetadata()` stopped returning a top-level `description`, so no page had a meta description | `lighthouse`: SEO below 0.95 |
| #31 "dependency-review known-vulnerable package" | `proof/dependency-review` | Added `minimist` 1.2.5 (GHSA-xvch-5gv4-984h, critical, prototype pollution; patched in 1.2.6) as an exact-pinned devDependency; `npm run check` still passed | `dependency-review` |
| #32 "codeql code-injection alert" | `proof/codeql-alert` | Added `src/lib/proof-unsafe.ts` (imported nowhere) passing `window.location.hash` straight into `eval`; `npm run check` still passed | "Code scanning results / CodeQL" and the merge box message |

PR 31 also surfaced the npm mismatch (see below): its lockfile picked up "unrelated npm-version
churn" because the Mac's npm 11 wrote it while CI used npm 10.

## Lockfile and npm version (a Gate 2 failure mode)

From PR 34 and `CLAUDE.md`: a lockfile written by a different npm major than CI's can fail CI's
`npm ci` even when a local `npm ci` passes. CI uses npm 10 (10.9.9 on Node 22, read from a CI log on
2026-11-13); Cloudflare's build image had npm 10.9.2; this Mac had npm 11.8.0. The fix:

- `.npmrc` contains `engine-strict=true`.
- `package.json` has `"engines": { "node": ">=22.19", "npm": ">=10.9.2 <11" }`.
- So `npm install` and `npm ci` refuse to run under npm 11; use `npx --yes npm@10.9.9 ci` (or
  `install`). `npm run ...` scripts are unaffected.
- Generate lockfile changes with the same npm major as CI, and check the first CI run's Install
  dependencies step.

## Stale text that was found and corrected (history)

Found while writing this handbook on 2026-11-15 and fixed in the same PR (the three workflow files
through the hand-edit procedure in
[gate1-local.md](./gate1-local.md#changing-an-owner-only-file-the-hand-edit-procedure)):

- The "Informational for now ... NOT a required check" comments in all three workflow files.
- README "Lighthouse CI" said "performance only warns"; `lighthouserc.cjs` has had performance at
  `error` since PR 49.
- README "Lighthouse CI" said "the seven pages in `src/lib/routes.ts`"; the list has had eight
  indexable routes since `/how-i-work` was added in PR 43.
