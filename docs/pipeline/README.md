# Delivery pipeline handbook

The technical handbook of the delivery pipeline used by this repo, written for the AI agents and
developers who will reuse it on client sites. Every statement below was read from a file in this
repo, from a command run against GitHub or wrangler, or from the pull-request history, on
2026-11-15. Where a fact could not be checked that way it is marked **UNVERIFIED** and the source
(usually the owner's own notes) is named.

Rules this handbook follows: no secret values anywhere (names only), no client names, no copy of
anything that lives outside the repo without saying so.

## The files

| File | What it covers |
|---|---|
| [README.md](./README.md) (this file) | The map: three gates, twelve steps, what runs where, and the order of operations for one change |
| [gate1-local.md](./gate1-local.md) | Gate 1, on the Mac: Claude Code hooks, `settings.json` deny and ask rules, the selftest, the owner-only hand-edit procedure, skills, review agents, `/ship-check` |
| [gate2-ci.md](./gate2-ci.md) | Gate 2, on GitHub: the three workflow files verbatim, Lighthouse CI config, the a11y suite design, the "Protect main" ruleset, the promotion rule and the proof-PR recipes |
| [gate3-deploy-ops.md](./gate3-deploy-ops.md) | Gate 3, on Cloudflare: Workers Builds settings, `wrangler.jsonc` verbatim, previews, custom domains and the www redirect, the rollback runbook, UptimeRobot, Dependabot |
| [contact-form.md](./contact-form.md) | The contact Worker: architecture, request pipeline, secrets by name, DNS for Google Workspace plus Resend, Turnstile, the Google service account, failure behaviour, tests |
| [client-onboarding-checklist.md](./client-onboarding-checklist.md) | An ordered checklist for standing up a new client site on this pipeline, with every gotcha hit so far |
| [lessons.md](./lessons.md) | Decisions and why, rejected options and why |

The repo's own rule files stay the source of truth: [`AGENTS.md`](../../AGENTS.md) for code,
content and architecture, [`CLAUDE.md`](../../CLAUDE.md) for workflow and deployment, and the
[`README.md`](../../README.md) for day-to-day operations. This handbook explains them and records
the reasoning; if they disagree, they win and this handbook needs a fix.

## What runs where

| Place | What lives there | Source |
|---|---|---|
| **The owner's Mac, in Claude Code** | The repo checkout, `npm run check` (lint, typecheck, Worker tests, static build), the four Claude Code hooks, the permission rules, the vendored skills, the three read-only review agents, `/ship-check`, local `wrangler dev`. Nothing deploys from here. | `.claude/`, `package.json`, `.claude/launch.json` (untracked) |
| **GitHub** (`ghuston/huston-tech-website`, public) | The code, pull requests, GitHub Actions (`CI`, `CodeQL`, `Dependency review`, Dependabot), the "Protect main" ruleset with four required checks and the code-scanning rule, Dependabot alerts (enabled). The owner merges; nothing else may. | `.github/`, `gh api .../rulesets/27075919` |
| **Cloudflare** | Workers Builds (builds and deploys `main`, previews for other branches), the Worker `huston-site` (static assets from `out/` plus `worker/contact.ts` on `/api/*`), Worker secrets, the rate-limit binding, Turnstile, the DNS zone, custom domains and the www redirect rule | `wrangler.jsonc`, `public/_headers`, README "Deploy to Cloudflare Workers" |
| **Resend** | Sends the two plain-text emails per submission from the site's own address; the sending domain is verified through Resend's Forge CNAME records | `worker/email.ts`, README "Accounts and DNS" |
| **Google** | Workspace owns the business mailbox and the root domain's MX, SPF and DKIM. A Google Cloud project holds the Sheets API and the service account the Worker signs in as. A Google Sheet receives one row per submission. A Google Calendar appointment page is the scheduler link. | `worker/sheets.ts`, `src/content/providers.ts`, README |
| **UptimeRobot** (free plan) | Checks the production URL every 5 minutes and emails the owner on an error, timeout or no answer | README "Monitoring" |

## The three gates

The repo names the gates in passing: the hooks README is titled "Claude Code hooks (Gate 1)",
PR 15 was "Piece 2 of Gate 2", and `docs/website-plan.md` E1 says "every change goes through the
3-gate, 12-step pipeline". No file in the repo enumerates the twelve steps, and the only numbered
step is `/ship-check`, which calls itself "Step 4 of the pipeline" in
`.claude/skills/ship-check/SKILL.md`. The list below is therefore a **reconstruction** that fits
those three anchors and the workflow in `CLAUDE.md` ("plan, branch, build, check, PR, review,
merge, auto-deploy on merge"). Treat the step numbers as **UNVERIFIED**; treat the gates and what
each one enforces as verified.

### Gate 1: local, on the Mac (steps 1 to 6)

Enforced by Claude Code hooks and permission rules in `.claude/`, so an honest mistake by the agent
is stopped before it reaches Git. Details in [gate1-local.md](./gate1-local.md).

1. **Plan.** Read `AGENTS.md` and `CLAUDE.md`. In the fast lane the agent plans and builds without
   asking; in the careful lane it waits for approval (see "Two lanes" below).
2. **Branch.** `git checkout -b type/short-name` off a fresh `main`. The `guard-bash` hook blocks
   any commit or push while on `main` or `master`.
3. **Build.** Edit under the rules. The `protect-config` hook blocks edits to owner-only paths and
   asks before the five "ask" files; the `scan-src` hook warns about design-rule slips after every
   edit under `src/`.
4. **Self-review.** The owner types `/ship-check`: it runs `npm run check` and the three read-only
   reviewers (`review-code`, `review-a11y`, `review-security`) in parallel and prints READY or
   NOT READY. It never edits.
5. **Check and commit.** `npm run check` must pass. The `precommit-check` hook runs it again before
   every `git commit` and blocks the commit with the last 60 lines of output if it fails.
   `--no-verify` is blocked.
6. **Push and open the PR.** The PR description starts with a "Needs your eyes" line listing any
   change to `AGENTS.md`, `CLAUDE.md`, `package.json` or `README.md`, or "none". `gh pr merge` and
   merging through `gh api` are blocked; the owner merges.

### Gate 2: CI, on GitHub (steps 7 to 9)

Enforced by the "Protect main" ruleset, which no one can bypass (`bypass_actors: []`). Details in
[gate2-ci.md](./gate2-ci.md).

7. **Four required status checks** must pass on the PR: `check`, `a11y` and `lighthouse` (jobs in
   `.github/workflows/ci.yml`) and `dependency-review` (`.github/workflows/dependency-review.yml`).
   The branch does not have to be up to date with `main`.
8. **Code scanning.** The "Require code scanning results" rule (tool CodeQL, alerts threshold
   `errors`, security alerts `high_or_higher`) blocks the merge while a new alert of that severity
   is open, and also while the scan is still running.
9. **Preview.** Cloudflare Workers Builds deploys every PR branch to a Worker Preview URL and
   comments on the PR. Hand tests that need a real browser or real mail happen here (preview mode
   mails only the site's own address and writes to the Sheet's `Preview` tab).

### Gate 3: deploy and operations, on Cloudflare (steps 10 to 12)

Details in [gate3-deploy-ops.md](./gate3-deploy-ops.md).

10. **The owner merges.** Merge, squash and rebase are all allowed. Nothing in the pipeline merges
    automatically; the repo has `allow_auto_merge: true`, and CLAUDE.md says the owner may enable
    auto-merge on a PR, but the agent never does.
11. **Workers Builds deploys `main`.** Build command `npm run build` (to become
    `npm run build:launch` at launch), deploy command `npx wrangler deploy`, run by Cloudflare, never
    by hand (the hook blocks it). A failed build leaves the previous version live and sends no email.
12. **Verify and watch.** Check the live site, UptimeRobot keeps checking it, and the rollback
    runbook (Deployments, Rollback / Promote version) is the emergency brake. A rollback changes
    nothing in Git; the next merge redeploys `main`'s HEAD.

## Two lanes: the order of operations for one change

Both lanes come from `CLAUDE.md`, section "Decision authority (fast lane)". The gates are the same
in both; what differs is how much the agent asks before building.

### Fast lane (the default)

CLAUDE.md: "Default for every task: plan, decide and build without asking me. Make implementation,
layout, naming, refactor and test-placement decisions yourself, following AGENTS.md,
docs/website-plan.md and docs/STYLE-GUIDE.md."

1. Read `AGENTS.md` and `CLAUDE.md`.
2. `git checkout main`, `git pull`, `git checkout -b type/short-name`.
3. Build. Copy is verbatim from `docs/website-plan.md` Section B; a missing or contradictory string
   becomes a `[[placeholder]]` listed in the PR, never a question.
4. Local checks: `npm run check` only. Run local Lighthouse only if the task changes fonts or images
   or adds scripts over 1 KB.
5. Commit (the precommit hook runs `npm run check` again), push, open the PR with the "Needs your
   eyes" line, and stop. The owner enables auto-merge or merges; the agent never merges.

### Careful lane (ask first)

CLAUDE.md lists exactly when the agent must stop and ask before doing anything:

- adding or upgrading a dependency;
- changing required checks, `lighthouserc` thresholds or CI behaviour;
- anything involving credentials, secrets, accounts, DNS, email sending or payments;
- deleting user data;
- a change to the meaning of copy.

Two more paths are not "ask" but "cannot": the owner-only paths (`.claude/hooks/**`,
`.claude/agents/**`, `.claude/skills/**`, `.github/workflows/**`, `.claude/settings*.json`) are
blocked for the agent in every mode and are changed by the owner's hand (procedure in
[gate1-local.md](./gate1-local.md#changing-an-owner-only-file-the-hand-edit-procedure)), and the
five "ask" files (`CLAUDE.md`, `AGENTS.md`, `package.json`, `wrangler.jsonc`, `.gitignore`) show an
approval prompt on every edit.

The older rule at the top of `CLAUDE.md` ("Plan first and wait for my approval before editing
anything") predates the fast lane. The fast-lane section says the default is to build without
asking; when the owner writes "fast lane" in the request, that is the one to follow.

## Reading the rest

- Start with the gate you are working in. Each gate file opens with the exact files involved and
  their paths, then the behaviour, then what is known to be stale.
- The [client checklist](./client-onboarding-checklist.md) is the only file written as a procedure
  to follow top to bottom.
- [lessons.md](./lessons.md) is the one to read before changing how the pipeline works, so a
  rejected option is not tried twice.
