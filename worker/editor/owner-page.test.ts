import assert from "node:assert/strict";
import { test } from "node:test";
import { formatTime, renderConfirm, renderConsent, renderMessage, renderOwnerHome, renderRemoveConfirm, type PageBase } from "./owner-page.ts";

const base: PageBase = {
  siteName: "Example Co",
  siteUrl: "https://example.test",
  email: "owner@example.test",
  theme: { white: "#ffffff", ink: "#1c1917", ink2: "#44403c", silver: "#f5f5f4", silver2: "#e7e5e4", green: "#1e4fa3", greenDeep: "#173b7a", rust: "#9a3412", line: "#d6d3d1", tint: "#e8eefa" },
};
const proposal = { id: "p1", summary: "Update hours", createdAt: "2026-01-01T12:00:00.000Z", changeList: "Page /about", previewLink: "https://preview.example.test", uploads: [] };

const pages = {
  home: renderOwnerHome({
    ...base,
    proposals: [proposal],
    changes: [
      { change: 1, title: "Live one", state: "live", publishedAt: "2026-01-01T10:00:00.000Z", liveAt: "2026-01-01T10:05:00.000Z" },
      { change: 2, title: "Stuck one", state: "stuck", publishedAt: "2026-01-01T10:00:00.000Z", failedChecks: ["check"] },
      { change: 3, title: "Stopped one", state: "stopped", publishedAt: "2026-01-01T10:00:00.000Z" },
      { change: 4, title: "Checking one", state: "checking", publishedAt: "2026-01-01T10:00:00.000Z" },
      { change: 5, title: "Going live one", state: "going live", publishedAt: "2026-01-01T10:00:00.000Z" },
      { change: 6, title: "Unknown one", state: "unknown", publishedAt: "2026-01-01T10:00:00.000Z" },
    ],
  }),
  empty: renderOwnerHome({ ...base, proposals: [], changes: [] }),
  confirm: renderConfirm({ ...base, proposal }),
  consent: renderConsent({ ...base, handle: "h", clientName: "Claude", redirectHost: "claude.ai", redirectIsLoopback: false }),
  message: renderMessage({ ...base, title: "Done", body: "All good." }),
};

test("formatTime is fixed and tolerant", () => {
  assert.equal(formatTime("2026-01-01T12:00:00.000Z"), "2026-01-01 12:00 UTC");
  assert.equal(formatTime("later"), "later");
});

test("every page has the shell: lang, viewport, noindex, skip link, one h1, one main, no scripts or style attributes", () => {
  for (const [name, page] of Object.entries(pages)) {
    assert.match(page, /<html lang="en">/, name);
    assert.match(page, /<meta name="viewport" content="width=device-width, initial-scale=1">/, name);
    assert.match(page, /<meta name="robots" content="noindex, nofollow">/, name);
    assert.match(page, /<a class="skip" href="#main">/, name);
    assert.equal(page.match(/<h1[ >]/g)?.length, 1, name);
    assert.equal(page.match(/<main id="main">/g)?.length, 1, name);
    assert.doesNotMatch(page, /<script|\sstyle=|\son[a-z]+=|https?:\/\/[^"' ]*\.(js|css|woff2?)/i, name);
  }
});

test("home: sections in order and the connector address", () => {
  const order = ["Waiting for your yes", "Recent changes", "Connect your AI app", "What you can change"].map((h) => pages.home.indexOf(`<h2>${h}</h2>`));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(order.every((i) => i > 0));
  assert.match(pages.home, /<code>https:\/\/example\.test\/mcp<\/code>/);
  assert.match(pages.empty, /Nothing is waiting\./);
  assert.match(pages.empty, /No changes yet\./);
});

test("home: open changes are withdrawn, merged ones undone, stopped and unknown have no button", () => {
  assert.match(pages.home, />Undo change 1</);
  assert.match(pages.home, />Withdraw change 2</);
  assert.doesNotMatch(pages.home, /(Undo|Withdraw) change 3</);
  assert.match(pages.home, />Withdraw change 4</);
  assert.match(pages.home, />Undo change 5</);
  assert.doesNotMatch(pages.home, /(Undo|Withdraw) change 6</);
});

test("home: each change carries its state as a labelled tag", () => {
  for (const word of ["Live", "Stuck", "Stopped", "Checking", "Going live", "Status unavailable"]) {
    assert.match(pages.home, new RegExp(`<span class="tag">${word}</span>`), word);
  }
  assert.match(pages.home, /border:1px solid #44403c;border-radius:999px;padding:\.125rem \.625rem;font-size:\.875rem/);
});

test("home: the primary action, the preview name, the 44px links and the list roles", () => {
  assert.match(pages.home, /<a class="btn primary" href="\/owner\/publish\?proposal=p1" aria-label="Review and publish: Update hours">Review and publish<\/a>/);
  assert.match(pages.home, /aria-label="Open the preview \(opens in a new tab\): Update hours">Open the preview \(opens in a new tab\)</);
  assert.match(pages.home, /<ul class="list" role="list">/);
  assert.match(pages.home, /<ol class="list" role="list">/);
  assert.match(pages.message, /<a class="nav-link" href="\/owner">Back to the owner page<\/a>/);
  assert.match(pages.home, /\.nav-link\{display:inline-flex;align-items:center;min-height:44px\}/);
  assert.match(pages.home, /border:1px solid #44403c;background:#ffffff/);
});

test("home: the change list has a heading (h4 in a card, h2 on the confirm page)", () => {
  assert.match(pages.home, /<h4>Changes in this proposal<\/h4>\n<pre>/);
  assert.match(pages.confirm, /<h2>Changes in this proposal<\/h2>\n<pre>/);
});

test("home: what you can change names the question and the agency", () => {
  assert.match(pages.home, /Ask your AI app: \u201CWhat can I change on my site\?\u201D It will tell you what you can change by chatting, and what needs Huston Logic\./);
  assert.doesNotMatch(pages.home, /get_editing_guide/);
});

test("consent: names the client and the host, and has Allow and Don't allow", () => {
  assert.match(pages.consent, /<h1>Allow Claude to edit Example Co\?<\/h1>/);
  assert.match(pages.consent, /sign-in to claude\.ai\./);
  assert.match(pages.consent, /value="allow">Allow</);
  assert.match(pages.consent, /value="deny">Don't allow</);
  assert.match(pages.consent, /Nothing goes live until you say yes in the chat\./);
});

test("uploads section: cards, tags, escaping, empty state and the confirm thumbnails", () => {
  const upload = { id: "up000001", name: "<img src=x onerror=1>", kind: "photo" as const, bytes: 102_400, uploadedAt: "2026-01-01T12:00:00.000Z", expiresAt: "2026-01-31T12:00:00.000Z", onSite: true };
  const doc = { id: "up000002", name: "Price sheet", kind: "pdf" as const, bytes: 240_000, pages: 3, uploadedAt: "2026-01-01T12:00:00.000Z", expiresAt: "2026-01-02T12:00:00.000Z", onSite: false };
  const limits = { photoBytes: 20_000_000, pdfBytes: 10_000_000, expireDays: 30 };
  const now = "2026-01-01T12:00:00.000Z";
  const home = renderOwnerHome({ ...base, proposals: [], changes: [], uploads: { items: [upload, doc], limits, now } });
  assert.doesNotMatch(home, /<img src=x/);
  assert.match(home, /<img src="\/owner\/uploads\/up000001\/preview" alt="" /);
  assert.match(home, /<h3>&lt;img src=x onerror=1&gt;<\/h3>/);
  assert.match(home, /<summary class="btn">Rename<span class="sr"> Price sheet<\/span><\/summary>/);
  assert.match(home, /PDF \u00B7 240 KB \u00B7 3 pages \u00B7 Removed in 1 day/);
  assert.match(home, /<span class="tag">On your site<\/span>/);
  assert.match(home, /Removed in 30 days/);
  assert.match(home, /href="\/owner\/uploads\/remove\?upload=up000002" aria-label="Remove: Price sheet"/);
  assert.equal(home.match(/<script/g)?.length, 1);
  assert.equal(home.match(/<h1[ >]/g)?.length, 1);
  const empty = renderOwnerHome({ ...base, proposals: [], changes: [], uploads: { items: [], limits, now } });
  assert.match(empty, /<p id="upload-empty">Nothing uploaded yet\.<\/p>/);
  assert.match(empty, /id="upload-grid" role="list" hidden>/);
  const confirm = renderConfirm({ ...base, proposal: { ...proposal, uploads: [{ id: "up000001", name: "Team", kind: "photo" }, { id: "up000002", name: "Price sheet", kind: "pdf" }] } });
  assert.match(confirm, /<img src="\/owner\/uploads\/up000001\/preview" alt="" /);
  assert.match(confirm, /<p>Team<\/p>/);
  assert.match(confirm, /<span>PDF<\/span><\/div><p>Price sheet<\/p>/);
  assert.doesNotMatch(renderConfirm({ ...base, proposal }), /Photos and files/);
  const remove = renderRemoveConfirm({ ...base, upload });
  assert.match(remove, /action="\/owner\/uploads\/remove"/);
  assert.doesNotMatch(remove, /<img src=x/);
});

test("no-JS upload results: labelled, focusable, alert only when a file failed, names read once", () => {
  const limits = { photoBytes: 20_000_000, pdfBytes: 10_000_000, expireDays: 30 };
  const now = "2026-01-01T12:00:00.000Z";
  const good = renderOwnerHome({ ...base, proposals: [], changes: [], uploads: { items: [], limits, now, results: [{ name: "a.jpg", ok: true, message: "Uploaded \u201CShop front\u201D." }] } });
  assert.match(good, /id="upload-results" tabindex="-1" role="status" aria-labelledby="upload-results-title"><h3 id="upload-results-title">Upload results<\/h3>/);
  assert.match(good, /<li>Uploaded \u201CShop front\u201D\.<\/li>/);
  const bad = renderOwnerHome({ ...base, proposals: [], changes: [], uploads: { items: [], limits, now, results: [{ name: "x.mp4", ok: false, message: "Videos can't be uploaded here." }] } });
  assert.match(bad, /role="alert"/);
  assert.match(bad, /\u201Cx\.mp4\u201D was not uploaded\. Videos/);
});
