import assert from "node:assert/strict";
import { test } from "node:test";
import { isCommittablePath } from "./site-reader.ts";
import { FakeGitHub } from "./fake-github.ts";
import { blogFiles, registry, seedFiles, seedSite } from "./test-support.ts";
import { aiApp, makeUploadsEditor } from "./uploads-test-support.ts";

/** The fix wave after the collections and brand run: the brand refusal, the notice's time zone, the registry-driven note, the commit allow-list. */

const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
const setOn = (settings: string, pointer: string, value: unknown) => ({ op: "set", settings, pointer, value });

test("a brand change is refused up front when previews are not set up, and a business change still goes through", async () => {
  const t = makeUploadsEditor({ github: seedSite(blogFiles()), config: { workersSubdomain: null } });
  const ai = aiApp(t);
  const refused = await ai("propose_change", { summary: "Green", operations: [{ op: "set_font", role: "display", font: "manrope" }] });
  assert.equal(refused.isError, true);
  assert.match(refused.text, /Brand changes need a preview first, and previews are not set up on this site yet\. Huston Logic can make this change for you\./);
  assert.equal(t.kv.store.size, 0, "nothing was drafted");
  const business = await ai("propose_change", { summary: "Phone", operations: [setOn("business", "/phone", "555 0199")] });
  assert.equal(business.isError, false, business.text);
});

test("the notice's last day is judged in the business time zone", async () => {
  const files = { "src/content/notice.json": json({ text: "Closed.", endsOn: "2026-01-01" }) };
  const operations = [setOn("notice", "/text", "Closed today.")];
  // The clock is 2026-01-01 12:00 UTC: still the 1st in UTC, already the 2nd in Auckland.
  const utc = makeUploadsEditor({ github: seedSite(files), config: { timeZone: "UTC" } });
  const inUtc = await aiApp(utc)("propose_change", { summary: "Notice", operations });
  assert.match(inUtc.text, /Shows through 2026-01-01; it comes down at the first publish after that date\./);
  const auckland = makeUploadsEditor({ github: seedSite(files), config: { timeZone: "Pacific/Auckland" } });
  const inAuckland = await aiApp(auckland)("propose_change", { summary: "Notice", operations });
  assert.match(inAuckland.text, /This notice will not show: its end date has passed\./);
});

test("the empty-list note covers every block type whose definition names a collection", async () => {
  const withCollection = registry.filter((definition) => definition.collection !== undefined);
  assert.ok(withCollection.length >= 5);
  for (const definition of withCollection) {
    const files = Object.fromEntries(Object.entries(seedFiles()).filter(([path]) => !path.startsWith("src/content/collections/")));
    const t = makeUploadsEditor({ github: new FakeGitHub(files) });
    const proposed = await aiApp(t)("propose_change", { summary: "Add a list", operations: [{ op: "insert_block", page: "/", at: 2, block: { type: definition.type, content: definition.example } }] });
    const kind = definition.collection as string;
    if (kind === "posts") continue; // the post blocks need the /blog page; the existing acceptance test covers them
    assert.match(proposed.text, new RegExp(`has a ${kind} section`), `${definition.type}: ${proposed.text}`);
  }
});

test("only the files an editor commit may write are allowed", () => {
  for (const path of [
    "src/content/pages/home.json",
    "src/content/pages/our-story.json",
    "src/content/collections/posts/spring-news.json",
    "src/content/business.json",
    "src/content/brand.json",
    "src/content/notice.json",
    "src/app/palette.css",
    "src/lib/fonts.ts",
    "public/images/uploads/up000001.webp",
    "public/files/price-list-up000002.pdf",
  ]) {
    assert.equal(isCommittablePath(path), true, path);
  }
  for (const path of [
    ".github/workflows/ci.yml",
    "package.json",
    "src/content/pages/Home.json",
    "src/content/pages/sub/home.json",
    "src/content/pages/home.json.bak",
    "src/content/collections/pages/spring.json",
    "src/content/collections/posts/Bad Slug.json",
    "src/content/collections/posts/../../business.json",
    "src/content/collections/posts/sub/a.json",
    "src/content/other.json",
    "public/images/uploads/x.svg",
    "public/images/team.png",
    "public/files/a/b.pdf",
    "src/lib/other.ts",
  ]) {
    assert.equal(isCommittablePath(path), false, path);
  }
});

test("publish refuses a proposal that holds a path outside the allow-list, and writes nothing", async () => {
  const t = makeUploadsEditor({ github: seedSite(blogFiles()) });
  const ai = aiApp(t);
  const proposed = await ai("propose_change", { summary: "Phone", operations: [setOn("business", "/phone", "555 0199")] });
  assert.equal(proposed.isError, false, proposed.text);
  const key = `proposal:${String(proposed.data.proposal_id)}`;
  const stored = JSON.parse(String(t.kv.store.get(key)?.value)) as { files: { path: string; content: string }[] };
  stored.files.push({ path: ".github/workflows/ci.yml", content: "evil" });
  await t.kv.put(key, JSON.stringify(stored), { expirationTtl: 1000 });
  const refused = await ai("publish_change", { proposal_id: proposed.data.proposal_id, owner_confirmation: "Yes, publish it." });
  assert.equal(refused.isError, true);
  assert.match(refused.text, /not allowed to change/);
  assert.equal(t.github.pulls.length, 0);
});
