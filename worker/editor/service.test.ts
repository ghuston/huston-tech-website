import assert from "node:assert/strict";
import { test } from "node:test";
import { FakeGitHub } from "./fake-github.ts";
import { GitHubError, type GitHub } from "./github.ts";
import { makeTestEditor, seedFiles, seedSite, TEST_NOW, type TestEditor } from "./test-support.ts";
import { seoLimits } from "../../src/blocks/validate.ts";
import type { ToolResult } from "./types.ts";

// This site's own page-title limit (siteSeoLimits in src/site-blocks/design.ts), so the test follows the real rule.
const { titleMax } = seoLimits();
const OWNER = { email: "owner@example.test" };
const friday = (value: string) => [{ op: "set", page: "/hours", pointer: "/blocks/1/content/paragraphs/1", value }];
const idOf = (result: ToolResult) => (result.data as { proposal_id: string }).proposal_id;
const changeOf = (result: ToolResult) => (result.data as { change: number }).change;

async function propose(t: TestEditor, value = "Friday: 9 to 3"): Promise<string> {
  const result = await t.editor.propose({ summary: `Friday hours ${value}`, operations: friday(value) }, OWNER);
  assert.ok(!result.isError, result.text);
  return idOf(result);
}

/** Proposes, publishes and (optionally) merges one change; returns its number. */
async function ship(t: TestEditor, value: string, merge = true): Promise<number> {
  const published = await t.editor.publish(await propose(t, value), "Yes, go ahead.", OWNER);
  assert.ok(!published.isError, published.text);
  const change = changeOf(published);
  if (merge) t.github.merge(change);
  return change;
}

/** A GitHub whose chosen methods are replaced; everything else is the fake's own. */
function withOverrides(github: FakeGitHub, overrides: Partial<GitHub>): FakeGitHub {
  return new Proxy(github, {
    get(target, key) {
      if (key in overrides) return overrides[key as keyof GitHub];
      const value = Reflect.get(target, key) as unknown;
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

test("propose writes nothing to the repo and stores a draft for three days", async () => {
  const t = makeTestEditor();
  const before = t.github.filesOn("main");
  const result = await t.editor.propose({ summary: "Friday closes at 3", operations: friday("Friday: 9 to 3") }, OWNER);
  assert.equal(result.isError, undefined);
  assert.deepEqual(t.github.filesOn("main"), before);
  assert.equal(t.github.pulls.length, 0);
  assert.equal(t.kv.ttlOf("proposal:p0000001"), 259200);
  assert.match(result.text, /^Proposal p0000001: Friday closes at 3\n\nPage \/hours/);
  assert.match(result.text, /was: "Friday: 9 to 5"\n {4}now: "Friday: 9 to 3"/);
  assert.match(result.text, /Nothing has changed yet\. Show this list to the owner exactly as written\. Publish only after they say yes to it\.$/);
  assert.equal(result.text.includes(OWNER.email), false);
  assert.deepEqual(result.data, { proposal_id: "p0000001", summary: "Friday closes at 3", change_list: (result.data as { change_list: string }).change_list });
});

test("propose refuses a bad summary, a bad operation, invalid content and a new placeholder", async () => {
  const t = makeTestEditor();
  for (const summary of ["", "x".repeat(101), "two\nlines", "Fix [[this]]"]) {
    const result = await t.editor.propose({ summary, operations: friday("Friday: 9 to 3") }, OWNER);
    assert.equal(result.isError, true, summary);
  }
  const unknown = await t.editor.propose({ summary: "Nope", operations: [{ op: "archive_page", page: "/missing" }] }, OWNER);
  assert.equal(unknown.isError, true);
  assert.match(unknown.text, /^This change can't be made as asked:\n.*there is no page \/missing\.\nNothing was changed\.$/s);
  const long = await t.editor.propose({ summary: "Long", operations: [{ op: "set", page: "/hours", pointer: "/title", value: "t".repeat(titleMax + 1) }] }, OWNER);
  assert.match(long.text, new RegExp(`hours\\.json: "title" is ${titleMax + 1} characters`));
  const placeholder = await t.editor.propose({ summary: "Draft", operations: friday("[[Friday hours]]") }, OWNER);
  assert.match(placeholder.text, /adds the placeholder "\[\[Friday hours\]\]"/);
  const nothing = await t.editor.propose({ summary: "Same", operations: friday("Friday: 9 to 5") }, OWNER);
  assert.match(nothing.text, /change nothing/);
  assert.equal(t.kv.store.size, 0);
  assert.equal(t.github.pulls.length, 0);
});

test("preview commits to its own branch, reports not ready, then ready when the site shows the commit", async () => {
  let served: string | null = null;
  const t = makeTestEditor({
    deps: { fetch: (async () => (served === null ? new Response("no", { status: 404 }) : Response.json({ commit: served }))) as typeof fetch },
  });
  const id = await propose(t);
  const first = await t.editor.preview(id);
  const link = "https://change-owner-p0000001-example-site.acct.workers.dev";
  assert.equal(first.text, `The preview is being built (usually 1 to 2 minutes): ${link}. It may not open until then.`);
  assert.deepEqual(first.data, { link, ready: false });
  assert.match(t.github.filesOn("change/owner-p0000001")["src/content/pages/hours.json"] ?? "", /Friday: 9 to 3/);
  assert.match(t.github.filesOn("main")["src/content/pages/hours.json"] ?? "", /Friday: 9 to 5/);
  assert.equal(t.kv.ttlOf("proposal:p0000001"), 259200);
  const stored = (await t.kv.get("proposal:p0000001", "json")) as { preview: { commit: string } };
  served = stored.preview.commit;
  const second = await t.editor.preview(id);
  assert.equal(second.text, `The preview is ready: ${link}`);
  assert.equal((second.data as { ready: boolean }).ready, true);
});

test("preview says so when the site has no preview address, and an expired id is an error", async () => {
  const t = makeTestEditor({ config: { workersSubdomain: null } });
  const result = await t.editor.preview(await propose(t));
  assert.equal(result.text, "Preview links are not set up for this site yet.");
  assert.equal(result.isError, undefined);
  const other = makeTestEditor();
  assert.equal((await other.editor.preview("zzzzzzzz")).isError, true);
});

test("publish opens one pull request with the change list, the owner's words and auto-merge, and defuses mentions", async () => {
  const t = makeTestEditor();
  const id = await propose(t, "Friday: ``` call @someone at 3");
  const result = await t.editor.publish(id, "Yes, ping @boss\nthanks ```", OWNER);
  assert.equal(result.text, "Published as change 1. It goes live after the site's checks pass, usually in about 5 minutes. It is not live yet.");
  assert.deepEqual(result.data, { change: 1 });
  const [pull] = t.github.pulls;
  assert.equal(pull.headRef, "change/owner-p0000001");
  assert.equal(pull.state, "open");
  assert.match(pull.title, /^change: Friday hours/);
  assert.ok(pull.body.startsWith("Needs your eyes: none\n\nMade by the site editor and approved by the site owner in chat.\nThe owner said:\n> Yes, ping @​boss\n> thanks ```\n\nProposal p0000001.\n\n````text\n"));
  assert.ok(pull.body.includes("``` call @​someone at 3"));
  assert.equal(pull.body.includes("@someone"), false);
  assert.ok(pull.body.endsWith("\n````"));
  assert.match(t.github.filesOn(pull.headRef)["src/content/pages/hours.json"] ?? "", /``` call @someone at 3/);
  assert.equal(t.kv.store.has("proposal:p0000001"), false);
  const again = await t.editor.publish(id, "Yes", OWNER);
  assert.equal(again.text, "That proposal has expired or does not exist. Propose it again.");
  assert.equal(again.isError, true);
  assert.equal(t.github.pulls.length, 1);
});

test("publish needs the owner's words", async () => {
  const t = makeTestEditor();
  const id = await propose(t);
  assert.equal((await t.editor.publish(id, "   ", OWNER)).isError, true);
  assert.equal((await t.editor.publish(id, "y".repeat(501), OWNER)).isError, true);
  assert.equal(t.github.pulls.length, 0);
});

test("publish reuses the preview commit when main has not moved", async () => {
  const t = makeTestEditor();
  const id = await propose(t);
  await t.editor.preview(id);
  const stored = (await t.kv.get("proposal:p0000001", "json")) as { preview: { commit: string } };
  await t.editor.publish(id, "Yes", OWNER);
  assert.equal(t.github.pulls[0].headSha, stored.preview.commit);
});

test("a site that changed since the proposal is refused", async () => {
  const t = makeTestEditor();
  const stale = await propose(t, "Friday: 9 to 1");
  await ship(t, "Friday: 9 to 2");
  const result = await t.editor.publish(stale, "Yes", OWNER);
  assert.equal(result.text, "The site changed since this was proposed. Propose it again.");
  assert.equal(result.isError, true);
});

test("a second change is refused while one is still open", async () => {
  const t = makeTestEditor();
  const first = await propose(t, "Friday: 9 to 1");
  const second = await propose(t, "Friday: 9 to 2");
  await t.editor.publish(first, "Yes", OWNER);
  const result = await t.editor.publish(second, "Yes", OWNER);
  assert.equal(result.text, "Change 1 is still going live. Publish this when it is live.");
  assert.equal(t.github.pulls.length, 1);
});

test("a race closes the newer pull request", async () => {
  const github = seedSite();
  const real = github.listPulls.bind(github);
  let calls = 0;
  const hidden = withOverrides(github, { listPulls: async (state) => (++calls <= 2 ? [] : real(state)) });
  const t = makeTestEditor({ github: hidden });
  const main = (await github.headOfMain()).commit;
  await github.setBranch("change/owner-older000", await github.createCommit({ baseCommit: main, files: [{ path: "a.txt", content: "a" }], message: "x" }));
  await github.openPull({ head: "change/owner-older000", title: "change: older", body: "" });
  const result = await t.editor.publish(await propose(t), "Yes", OWNER);
  assert.equal(result.text, "Another change was published at the same moment. This one was stopped; try again when that one is live.");
  assert.equal(result.isError, true);
  assert.equal(github.pulls[1].state, "closed");
  assert.equal(github.pulls[0].state, "open");
});

test("the daily cap counts today's editor pull requests, not other people's or yesterday's", async () => {
  const t = makeTestEditor({ config: { dailyChangeLimit: 2 } });
  await ship(t, "Friday: 9 to 1");
  await ship(t, "Friday: 9 to 2");
  const blocked = await t.editor.publish(await propose(t, "Friday: 9 to 3"), "Yes", OWNER);
  assert.equal(blocked.text, "This site has had 2 changes today, the daily limit. Try again tomorrow, or ask Huston Logic.");
  assert.equal(blocked.isError, true);
  assert.match((await t.editor.overview()).text, /Changes left today: 0\./);
  t.now.value = new Date(Date.parse(TEST_NOW) + 24 * 3600_000);
  const next = await t.editor.publish(await propose(t, "Friday: 9 to 4"), "Yes", OWNER);
  assert.equal(next.isError, undefined);
});

const minutes = (count: number) => new Date(Date.parse(TEST_NOW) + count * 60_000);

test("status walks through checking, stuck, going live, live and stopped", async () => {
  const t = makeTestEditor();
  const change = await ship(t, "Friday: 9 to 1", false);
  const head = t.github.pulls[0].headSha;

  const checking = await t.editor.status(change);
  assert.equal(checking.text, "Change 1 is being checked. It is not live yet.");
  t.github.setChecks(head, [
    { name: "change-report", status: "completed", conclusion: "failure" },
    { name: "check", status: "in_progress", conclusion: null },
  ]);
  assert.equal((await t.editor.status(change)).text, "Change 1 is being checked. It is not live yet.");
  t.github.setChecks(head, [
    { name: "check", status: "completed", conclusion: "success" },
    { name: "a11y", status: "completed", conclusion: "failure" },
    { name: "lighthouse", status: "completed", conclusion: "timed_out" },
  ]);
  const stuck = await t.editor.status(change);
  assert.equal(
    stuck.text,
    "Change 1 is stuck: a check found a problem (a11y, lighthouse). It is not live. Huston Logic can see it on the site's repo; you can withdraw it with undo.",
  );
  assert.equal((stuck.data as { state: string }).state, "stuck");

  t.github.merge(change);
  const unknown = await t.editor.status(change);
  assert.equal(unknown.text, "Change 1 passed its checks and is being published. I can't confirm it is live yet.");
  assert.equal((unknown.data as { state: string }).state, "going live");
  assert.equal(t.kv.store.has("live:1"), false);

  t.assets.commit = (await t.github.headOfMain()).commit.replace(/^c\d+/, "c1");
  const old = await t.editor.status(change);
  assert.equal(old.text, "Change 1 passed its checks and is being published. It is not live yet.");
  assert.equal((old.data as { state: string }).state, "going live");

  t.now.value = minutes(5);
  t.assets.commit = t.github.pulls[0].mergeCommitSha;
  const live = await t.editor.status(change);
  assert.match(live.text, /^Change 1 is live\. It went live 5 minutes after it was published\.$/);
  const data = live.data as { state: string; liveAt: string; minutesToLive: number };
  assert.equal(data.state, "live");
  assert.equal(data.liveAt, minutes(5).toISOString());
  assert.equal(data.minutesToLive, 5);
  assert.deepEqual(t.kv.puts.filter((p) => p.key === "live:1"), [{ key: "live:1", ttl: undefined }]);

  t.now.value = minutes(65);
  t.assets.commit = null;
  const later = await t.editor.status(change);
  assert.equal((later.data as { liveAt: string }).liveAt, minutes(5).toISOString());
  assert.equal(t.kv.puts.filter((p) => p.key === "live:1").length, 1);

  const other = makeTestEditor();
  const stopped = await ship(other, "Friday: 9 to 1", false);
  other.github.close(stopped);
  assert.equal((await other.editor.status(stopped)).text, "Change 1 was stopped before it went live. Nothing changed on the site.");
});

test("a change that is slow to go live says so, and keeps its going live state", async () => {
  const t = makeTestEditor();
  const change = await ship(t, "Friday: 9 to 1");
  t.now.value = minutes(31);
  const slow = await t.editor.status(change);
  assert.equal(slow.text, "Change 1 passed its checks and is being published. I can't confirm it is live yet. This is taking longer than usual. Huston Logic can see it.");
  assert.equal((slow.data as { state: string }).state, "going live");
  t.assets.commit = "c1-old";
  assert.equal((await t.editor.status(change)).text, "Change 1 passed its checks and is being published. It is not live yet. This is taking longer than usual. Huston Logic can see it.");
});

test("a live time is only called a measurement when it was seen soon after the merge", async () => {
  const t = makeTestEditor();
  const change = await ship(t, "Friday: 9 to 1");
  t.now.value = minutes(61);
  t.assets.commit = t.github.pulls[0].mergeCommitSha;
  const late = await t.editor.status(change);
  assert.equal(late.text, "Change 1 is live (confirmed 2026-01-01 13:01 UTC).");
  assert.equal((late.data as { minutesToLive?: number }).minutesToLive, undefined);
  assert.equal((late.data as { state: string }).state, "live");
});

test("an open change with no check at all for 30 minutes is stuck, and says which checks are missing", async () => {
  const t = makeTestEditor();
  const change = await ship(t, "Friday: 9 to 1", false);
  t.github.setChecks(t.github.pulls[0].headSha, [{ name: "Workers Builds: example-site", status: "completed", conclusion: "success" }]);
  t.now.value = minutes(29);
  assert.equal(((await t.editor.status(change)).data as { state: string }).state, "checking");
  t.now.value = minutes(31);
  const stuck = await t.editor.status(change);
  assert.equal((stuck.data as { state: string }).state, "stuck");
  assert.deepEqual((stuck.data as { failedChecks: string[] }).failedChecks, ["required checks missing"]);
  t.github.setChecks(t.github.pulls[0].headSha, [{ name: "check", status: "queued", conclusion: null }]);
  assert.equal(((await t.editor.status(change)).data as { state: string }).state, "checking");
});

test("an ignored check name matches the entry itself or the entry followed by a colon or space", async () => {
  const t = makeTestEditor();
  const change = await ship(t, "Friday: 9 to 1", false);
  t.github.setChecks(t.github.pulls[0].headSha, [
    { name: "Workers Builds: example-site", status: "completed", conclusion: "failure" },
    { name: "change-report", status: "completed", conclusion: "failure" },
    { name: "change-scoped", status: "completed", conclusion: "failure" },
    { name: "check", status: "queued", conclusion: null },
  ]);
  const status = await t.editor.status(change);
  assert.deepEqual((status.data as { failedChecks: string[] }).failedChecks, ["change-scoped"]);
});

test("a deployed site that names no commit is never reported live", async () => {
  const t = makeTestEditor();
  const change = await ship(t, "Friday: 9 to 1");
  t.assets.commit = null;
  assert.equal(((await t.editor.status(change)).data as { state: string }).state, "going live");
  t.assets.broken = true;
  assert.equal(((await t.editor.status(change)).data as { state: string }).state, "going live");
});

test("status of a change that is not the editor's own is an error", async () => {
  const t = makeTestEditor();
  assert.equal((await t.editor.status(7)).text, "There is no change 7 on this site.");
  await t.github.setBranch("feature/x", (await t.github.headOfMain()).commit);
  await t.github.openPull({ head: "feature/x", title: "other", body: "" });
  assert.equal((await t.editor.status(1)).isError, true);
});

test("recent lists at most the 10 newest changes", async () => {
  const t = makeTestEditor({ config: { dailyChangeLimit: 50 } });
  for (let i = 1; i <= 11; i++) await ship(t, `Friday: 9 to ${i}`);
  const result = await t.editor.recent();
  const changes = result.data;
  assert.equal(changes.length, 10);
  assert.equal(changes[0].change, 11);
  assert.equal(result.text.split("\n").length, 10);
});

test("undo of a merged change restores the page and goes through publish like any proposal", async () => {
  const t = makeTestEditor();
  const change = await ship(t, "Friday: 9 to 1");
  const proposal = await t.editor.undo(change, OWNER);
  assert.equal(proposal.isError, undefined, proposal.text);
  assert.match(proposal.text, /^Proposal p0000002: Undo change 1\n\nPage \/hours/);
  assert.match(proposal.text, /was: "Friday: 9 to 1"\n {4}now: "Friday: 9 to 5"/);
  const published = await t.editor.publish(idOf(proposal), "Yes, undo it.", OWNER);
  assert.equal(changeOf(published), 2);
  assert.match(t.github.filesOn(t.github.pulls[1].headRef)["src/content/pages/hours.json"] ?? "", /Friday: 9 to 5/);
});

test("undo is refused when a later change touched the same page", async () => {
  const t = makeTestEditor();
  const first = await ship(t, "Friday: 9 to 1");
  await ship(t, "Friday: 9 to 2");
  const result = await t.editor.undo(first, OWNER);
  assert.equal(result.isError, true);
  assert.equal(result.text, "A later change touched /hours after change 1. Undo the later change first.");
});

test("undo of a change that created a page archives it and never deletes it", async () => {
  const t = makeTestEditor();
  const page = { path: "/offers", title: "Offers", description: "Our offers.", status: "live", blocks: [{ type: "hero", content: { title: "Offers" } }] };
  const proposed = await t.editor.propose({ summary: "Add offers", operations: [{ op: "add_page", page }] }, OWNER);
  assert.equal(proposed.isError, undefined, proposed.text);
  const change = changeOf(await t.editor.publish(idOf(proposed), "Yes", OWNER));
  t.github.merge(change);
  const undo = await t.editor.undo(change, OWNER);
  assert.match(undo.text, /Archives \/offers: it leaves the site\. Nothing is deleted/);
  const published = await t.editor.publish(idOf(undo), "Yes", OWNER);
  const files = t.github.filesOn(t.github.pulls[changeOf(published) - 1].headRef);
  assert.match(files["src/content/pages/offers.json"] ?? "", /"status": "archived"/);
});

test("undo of an open change withdraws it after publish, and is never capped", async () => {
  const t = makeTestEditor({ config: { dailyChangeLimit: 1 } });
  const change = await ship(t, "Friday: 9 to 1", false);
  const proposal = await t.editor.undo(change, OWNER);
  assert.match(proposal.text, /Withdraws change 1 \(Friday hours Friday: 9 to 1\)\. It never went live, so nothing on the site changes\./);
  assert.equal((await t.editor.preview(idOf(proposal))).text, "A withdrawal has nothing to preview.");
  const done = await t.editor.publish(idOf(proposal), "Yes, withdraw it.", OWNER);
  assert.equal(done.text, "Change 1 was withdrawn. Nothing changed on the site.");
  assert.equal(t.github.pulls[0].state, "closed");
  assert.equal(t.github.pulls[0].merged, false);
});

test("undo of a stopped change and of a missing change say so", async () => {
  const t = makeTestEditor();
  const change = await ship(t, "Friday: 9 to 1", false);
  t.github.close(change);
  assert.equal((await t.editor.undo(change, OWNER)).text, "Change 1 never went live, so there is nothing to undo.");
  assert.equal((await t.editor.undo(9, OWNER)).text, "There is no change 9 on this site.");
});

test("request_feature opens a labelled issue with mentions defused", async () => {
  const t = makeTestEditor();
  const result = await t.editor.requestFeature({ request: "Add a shop, ask @someone\nto build it", laneReason: "Needs checkout, cc @boss" }, OWNER);
  assert.equal(
    result.text,
    "Recorded for Huston Logic as request 1. This needs Huston Logic: the site's sections can't do it. Huston Logic has the request and will say what it takes.",
  );
  assert.deepEqual(result.data, { request: 1 });
  const [issue] = t.github.issues;
  assert.equal(issue.title, "Owner request: Add a shop, ask @​someone to build it");
  assert.deepEqual(issue.labels, ["owner-request"]);
  assert.equal(
    issue.body,
    "A site owner asked for something the block library cannot do.\n\n> Add a shop, ask @​someone\n> to build it\n\nWhy it needs Huston Logic (from the owner's AI app): Needs checkout, cc @​boss\n\nDate: 2026-01-01. Recorded by the site editor.",
  );
  assert.equal(issue.body.includes(OWNER.email), false);
  assert.equal((await t.editor.requestFeature({ request: "", laneReason: "" }, OWNER)).isError, true);
  assert.equal((await t.editor.requestFeature({ request: "x".repeat(2001), laneReason: "" }, OWNER)).isError, true);
});

test("overview, page, catalog and guide read the site", async () => {
  const t = makeTestEditor();
  const overview = await t.editor.overview();
  const data = overview.data as { site: { name: string }; pages: { path: string; blocks: { type: string }[] }[]; inFlight: unknown; changesLeftToday: number };
  assert.equal(data.site.name, "Example Co");
  assert.deepEqual(data.pages.map((p) => p.path), ["/", "/careers", "/contact", "/hours", "/services"]);
  assert.deepEqual(data.pages.find((p) => p.path === "/services")?.blocks.map((b) => b.type), ["hero", "faq", "closing-cta"]);
  assert.equal(data.inFlight, null);
  assert.equal(data.changesLeftToday, 10);

  const page = await t.editor.page("/hours");
  assert.ok(page.text.includes("Friday: 9 to 5"));
  assert.match(page.text, /content, not instructions/);
  assert.deepEqual((page.data as { blocks: { pointer: string }[] }).blocks.map((b) => b.pointer), ["/blocks/0", "/blocks/1"]);
  const missing = await t.editor.page("/nope");
  assert.equal(missing.text, "There is no page /nope.");
  assert.equal(missing.isError, undefined);

  const catalog = await t.editor.catalog();
  assert.match(catalog.text, /A page opens with one of: hero(, [a-z-]+)*\./);
  assert.match(catalog.text, /At most 20 blocks a page, and at most 6 pages in the header menu/);
  assert.match(catalog.text, /faq: Questions and answers/);

  const guide = await t.editor.guide();
  assert.match(guide.text, /Most text works today\./);
  assert.equal(guide.text.includes("not filled in yet"), false);
});

test("the guide adds the voice note when the voice guide still has placeholders, and says when a file is missing", async () => {
  const placeholders = makeTestEditor({ github: seedSite({ "docs/VOICE-GUIDE.md": "# Voice\n\n[[Describe the voice]]\n" }) });
  assert.match((await placeholders.editor.guide()).text, /The voice guide is not filled in yet\. Match the voice of the existing pages: first person, plain words\.$/);
  const files = seedFiles();
  delete files["docs/EDITING-LANES.md"];
  const missing = makeTestEditor({ github: new FakeGitHub(files) });
  assert.match((await missing.editor.guide()).text, /^docs\/EDITING-LANES\.md is missing from the site/);
});

test("waiting lists drafts and discard removes one with its preview branch", async () => {
  const t = makeTestEditor();
  assert.equal((await t.editor.waiting()).text, "Nothing is waiting for the owner's yes.");
  const id = await propose(t);
  await t.editor.preview(id);
  const waiting = await t.editor.waiting();
  const items = waiting.data;
  assert.equal(items[0].id, id);
  assert.match(items[0].previewLink ?? "", /^https:\/\/change-owner-p0000001-example-site\.acct\.workers\.dev$/);
  assert.equal((await t.editor.discard(id)).text, "Proposal p0000001 was discarded.");
  assert.deepEqual([...t.kv.store.keys()].filter((key) => key.startsWith("proposal:")), []);
  assert.throws(() => t.github.filesOn("change/owner-p0000001"));
  assert.equal((await t.editor.publish(id, "Yes", OWNER)).isError, true);
});

test("GitHub failures become plain errors that carry no detail", async () => {
  const down = new GitHubError(503, "read branch");
  const t = makeTestEditor({ github: withOverrides(seedSite(), { headOfMain: async () => Promise.reject(down) }) });
  const result = await t.editor.propose({ summary: "Anything", operations: friday("Friday: 9 to 3") }, OWNER);
  assert.equal(result.text, "GitHub could not be reached right now, so nothing was changed. Try again in a minute.");
  assert.equal(result.isError, true);

  const github = seedSite();
  const u = makeTestEditor({ github: withOverrides(github, { openPull: async () => Promise.reject(down) }) });
  const failed = await u.editor.publish(await propose(u), "Yes", OWNER);
  assert.equal(failed.text, "GitHub could not be reached right now, so the change was not opened. Nothing is live.");
  assert.equal(u.kv.store.has("proposal:p0000001"), true);

  const v = makeTestEditor({ github: withOverrides(seedSite(), { enableAutoMerge: async () => Promise.reject(down) }) });
  const unqueued = await v.editor.publish(await propose(v), "Yes", OWNER);
  assert.equal(unqueued.isError, true);
  assert.equal(unqueued.text, "The change was opened but could not be queued, so it was stopped. Nothing is live.");
  assert.equal(v.github.pulls[0].state, "closed");
  assert.throws(() => v.github.filesOn("change/owner-p0000001"), "the stopped change's branch is deleted");
});

test("a stuck change in flight says it is stuck and how to clear it", async () => {
  const t = makeTestEditor();
  const first = await propose(t, "Friday: 9 to 1");
  const second = await propose(t, "Friday: 9 to 2");
  await t.editor.publish(first, "Yes", OWNER);
  t.github.setChecks(t.github.pulls[0].headSha, [{ name: "a11y", status: "completed", conclusion: "failure" }]);
  const result = await t.editor.publish(second, "Yes", OWNER);
  assert.equal(
    result.text,
    "Change 1 is stuck: a check found a problem, so it can't go live. Withdraw it first (ask me to undo change 1), then publish this.",
  );
  assert.equal(result.isError, true);
});

test("a pull request that is not from the site's GitHub App is stopped, and the owner is told the settings are wrong", async () => {
  const t = makeTestEditor();
  t.github.botLogin = "someone-else[bot]";
  const lines: string[] = [];
  const original = console.log;
  console.log = (line: string) => lines.push(line);
  let result: ToolResult;
  try {
    result = await t.editor.publish(await propose(t), "Yes", OWNER);
  } finally {
    console.log = original;
  }
  assert.equal(result.text, "The site editor's settings don't match its GitHub App, so nothing was published. Huston Logic needs to fix the editor's settings.");
  assert.equal(result.isError, true);
  assert.equal(t.github.pulls[0].state, "closed");
  assert.throws(() => t.github.filesOn("change/owner-p0000001"));
  assert.ok(lines.some((line) => JSON.parse(line).event === "editor_bot_mismatch"));
});

test("the GitHub App's login is compared without case", async () => {
  const t = makeTestEditor({ config: { github: { owner: "example", repo: "site", appId: "1", installationId: "2", botLogin: "Editor-Bot[bot]" } } });
  const result = await t.editor.publish(await propose(t), "Yes", OWNER);
  assert.equal(result.isError, undefined, result.text);
  assert.equal(t.github.pulls[0].state, "open");
  assert.equal(((await t.editor.status(1)).data as { change: number }).change, 1);
});

test("a repository with no required checks is never merged by the editor", async () => {
  const t = makeTestEditor();
  t.github.autoMergeClean = true;
  const result = await t.editor.publish(await propose(t), "Yes", OWNER);
  assert.equal(result.text, "This site's required checks aren't set up, so the change was not published. It is waiting for Huston Logic.");
  assert.equal(result.isError, true);
  assert.equal(t.github.pulls[0].state, "open");
  assert.equal(t.github.pulls[0].merged, false);
  assert.match(t.github.filesOn("main")["src/content/pages/hours.json"] ?? "", /Friday: 9 to 5/);
});

test("a repository with auto-merge switched off has its pull request stopped", async () => {
  const t = makeTestEditor();
  t.github.autoMergeNotAllowed = true;
  const result = await t.editor.publish(await propose(t), "Yes", OWNER);
  assert.equal(result.text, "Auto-merge is turned off for this site's repository, so nothing was published. Huston Logic needs to turn it on.");
  assert.equal(result.isError, true);
  assert.equal(t.github.pulls[0].state, "closed");
  assert.throws(() => t.github.filesOn("change/owner-p0000001"));
});

test("a failure after the pull request opened never leaves it open", async () => {
  const github = seedSite();
  const t = makeTestEditor({ github: withOverrides(github, { enableAutoMerge: async () => Promise.reject(new GitHubError(500, "enable auto-merge")) }) });
  await t.editor.publish(await propose(t), "Yes", OWNER);
  assert.equal(github.pulls.filter((pull) => pull.state === "open").length, 0);
});

test("previews are capped per day, and reusing a preview does not count", async () => {
  const t = makeTestEditor({ config: { dailyChangeLimit: 2 } });
  const [a, b, c] = [await propose(t, "Friday: 9 to 1"), await propose(t, "Friday: 9 to 2"), await propose(t, "Friday: 9 to 3")];
  assert.equal((await t.editor.preview(a)).isError, undefined);
  assert.equal((await t.editor.preview(a)).isError, undefined, "the same preview again");
  assert.equal((await t.editor.preview(b)).isError, undefined);
  const refused = await t.editor.preview(c);
  assert.equal(refused.text, "This site has had 2 previews today, the daily limit. Publish or try tomorrow.");
  assert.equal(refused.isError, true);
  assert.equal(t.kv.ttlOf("previews:2026-01-01"), 172800);
  assert.equal(await t.kv.get("previews:2026-01-01", "text"), "2");
  t.now.value = new Date(Date.parse(TEST_NOW) + 24 * 3600_000);
  assert.equal((await t.editor.preview(c)).isError, undefined);
});

test("publish does not reuse a preview branch that moved; it builds the commit again", async () => {
  const t = makeTestEditor();
  const id = await propose(t);
  await t.editor.preview(id);
  const main = (await t.github.headOfMain()).commit;
  const moved = await t.github.createCommit({ baseCommit: main, files: [{ path: "src/content/pages/hours.json", content: "{\"tampered\":true}\n" }], message: "x" });
  await t.github.setBranch("change/owner-p0000001", moved);
  const result = await t.editor.publish(id, "Yes", OWNER);
  assert.equal(result.isError, undefined, result.text);
  const [pull] = t.github.pulls;
  assert.notEqual(pull.headSha, moved);
  assert.match(t.github.filesOn(pull.headRef)["src/content/pages/hours.json"] ?? "", /Friday: 9 to 3/);
});

test("leftover change branches with no pull request and no proposal are swept, at most 10 a call", async () => {
  const t = makeTestEditor();
  const main = (await t.github.headOfMain()).commit;
  for (let i = 0; i < 12; i++) await t.github.setBranch(`change/owner-old${String(i).padStart(5, "0")}`, main);
  await t.github.setBranch("feature/keep", main);
  const kept = await propose(t);
  await t.github.setBranch(`change/owner-${kept}`, main);
  await t.editor.overview();
  const left = (await t.github.listBranches("change/owner-")).map((branch) => branch.name);
  assert.equal(left.filter((name) => name.startsWith("change/owner-old")).length, 2);
  assert.ok(left.includes(`change/owner-${kept}`), "a branch with a waiting proposal stays");
  assert.ok((await t.github.listBranches("feature/")).length === 1, "other branches are never touched");
  await t.editor.preview(await propose(t, "Friday: 9 to 4"));
  assert.equal((await t.github.listBranches("change/owner-old")).length, 0);
});

test("a branch that has an open pull request is not swept", async () => {
  const t = makeTestEditor();
  const id = await propose(t);
  await t.editor.publish(id, "Yes", OWNER);
  t.github.close(1);
  await t.github.openPull({ head: "change/owner-p0000001", title: "change: again", body: "" });
  await t.editor.overview();
  assert.equal((await t.github.listBranches("change/owner-p0000001")).length, 1);
});

test("an editor change that is older than 100 other pull requests is still found in flight", async () => {
  const t = makeTestEditor();
  const first = await propose(t, "Friday: 9 to 1");
  const second = await propose(t, "Friday: 9 to 2");
  await t.editor.publish(first, "Yes", OWNER);
  const main = (await t.github.headOfMain()).commit;
  for (let i = 0; i < 60; i++) {
    await t.github.setBranch(`feature/other-${i}`, main);
    await t.github.openPull({ head: `feature/other-${i}`, title: `other ${i}`, body: "" });
  }
  const result = await t.editor.publish(second, "Yes", OWNER);
  assert.equal(result.text, "Change 1 is still going live. Publish this when it is live.");
  assert.equal(((await t.editor.overview()).data as { inFlight: { change: number } }).inFlight.change, 1);
  assert.equal((await t.editor.recent()).data.length, 1);
});

test("one change whose status cannot be read does not fail the list", async () => {
  const github = seedSite();
  const real = github.checkRuns.bind(github);
  let broken = false;
  const t = makeTestEditor({ github: withOverrides(github, { checkRuns: async (sha) => (broken ? Promise.reject(new GitHubError(500, "read check runs")) : real(sha)) }) });
  await ship(t, "Friday: 9 to 1");
  await ship(t, "Friday: 9 to 2", false);
  broken = true;
  const result = await t.editor.recent();
  assert.equal(result.isError, undefined);
  assert.deepEqual(result.data.map((change) => change.state), ["unknown", "going live"]);
  assert.match(result.text, /Change 2: Status unavailable right now\. \(Friday hours Friday: 9 to 2\)/);
});

test("a stored proposal with a missing or wrong-typed field is treated as expired", async () => {
  const t = makeTestEditor();
  const id = await propose(t);
  const good = (await t.kv.get(`proposal:${id}`, "json")) as Record<string, unknown>;
  const bad: Record<string, unknown>[] = [
    { ...good, kind: "bogus" },
    { ...good, files: [{ path: "a.json", content: 5 }] },
    { ...good, files: "none" },
    { ...good, email: undefined },
    { ...good, baseCommit: 7 },
    { ...good, preview: { branch: "x" } },
    { ...good, kind: "withdraw" },
    { ...good, undoOf: "3" },
  ];
  for (const record of bad) {
    await t.kv.put(`proposal:${id}`, JSON.stringify(record));
    assert.equal((await t.editor.publish(id, "Yes", OWNER)).text, "That proposal has expired or does not exist. Propose it again.", JSON.stringify(record).slice(0, 60));
    assert.equal((await t.editor.preview(id)).isError, true);
    assert.deepEqual((await t.editor.waiting()).data, []);
  }
  await t.kv.put(`proposal:${id}`, JSON.stringify(good));
  assert.equal((await t.editor.waiting()).data.length, 1);
});

test("waiting turns a KV failure into an error result", async () => {
  const t = makeTestEditor();
  t.kv.list = async () => {
    throw new Error("kv down");
  };
  const result = await t.editor.waiting();
  assert.equal(result.isError, true);
  assert.deepEqual(result.data, []);
  assert.equal(result.text.includes("kv down"), false);
});
