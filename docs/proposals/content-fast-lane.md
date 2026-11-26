# Content fast lane

Proposal, not in force.

Status: written in the owner chat tools run (2026-11-25). Nothing in the repo changed. The files for Grant are listed below.

## The problem

After the owner says yes, a change waits for every required check. The slowest one is `lighthouse`. It audits all six pages, three runs each, so it sets how long the owner waits. The measured times on two recent runs:

- `lighthouse`: 4 min 9 s and 4 min 1 s.
- `a11y`: 2 min 2 s and 1 min 54 s.
- Whole CI workflow: 4 min 12 s and 4 min 3 s.

Most of the Lighthouse time audits pages that a content change does not touch.

## The proposal

For a pull request whose changed files are all page files (`src/content/pages/*.json`), and where no page's `menu` changed and no page changed status, the `a11y` and `lighthouse` jobs scan only the pages the change touched, as they are at the head of the branch. Any other change, including any image, code or menu change, scans every page, as today.

The same jobs, the same job names, the same thresholds and the same axe rules. `scripts/content-lane.mjs` picks the pages. It is built and tested in the repo, and it is not used until the proposed files are copied in.

**Second part: make `change-scope` a required check.** The job runs on every pull request already. As a required check, it stops a non-content change on any branch that the site editor's GitHub App opens (the bot-author rule). That closes the gap where a leaked App key could open a pull request that changes code and is not judged by the scope check.

## Why it keeps the same protection

- A page file changes only its own page. The one exception is the menu, which appears on every page. So a menu change sends the run back to a full scan.
- Links from other pages are checked by `npm run check:content`, which runs in the `check` job. They are not checked by `a11y` or Lighthouse, and they do not need to be.
- The job names stay the same, so the "Protect main" ruleset needs no change for the lane itself.

## Expected saving (an estimate, not measured)

Lighthouse on one page instead of six, with three runs each, would take about 1.5 minutes instead of about 4. The slowest required job would then be `a11y`, at about 2 minutes. Setup and build time stay the same. This comes from the timings above, not from a run of the lane.

## The proposed files

The three files are in this repo, in `docs/proposals/content-fast-lane-files/`. Each one is the new version of the file it is named after, without the `.proposed` ending.

- `ci.yml.proposed` becomes `.github/workflows/ci.yml`. This is an owner-only path, so it is copied by hand. It already contains the content and design check steps from the last run's proposal.
- `lighthouserc.cjs.proposed` becomes `lighthouserc.cjs`. The thresholds are unchanged.
- `site.a11y.spec.ts.proposed` becomes `tests/a11y/site.a11y.spec.ts`.

The proposed `ci.yml` also removes the job-level `if:` from `change-scope`, so the job always reports. Do not add it back: a required check must not have a job-level `if:`.

## The proposed rule

This is the proposed `docs/PROCESS.md` rule 18 (17 went to the Lighthouse test server rule), in the same format as the other rules. It is not written into PROCESS.md yet.

### 18. Content-only changes take the content lane

- **What:** For a pull request whose changed files are all page files (`src/content/pages/*.json`), and where no page's `menu` changed and no page changed status, the `a11y` and `lighthouse` jobs scan only the pages the change touched. Any other change scans every page, as today. The same jobs, job names and thresholds apply. Once the ruleset requires it, `change-scope` is a required check, so the bot-author rule applies to every pull request the site editor opens.
- **Why:** An owner waits for the slowest check after saying yes, and most of that time audits pages the change did not touch.
- **Decided:** not yet (proposal)
- **Enforced by:** `scripts/content-lane.mjs`, the `a11y` and `lighthouse` jobs, and the required `change-scope` check.

## Order of steps for Grant

1. Read the three files and the rule above. Approve or reject the proposal.
2. Make `change-scope` a required check the way CLAUDE.md says a new required check must be made. It needs 5 clean runs of the check, then a deliberate-failure proof pull request titled "PROOF - DO NOT MERGE: change-scope", which is closed, never merged, with `gh pr close --delete-branch`. `change-scope` already runs on every pull request, so its clean runs are the ones that happen on the normal pull requests.
3. Change the ruleset first: in GitHub, Settings, Rules, "Protect main", add `change-scope` as a required status check. Then copy the files, as the workflow change comes second.
4. Copy the three files into place in your own terminal, then run the checks on the copy.
5. Watch the first content-only pull request. Its `a11y` and `lighthouse` logs should name only the pages the change touched. Its wall time should fall. This is a suggested check, not one of the source notes.

The change to `a11y` and `lighthouse` keeps their names, so it is not a new required check, and the 5-run rule does not apply to it. The 5-run rule applies to `change-scope`, which becomes required.
