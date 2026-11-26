# Website process

This file follows huston-logic/site-template docs/PROCESS.md as of 8c49fcd. Change the template first, then port.

How sites are built from this template: the one home for the build rules. Each rule says what, why, who decided and
what enforces it. `npm run check:process` fails if a rule has no "Why" or this file loses "Where facts live".

## Where facts live

- This repo, `huston-logic/site-template`, owns the website build rules (this file, `docs/PROCESS.md`), its status (`docs/STATUS.md`) and the handbook (`docs/pipeline/`, the technical reference).
- Blocks and what a client can change: `docs/BLOCKS.md` (generated from the block registry) and `docs/EDITING-LANES.md`.
- Client site repos follow these rules. Change them here first, then port them to the client repos.
- Business facts (offers, prices, priorities, clients, feature order) live in the Google Doc "00 Huston Logic: Source of Truth" and the "09 Feature Requests" doc. Find them there and do not copy them into this repo. No links to them are recorded here, so the docs are named only.

## Rules

### 1. Design first

- **What:** The home page and one inner page are mocked up and approved by link in the planning chat before any build starts. A build starts only when `incoming/` holds the approved design reference and the copy deck.
- **Why:** Feedback comes in minutes, not hours.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** Convention (no automatic check): a build plan's first step is to check that `incoming/` holds both files.

### 2. A new site is one sprint

- **What:** One branch, one PR. Tasks are commits.
- **Why:** The first client build (Nov 23 to 24) ran 12 tasks as 12 PRs in sequence and spent hours waiting on CI.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** CLAUDE.md, "Autonomous runs" (convention).

### 3. Live preview while building

- **What:** Start `npm run dev` at the start of a build and leave it running (http://localhost:4821). Push after each page so the Cloudflare preview updates. Cloudflare Workers Builds is connected before the build starts (an owner step).
- **Why:** Grant can see pages while they are built, instead of after about 15 hours.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** Convention (no automatic check). The Workers Builds connection is on the client onboarding checklist (`docs/pipeline/client-onboarding-checklist.md`).

### 4. Fast check on every commit, full check before the PR

- **What:** `npm run check:fast` (everything in `check` except the production build) runs on every commit. `npm run check` (the fast check plus the build) runs once before the PR opens.
- **Why:** The pre-commit hook ran the full check, including the production build, on every commit.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** The pre-commit hook (today it runs the full check; the owner batch installs the `check:fast` version), the pre-push hook in the same batch (full `npm run check` before `git push` and `gh pr create`), and `check:process` rule 7, which the batch switches on.

### 5. One review at the end, not one per task

- **What:** The review agents (review-code, review-a11y and review-security) run once each on the whole branch. Then a design critique runs from screenshots at 1440 and 390 pixels wide (the design:design-critique skill if it is installed, otherwise human-touch-design in audit mode). Fix what they find before the PR opens.
- **Why:** Each of the 12 PRs in the first client build was reviewed about three times.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** CLAUDE.md, "Autonomous runs" (convention).

### 6. One feedback round

- **What:** Grant gives feedback once, from the preview link. Every fix is batched into one PR.
- **Why:** One round of fixes costs one CI wait, not one per fix.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** Convention (no automatic check).

### 7. After launch, every change is its own PR

- **What:** From launch on, each change is its own PR with all required checks. Client change requests use `change/` branches with the scope check (`docs/CHANGE-SCOPE.md`).
- **Why:** After launch, every merge deploys to the live site.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** The "Protect main" ruleset's required checks and `npm run check:scope`.

### 8. Model routing

- **What:** Process and tooling runs: Opus plans and does one final review, a Sonnet subagent implements, and a Haiku subagent reads, searches, summarizes and writes docs. Site builds: one Sonnet session builds the whole site inline (superpowers:executing-plans), with no implementer or reviewer per task. Haiku is used for reading and docs. Each subagent gets only the files it needs. Every agent file sets its own `model:`.
- **Why:** The expensive model goes where judgment matters. Reading and docs do not need it.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** `npm run check:process` (every `.claude/agents/*.md` has `model:`); CLAUDE.md.

### 9. Context caps

- **What:** `docs/STATUS.md` shows only the current state, Needs Grant, For the master and the last run, and is at most 150 lines. Older history moves to `docs/history/STATUS-history.md` unchanged. Plans are at most 150 lines. Agents read `docs/pipeline/` only for a task about hooks, CI or deploy.
- **Why:** Long files cost tokens on every run and bury the current state.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** `npm run check:process` (STATUS.md and newest plan line caps). The `docs/pipeline/` rule is written into CLAUDE.md and the `scout` and `docs-writer` agent files (owner batch); no automatic check.

### 10. "For the master" holds decisions only

- **What:** The "For the master" section of STATUS.md holds only changes to scope, product or a business decision: one plain line each, no PR numbers, at most 12 lines.
- **Why:** The master doc copies these lines. PR numbers and build detail mean nothing there.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** `npm run check:process`.

### 11. Every run ends with a timing table

- **What:** The last-run section of STATUS.md ends with a table: wall-clock time, number of commits, time in checks, and time waiting on CI.
- **Why:** Without numbers, nobody can tell whether a process change made runs faster.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** CLAUDE.md, "Autonomous runs" (convention).

### 12. Lighthouse runs 3 times per page

- **What:** `lighthouserc.cjs` sets `numberOfRuns: 3` (it was 5). Every threshold and assertion is unchanged and still uses the median.
- **Why:** Two fewer runs per page cut CI time. The median of 3 still smooths out one bad run.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** `lighthouserc.cjs`; the required `lighthouse` check.

### 13. Hosting

- **What:** Huston Logic hosts every client site in its own Cloudflare account, from a repo in the `huston-logic` GitHub org. The client's domain registration and mailboxes stay in the client's name, and their data stays theirs: the client keeps only the registrar and email logins. The domain's nameservers point at a zone in Huston Logic's Cloudflare account; Resend, Turnstile and uptime monitoring are Huston Logic's accounts too. On request Huston Logic offboards the client: code and hosting move to the client's own GitHub and Cloudflare, and Huston Logic's liability ends at handover. The steps are in `docs/OFFBOARDING.md` (not yet rehearsed). The hosting fee is a business fact and lives in the master doc, not here.
- **Why:** Owners want it handled for them. Hosting costs Huston Logic about $25 a month in total (Cloudflare Workers Paid $5, Resend Pro $20) whatever the number of clients. One Cloudflare account also fits Cloudflare's rule that a GitHub account points to only one Cloudflare account.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** `docs/LAUNCH-CHECKLIST.md` section A and `docs/pipeline/client-onboarding-checklist.md` (convention, no automatic check).

### 14. Every site has its own rate-limit ids

- **What:** Each site sets its own rate-limit namespace ids: the contact pair (`contact.rateLimitIds` in `site.config.ts`), plus one for the site editor (`editor.rateLimitId`), taken from the register in `docs/HOSTING.md`. New sites start at 2001. The register is updated in the same PR that gives a site its ids.
- **Why:** Rate-limit bindings with the same `namespace_id` in one Cloudflare account share their counters, even across Workers (Cloudflare docs, "Rate Limiting" binding). Two sites on the same ids would count each other's visitors.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** `npm run check:config` fails if the ids are missing or not numbers, if the two ids match, or if a configured site (a real `domain.workerName`) still uses the template's 1001 or 1002. The register itself is convention.

### 15. Form contacts go where the owner already looks

- **What:** On this site a form contact is saved by the contact Worker (`worker/contact.ts`, `worker/intake.ts`): into Grant's Pipeline app when `INTAKE_SECRET` is set, into the Google Sheet as the fallback (while `INTAKE_SECRET` is unset or the app fails), and the notification email to Grant is always sent. The visitor sees success only if the contact reached Grant somewhere: the app, the Sheet or the notification email. The template's `contact.destination` switch (`"pipeline"` or `"sheet"`, and a third destination for another tool a client names) is not used for the contact form here; this site keeps its own routing. For a client site built from the template the rule is: the client's Pipeline app copy if they use it, otherwise another tool they name (not built), and the Sheet only as the fallback, with the notification email always going to the client's inbox.
- **Why:** The owner works from their Pipeline app, so a contact should land where they already look. The Sheet stays as the fallback because it needs no other product.
- **Decided:** Grant, 2026-11-24
- **Enforced by:** The Worker tests (`npm run test:worker`) and `wrangler.jsonc`'s secret names (`INTAKE_SECRET` is added to `secrets.required` only when Grant says so). The `check:config` destination rules apply to template client sites, not to this form.

### 16. A new block passes the block gate

- **What:** A block joins the library (or a site's own `src/site-blocks/`) only with: its registry entry (the definition: description, fields with their limits, variants, placement and motion); an example that passes the content check; a place in the showcase (`/blocks`, added automatically from the registry); passing `npm run check:design` (tokens and motion) and `npm run check:content`; and a design critique from screenshots of the showcase at 1440 and 390 pixels wide.
- **Why:** A client builds pages from these blocks by chatting, and nobody reviews each client page. So every block must look designed on its own, at both widths, with any content inside its limits.
- **Decided:** Grant, 2026-11-25
- **Enforced by:** `npm run check:content` (registry, example, catalog), `npm run check:design` (tokens and motion), the `a11y` and `lighthouse` jobs (they cover the showcase), and the design critique (convention, no automatic check).

### 17. The Lighthouse test server compresses like Cloudflare

- **What:** `scripts/preview.mjs`, the server the `lighthouse` and `a11y` jobs audit, gzips html, css, js, json, txt, xml and svg files when the browser accepts gzip, as Cloudflare does on the live site. Images and fonts are sent as they are. Every Lighthouse threshold and assertion is unchanged.
- **Why:** Uncompressed, a page led by a photo on a phone's first screen (a blog post with a lead photo, or a photo section right under a short hero) scored 77 to 79 and failed the required check although the live site is fast; with gzip it scored 90 and every other page 100 (`docs/proposals/lighthouse-compression.md`). The check should measure the site visitors get, not a slower test server. Gzip is a conservative stand-in for Cloudflare's brotli.
- **Decided:** Grant, 2026-11-25
- **Enforced by:** `scripts/preview.test.mjs` (text files come back gzipped when asked and plain when not; images and fonts never re-compressed); the required `lighthouse` check.

## What still stops for Grant

- Adding or upgrading a dependency. (In an autonomous run this item is replaced; see "Autonomous runs" in CLAUDE.md.)
- Changing required checks, `lighthouserc` thresholds or CI behavior.
- Anything involving credentials, secrets, accounts, DNS, email sending or payments. (Also listed as: secrets or credentials, DNS, accounts or money, sending real email.)
- Deleting user data.
- A change to the meaning of copy.
- Lowering any threshold or required check.
- Any owner-only path: `.claude/hooks`, `.claude/agents`, `.claude/skills`, `.claude/settings*.json`, `.github/workflows`. For these, write `<file>.proposed` to the scratchpad and list it for hand-copying.

This list is CLAUDE.md's; if the two differ, CLAUDE.md wins.

## Timings

This site's own numbers, measured on Grant's Mac on 2026-11-24 with `.next` deleted first so the build starts cold.
This site has no `check:config` step and no script tests before this port, so those rows are new or absent.

### Before (the old `npm run check`)

| Step | Time |
|---|---|
| `lint` | 3.6 s |
| `typecheck` | 2.2 s |
| `test:worker` | 0.5 s |
| `build` | 5.4 s |
| `npm run check` as one command | 10.5 s |

### After

| Step | Time |
|---|---|
| `check:process` (new) | 0.1 s |
| `lint` | 3.6 s (unchanged command) |
| `typecheck` | 2.2 s (unchanged command) |
| `test:worker` | 0.5 s (unchanged command) |
| `test:scripts` (new, 12 tests) | 0.3 s |
| `build` | 5.4 s (unchanged command) |
| `npm run check:fast` as one command | 5.8 s |
| `npm run check` as one command | 11.8 s |

The pre-commit hook runs the full `check` until the owner batch installs the `check:fast` version, so today a commit
still takes the full time. After the batch a commit costs about 5.8 s instead of about 11.8 s. Single runs vary by a few
seconds. This site's build is small, so the saving is about 6 seconds per commit; the build is the step that grows with
the site. CI time is separate: Lighthouse now does 3 runs per page instead of 5, which this table does not measure.
