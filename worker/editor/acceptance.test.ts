import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { handleMcp } from "./mcp.ts";
import { makeTestEditor, seedSite, testEditorConfig, type TestEditor } from "./test-support.ts";

/**
 * The owner's six sentences, end to end: each test plays the AI app calling the MCP endpoint, as it would after hearing
 * the sentence, and checks the exact words the owner would be shown and what lands in GitHub. Merging is simulated
 * with the fake's merge(); a deploy is the fake assets naming a commit.
 */

const page = (value: object) => JSON.stringify(value, null, 2) + "\n";
const lanes = readFileSync(new URL("../../docs/EDITING-LANES.md", import.meta.url), "utf8");

const contactWithFaq = page({
  path: "/contact",
  title: "Contact",
  description: "How to reach the shop.",
  status: "live",
  menu: { label: "Contact", order: 30, places: ["header", "footer"] },
  blocks: [
    { type: "hero", content: { title: "Get in touch" } },
    { type: "contact-form", content: { heading: "Book a call", body: "Pick a time.", buttonLabel: "Book a time", unsetNote: "Not set up." } },
    { type: "faq", content: { heading: "Questions", items: [{ question: "Q1?", answer: "A1." }, { question: "Q2?", answer: "A2." }] } },
  ],
});

// The library has no testimonial section; the highlights list stands in as the list of quotes.
const homeWithQuotes = page({
  path: "/",
  title: "Example Co",
  description: "A small shop.",
  status: "live",
  blocks: [
    { type: "hero", content: { title: "Things done well" } },
    {
      type: "highlights",
      content: { heading: "Kind words", items: [{ title: "Ana", body: "Lovely work." }, { title: "Ben", body: "Fast and kind." }, { title: "Cy", body: "Would hire again." }] },
    },
    { type: "closing-cta", content: { heading: "Join us", action: { label: "Careers", href: "/careers" } } },
  ],
});

const OWNER = "owner@example.test";
type Called = { text: string; isError: boolean; data: Record<string, unknown> };

function site(): TestEditor {
  return makeTestEditor({
    github: seedSite({ "docs/EDITING-LANES.md": lanes, "src/content/pages/contact.json": contactWithFaq, "src/content/pages/home.json": homeWithQuotes }),
  });
}

/** The AI app calling one tool on the owner's behalf. */
function aiApp(t: TestEditor) {
  let id = 0;
  return async (name: string, args: Record<string, unknown> = {}): Promise<Called> => {
    const request = new Request("https://example.test/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }),
    });
    const response = await handleMcp(request, { editor: t.editor, email: OWNER, config: testEditorConfig() });
    const { result } = (await response.json()) as { result: { content: { text: string }[]; isError: boolean; structuredContent?: Record<string, unknown> } };
    return { text: result.content[0].text, isError: result.isError, data: result.structuredContent ?? {} };
  };
}

const set = (page: string, pointer: string, value: unknown) => ({ op: "set", page, pointer, value });
const proposalId = (called: Called) => String(called.data.proposal_id);

test("Change Friday hours to 9 to 3.", async () => {
  const t = site();
  const ai = aiApp(t);
  await ai("get_site");
  const read = await ai("get_page", { path: "/hours" });
  assert.match(read.text, /Friday: 9 to 5/);

  const proposed = await ai("propose_change", { summary: "Friday hours 9 to 3", operations: [set("/hours", "/blocks/1/content/paragraphs/1", "Friday: 9 to 3")] });
  assert.equal(proposed.isError, false);
  assert.equal(
    proposed.text,
    [
      "Proposal p0000001: Friday hours 9 to 3",
      "",
      'Page /hours ("Opening hours"):',
      '  Block 2 (Text section), Paragraphs, entry 2:',
      '    was: "Friday: 9 to 5"',
      '    now: "Friday: 9 to 3"',
      "",
      "Nothing has changed yet. Show this list to the owner exactly as written. Publish only after they say yes to it.",
    ].join("\n"),
  );
  assert.equal(t.github.pulls.length, 0, "proposing opens nothing");

  const published = await ai("publish_change", { proposal_id: proposalId(proposed), owner_confirmation: "Yes, go ahead." });
  assert.equal(published.text, "Published as change 1. It goes live after the site's checks pass, usually in about 5 minutes. It is not live yet.");
  const [pull] = t.github.pulls;
  assert.equal(pull.headRef, "change/owner-p0000001");
  assert.equal(pull.state, "open");
  assert.equal(t.github.autoMergeOn(pull.number), true);

  assert.equal((await ai("get_change_status", { change: 1 })).text, "Change 1 is being checked. It is not live yet.");

  t.github.merge(1);
  const going = await ai("get_change_status", { change: 1 });
  assert.equal(going.text, "Change 1 passed its checks and is being published. I can't confirm it is live yet.");
  assert.equal(going.data.state, "going live");

  t.assets.commit = t.github.pulls[0].mergeCommitSha;
  const live = await ai("get_change_status", { change: 1 });
  assert.match(live.text, /^Change 1 is live\./);
  assert.equal(live.data.state, "live");
  assert.match(t.github.filesOn("main")["src/content/pages/hours.json"], /Friday: 9 to 3/);
});

test("Add a page called Videos with these three YouTube links, and put it in the menu.", async () => {
  const t = site();
  const ai = aiApp(t);
  const videos = ["aqz-KE-bpKQ", "aqz-KE-bpKR", "aqz-KE-bpKS"].map((v, i) => ({ url: `https://www.youtube.com/watch?v=${v}`, title: `Video ${i + 1}` }));
  const newPage = {
    path: "/videos",
    title: "Videos",
    description: "Our videos.",
    status: "live",
    menu: { label: "Videos", order: 50, places: ["header"] },
    blocks: [
      { type: "hero", content: { title: "Videos" } },
      { type: "video-grid", variant: "three-column", content: { heading: "Watch", videos } },
    ],
  };
  const proposed = await ai("propose_change", { summary: "Add a Videos page", operations: [{ op: "add_page", page: newPage }] });
  assert.equal(proposed.isError, false, proposed.text);
  assert.match(proposed.text, /^Proposal p0000001: Add a Videos page\n\nNew page \/videos \("Videos"\), in the header menu as "Videos"\n/);
  assert.match(proposed.text, /Block 2 \(Video grid\):/);
  for (const [i, video] of videos.entries()) {
    assert.ok(proposed.text.includes(`Videos, entry ${i + 1}, Video address: "${video.url}"`), video.url);
  }

  const preview = await ai("preview_change", { proposal_id: proposalId(proposed) });
  assert.equal(preview.isError, false);
  assert.equal(preview.data.link, "https://change-owner-p0000001-example-site.acct.workers.dev");
  assert.match(preview.text, /^The preview is being built \(usually 1 to 2 minutes\): https:\/\/change-owner-p0000001-example-site\.acct\.workers\.dev/);
  assert.match(t.github.filesOn("change/owner-p0000001")["src/content/pages/videos.json"], /"video-grid"/);
  assert.equal(t.github.pulls.length, 0, "a preview opens no pull request");

  const published = await ai("publish_change", { proposal_id: proposalId(proposed), owner_confirmation: "Yes, publish the Videos page." });
  assert.equal(published.isError, false, published.text);
  assert.equal(published.data.change, 1);
  const files = t.github.filesOn(t.github.pulls[0].headRef);
  const added = JSON.parse(files["src/content/pages/videos.json"]) as { menu: { places: string[] }; status: string };
  assert.deepEqual(added.menu.places, ["header"]);
  assert.equal(added.status, "live");
  assert.equal(t.github.autoMergeOn(1), true);
});

test("Move the FAQ above the contact section.", async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await ai("propose_change", { summary: "FAQ above the contact form", operations: [{ op: "move_block", page: "/contact", from: 3, to: 2 }] });
  assert.equal(proposed.isError, false, proposed.text);
  // The list names the block the owner asked to move.
  assert.equal(
    proposed.text,
    [
      "Proposal p0000001: FAQ above the contact form",
      "",
      'Page /contact ("Contact"):',
      '  Block "Questions and answers" moves from block 3 to block 2.',
      "",
      "Nothing has changed yet. Show this list to the owner exactly as written. Publish only after they say yes to it.",
    ].join("\n"),
  );
  await ai("publish_change", { proposal_id: proposalId(proposed), owner_confirmation: "Yes" });
  const moved = JSON.parse(t.github.filesOn(t.github.pulls[0].headRef)["src/content/pages/contact.json"]) as { blocks: { type: string }[] };
  assert.deepEqual(moved.blocks.map((b) => b.type), ["hero", "faq", "contact-form"]);
});

test("Remove the second testimonial.", async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await ai("propose_change", { summary: "Remove the second quote", operations: [{ op: "remove_item", page: "/", pointer: "/blocks/1/content/items", at: 2 }] });
  assert.equal(proposed.isError, false, proposed.text);
  assert.match(proposed.text, /Block 2 \(Highlights\), Ideas, entry 2:\n {4}removes:\n {6}Title: "Ben"\n {6}Text: "Fast and kind\."/);
  await ai("publish_change", { proposal_id: proposalId(proposed), owner_confirmation: "Yes, remove it." });
  const home = JSON.parse(t.github.filesOn(t.github.pulls[0].headRef)["src/content/pages/home.json"]) as { blocks: { content: { items?: { title: string }[] } }[] };
  assert.deepEqual(home.blocks[1].content.items?.map((i) => i.title), ["Ana", "Cy"]);
});

test("Archive the Careers page. ... Bring it back.", async () => {
  const t = site();
  const ai = aiApp(t);
  const blocked = await ai("propose_change", { summary: "Archive Careers", operations: [{ op: "archive_page", page: "/careers" }] });
  assert.equal(blocked.isError, true);
  assert.equal(
    blocked.text,
    'This change can\'t be made as asked:\nhome.json, block 3 (closing-cta): "action", "href" "/careers" points to /careers, which is archived; link to a live page or restore it.\nNothing was changed.',
  );

  const proposed = await ai("propose_change", {
    summary: "Archive Careers",
    operations: [{ op: "archive_page", page: "/careers" }, set("/", "/blocks/2/content/action", { label: "Get in touch", href: "/contact" })],
  });
  assert.equal(proposed.isError, false, proposed.text);
  assert.match(proposed.text, /Archives \/careers: it leaves the site/);
  await ai("publish_change", { proposal_id: proposalId(proposed), owner_confirmation: "Yes, archive it." });
  t.github.merge(1);
  assert.match(t.github.filesOn("main")["src/content/pages/careers.json"], /"status": "archived"/);

  const back = await ai("propose_change", { summary: "Bring Careers back", operations: [{ op: "restore_page", page: "/careers" }] });
  assert.equal(back.isError, false, back.text);
  assert.match(back.text, /Page \/careers \("Careers"\):\n  Brings back \/careers, in the header menu as "Careers"\./);
  await ai("publish_change", { proposal_id: proposalId(back), owner_confirmation: "Yes, bring it back." });
  assert.match(t.github.filesOn(t.github.pulls[1].headRef)["src/content/pages/careers.json"], /"status": "live"/);
});

test("Undo that.", async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await ai("propose_change", { summary: "Friday hours 9 to 3", operations: [set("/hours", "/blocks/1/content/paragraphs/1", "Friday: 9 to 3")] });
  await ai("publish_change", { proposal_id: proposalId(proposed), owner_confirmation: "Yes" });
  t.github.merge(1);

  const undo = await ai("undo_change", { change: 1 });
  assert.equal(undo.isError, false, undo.text);
  assert.match(undo.text, /^Proposal p0000002: Undo change 1\n\nPage \/hours/);
  assert.match(undo.text, /was: "Friday: 9 to 3"\n {4}now: "Friday: 9 to 5"/);
  assert.equal(t.github.pulls.length, 1, "an undo is only a proposal until the owner says yes");

  const published = await ai("publish_change", { proposal_id: proposalId(undo), owner_confirmation: "Yes, undo it." });
  assert.equal(published.data.change, 2);
  assert.match(t.github.filesOn(t.github.pulls[1].headRef)["src/content/pages/hours.json"], /Friday: 9 to 5/);
});

test("Add a booking calendar that takes payments.", async () => {
  const t = site();
  const ai = aiApp(t);
  const guide = await ai("get_editing_guide");
  assert.ok(guide.text.includes("- **Payments.** Huston Logic builds it."));

  const recorded = await ai("request_feature", { request: "Add a booking calendar that takes payments", lane_reason: "Payments: Huston Logic builds it." });
  assert.equal(
    recorded.text,
    "Recorded for Huston Logic as request 1. This needs Huston Logic: the site's sections can't do it. Huston Logic has the request and will say what it takes.",
  );
  const [issue] = t.github.issues;
  assert.deepEqual(issue.labels, ["owner-request"]);
  assert.equal(issue.title, "Owner request: Add a booking calendar that takes payments");
  assert.equal(t.github.pulls.length, 0, "nothing on the site changes");
});
