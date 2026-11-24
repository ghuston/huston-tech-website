# Website process

This file follows huston-logic/site-template docs/PROCESS.md as of 99e5378. Change the template first, then port.

How sites are built from this template: the one home for the build rules. Each rule says what, why, who decided and
what enforces it. `npm run check:process` fails if a rule has no "Why" or this file loses "Where facts live".

## Where facts live

- This repo, `huston-logic/site-template`, owns the website build rules (this file, `docs/PROCESS.md`), its status (`docs/STATUS.md`) and the handbook (`docs/pipeline/`, the technical reference).
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
