// Tests for scripts/check-process.mjs. Temp folders only. Run with `npm run test:scripts`.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { checkProcess, successLine } from "./check-process.mjs";

const lines = (n, text = "line") => Array.from({ length: n }, (_, i) => `${text} ${i}`).join("\n") + "\n";

const GOOD_STATUS = "# Status\n\n## Current state\nLive.\n\n## For the master\nOne decision.\nAnother, 3 runs, dated 2026-11-24.\n\n## Needs Grant\nNothing.\n";
const GOOD_PROCESS = "# Process\n\n## Where facts live\nHere.\n\n## Rules\n\n### Rule one\n**Why:** because.\n\n### Rule two\nText.\n**Why:** also because.\n";
const GOOD_AGENT = "---\nname: x\nmodel: sonnet\n---\nBody.\n";

/** Builds a fake repo, runs fn(root), removes it. `files` overrides or adds files; a null value removes a default. */
function withRepo(files, fn) {
  const root = mkdtempSync(join(tmpdir(), "check-process-"));
  const all = {
    "docs/STATUS.md": GOOD_STATUS,
    "docs/PROCESS.md": GOOD_PROCESS,
    "docs/superpowers/plans/2026-11-24-a.md": "# Plan\n",
    ".claude/agents/review.md": GOOD_AGENT,
    ...files,
  };
  try {
    for (const [path, content] of Object.entries(all)) {
      if (content === null) continue;
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), content);
    }
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
const problemsFor = (files, options) => withRepo(files, (root) => checkProcess(root, options));
const statusWithMaster = (body) => `# Status\n\n## For the master\n${body}\n## Needs Grant\nNothing.\n`;

test("a good repo passes", () => {
  assert.deepEqual(problemsFor({}), []);
});

test("rule 1: STATUS.md length boundary and missing file", () => {
  assert.deepEqual(problemsFor({ "docs/STATUS.md": lines(150) }), []);
  const over = problemsFor({ "docs/STATUS.md": lines(151) });
  assert.equal(over.length, 1);
  assert.match(over[0], /docs\/STATUS\.md/);
  assert.match(problemsFor({ "docs/STATUS.md": null })[0], /docs\/STATUS\.md is missing/);
});

test("rule 2: newest plan only, by name", () => {
  const plans = (name, n) => ({ [`docs/superpowers/plans/${name}`]: lines(n) });
  assert.deepEqual(problemsFor(plans("2026-11-24-b.md", 150)), []);
  const over = problemsFor(plans("2026-11-24-b.md", 151));
  assert.equal(over.length, 1);
  assert.match(over[0], /2026-11-24-b\.md/);
  // An older, longer plan is ignored when a newer, short one exists.
  assert.deepEqual(problemsFor({ ...plans("2026-01-01-old.md", 400), ...plans("2026-12-01-new.md", 10) }), []);
  // The newest plan is the last by name, even when it is the long one.
  assert.equal(problemsFor({ ...plans("2026-01-01-old.md", 10), ...plans("2026-12-01-new.md", 400) }).length, 1);
});

test("rule 2: no plans folder or no files is fine", () => {
  assert.deepEqual(problemsFor({ "docs/superpowers/plans/2026-11-24-a.md": null }), []);
});

test("rule 3: agents need a model line in front matter", () => {
  assert.deepEqual(problemsFor({ ".claude/agents/review.md": null }), []);
  for (const bad of ["No front matter\nmodel: sonnet\n", "---\nname: x\n---\nmodel: sonnet\n", "---\nmodel:\n---\n", "---\nmodel:   \n---\n"]) {
    const found = problemsFor({ ".claude/agents/review.md": bad });
    assert.equal(found.length, 1, bad);
    assert.match(found[0], /\.claude\/agents\/review\.md/);
  }
});

test("rule 4: PROCESS.md and its Where facts live heading", () => {
  assert.match(problemsFor({ "docs/PROCESS.md": null })[0], /docs\/PROCESS\.md is missing/);
  assert.match(problemsFor({ "docs/PROCESS.md": "# Process\n\n## Rules\n" })[0], /Where facts live/);
  assert.deepEqual(problemsFor({ "docs/PROCESS.md": "## Where facts live   \n" }), []);
});

test("rule 5: every rule heading needs a Why", () => {
  const found = problemsFor({ "docs/PROCESS.md": "## Where facts live\n## Rules\n### Keep it short\nNo reason.\n### Fine\n**Why:** yes\n" });
  assert.equal(found.length, 1);
  assert.match(found[0], /Keep it short/);
  // An empty Why is not a Why.
  assert.equal(problemsFor({ "docs/PROCESS.md": "## Where facts live\n## Rules\n### Empty\n**Why:**\n" }).length, 1);
  // A Why after the next heading does not count for the earlier rule.
  assert.equal(problemsFor({ "docs/PROCESS.md": "## Where facts live\n## Rules\n### A\n### B\n**Why:** b\n" }).length, 1);
  // Headings outside Rules are not checked; no Rules section is fine.
  assert.deepEqual(problemsFor({ "docs/PROCESS.md": "## Where facts live\n## Rules\n### A\n**Why:** a\n## Other\n### Not a rule\n" }), []);
  assert.deepEqual(problemsFor({ "docs/PROCESS.md": "## Where facts live\n### Loose\n" }), []);
});

test("rule 6: For the master length boundary", () => {
  const body = (n) => lines(n, "Decision");
  assert.deepEqual(problemsFor({ "docs/STATUS.md": statusWithMaster(body(12)) }), []);
  const over = problemsFor({ "docs/STATUS.md": statusWithMaster(body(13)) });
  assert.equal(over.length, 1);
  assert.match(over[0], /For the master/);
  // Blank lines do not count.
  assert.deepEqual(problemsFor({ "docs/STATUS.md": statusWithMaster(`${body(12)}\n\n\n`) }), []);
});

test("rule 6: PR numbers are rejected in every form, plain numbers are not", () => {
  for (const bad of ["Merged #22.", "See PR 22.", "See PR #22.", "PRs 22 and 23", "see pr 22", "https://x/pull/22"]) {
    const found = problemsFor({ "docs/STATUS.md": statusWithMaster(`${bad}\n`) });
    assert.equal(found.length, 1, bad);
    assert.match(found[0], /PR number/);
  }
  for (const ok of ["Lighthouse runs 3 runs.", "Dated 2026-11-24.", "Over 22 pages.", "Issue number sign # alone"]) {
    assert.deepEqual(problemsFor({ "docs/STATUS.md": statusWithMaster(`${ok}\n`) }), [], ok);
  }
  // Numbers outside the For the master section are fine; a missing section is fine.
  assert.deepEqual(problemsFor({ "docs/STATUS.md": "# S\n\n## Changelog\nMerged #22 (PR 22).\n" }), []);
});

test("rule 7: off by default, on by the JSON file or by options", () => {
  const hook = (name) => ({ ".claude/hooks/precommit-check.mjs": `const SCRIPT = "${name}";\n` });
  assert.deepEqual(problemsFor(hook("check")), []);
  assert.deepEqual(problemsFor({}), []);

  const on = { "scripts/process-rules.json": '{ "precommitHookFastOnly": true }' };
  assert.deepEqual(problemsFor({ ...on, ...hook("check:fast") }), []);
  for (const bad of ["check", "build"]) {
    const found = problemsFor({ ...on, ...hook(bad) });
    assert.equal(found.length, 1);
    assert.match(found[0], /precommit-check\.mjs/);
    assert.match(found[0], /must not run the full check/);
  }
  assert.equal(problemsFor({ ...on, ".claude/hooks/precommit-check.mjs": "// nothing\n" }).length, 1);
  assert.equal(problemsFor(on).length, 1);

  const options = { rules: { precommitHookFastOnly: true } };
  assert.equal(problemsFor(hook("check"), options).length, 1);
  assert.deepEqual(problemsFor({ ".claude/hooks/precommit-check.mjs": "const SCRIPT = 'check:fast';\n" }, options), []);
  // Options override the file.
  assert.deepEqual(problemsFor({ ...on, ...hook("check") }, { rules: { precommitHookFastOnly: false } }), []);
});

test("a broken process-rules.json fails closed; a missing one means the flag is off", () => {
  for (const bad of ["{ not json", "", "[]", "null", '{ "precommitHookFastOnly": "true" }', '{ "precommitHookFastOnly": 1 }', '{ "precommitHookFastOnly": null }']) {
    const found = problemsFor({ "scripts/process-rules.json": bad });
    assert.equal(found.length, 1, JSON.stringify(bad));
    assert.match(found[0], /scripts\/process-rules\.json/);
  }
  assert.deepEqual(problemsFor({ "scripts/process-rules.json": "{}" }), []);
  assert.deepEqual(problemsFor({ "scripts/process-rules.json": null }), []);
});

test("the success line does not count the switched-off rule", () => {
  assert.match(successLine({ precommitHookFastOnly: false }), /all 6 rules passed \(1 off until the owner switches it on: precommitHookFastOnly\)/);
  assert.equal(successLine({ precommitHookFastOnly: true }), "check:process: all 7 rules passed");
});
