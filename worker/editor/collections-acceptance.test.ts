import assert from "node:assert/strict";
import { test } from "node:test";
import { fontsModule } from "../../src/brand/fonts.ts";
import { paletteCss } from "../../src/brand/palette.ts";
import { CONTRAST_PAIRS, type Palette } from "../../src/brand/contrast-pairs.ts";
import { blogFiles, seedSite } from "./test-support.ts";
import { aiApp, JPEG, makeUploadsEditor, pdfBytes, type Called, type UploadsEditor } from "./uploads-test-support.ts";

/**
 * The acceptance sayings of the collections and brand run (spec: docs/superpowers/specs/2026-11-25-collections-and-brand-design.md),
 * each played as the owner's AI app calling the MCP endpoint on the fake GitHub, with a real upload store on fake R2. A test
 * checks the change list's words, and the files a publish commits; a refusal checks the plain-words reason.
 */

const business = {
  name: "Example Co",
  phone: "555 0100",
  email: "hello@example.test",
  address: ["1 Main Street", "Springfield"],
  hours: {
    monday: { opens: "09:00", closes: "17:00" },
    tuesday: { opens: "09:00", closes: "17:00" },
    wednesday: { opens: "09:00", closes: "17:00" },
    thursday: { opens: "09:00", closes: "17:00" },
    friday: { opens: "09:00", closes: "17:00" },
    saturday: "closed",
    sunday: "closed",
  },
  social: [],
};
const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";

const site = (options: { blog?: boolean; files?: Record<string, string>; images?: Parameters<typeof makeUploadsEditor>[0] extends infer O ? (O extends { images?: infer I } ? I : never) : never } = {}): UploadsEditor =>
  makeUploadsEditor({
    github: seedSite({ "src/content/business.json": json(business), ...(options.blog === false ? {} : blogFiles()), ...options.files }),
    ...(options.images ? { images: options.images } : {}),
  });

const proposalId = (called: Called) => String(called.data.proposal_id);
const setOn = (settings: string, pointer: string, value: unknown) => ({ op: "set", settings, pointer, value });
const addItem = (collection: string, slug: string, item: Record<string, unknown>) => ({ op: "add_item", collection, slug, item });

/** Proposes, checks it is accepted, and returns it. */
async function propose(ai: ReturnType<typeof aiApp>, summary: string, operations: unknown[]): Promise<Called> {
  const proposed = await ai("propose_change", { summary, operations });
  assert.equal(proposed.isError, false, proposed.text);
  return proposed;
}

/** Publishes a proposal with the owner's yes, merges the pull request, and returns the files it committed. */
async function publishAndMerge(t: UploadsEditor, ai: ReturnType<typeof aiApp>, id: string): Promise<Record<string, string>> {
  const published = await ai("publish_change", { proposal_id: id, owner_confirmation: "Yes, publish it." });
  assert.equal(published.isError, false, published.text);
  const pull = t.github.pulls[t.github.pulls.length - 1];
  const files = t.github.filesOn(pull.headRef);
  t.github.merge(pull.number);
  return files;
}

const upload = async (t: UploadsEditor, bytes: Uint8Array, name: string) => {
  const result = await t.store.add(bytes, name);
  assert.ok(result.ok, result.ok ? "" : result.message);
  return result.upload;
};

const parts = [
  { type: "heading", level: 2, text: "What an inspection covers" },
  { type: "paragraph", text: "We look at the roof, the walls and the foundation, and we write down what we find." },
  { type: "list", style: "bullet", items: ["The roof", ["The ", { text: "full checklist", href: "/services" }]] },
  { type: "quote", text: "Thorough and kind.", source: "Dana at Ridgeline Homes" },
];
const post = (extra: Record<string, unknown> = {}) => ({
  status: "draft",
  title: "Our new inspection service",
  description: "What the new inspection covers and who it is for.",
  date: "2026-01-01",
  body: parts,
  ...extra,
});

// ---- 1. a post, as a draft, then published ----

test('1. "Write a blog post about our new inspection service, in my voice, and save it as a draft."', async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await propose(ai, "Draft a post about the new inspection service", [addItem("posts", "new-inspection-service", post())]);

  assert.match(proposed.text, /New post "Our new inspection service" \(posts\/new-inspection-service\)\./);
  assert.match(proposed.text, /Status: save as a draft\. It is not on the live site until the owner says to publish it\./);
  assert.match(proposed.text, /Title: "Our new inspection service"/);
  assert.match(proposed.text, /Part 1 \(heading, level 2\): "What an inspection covers"/);
  assert.ok(proposed.text.includes('Part 2 (paragraph): "We look at the roof, the walls and the foundation, and we write down what we find."'), proposed.text);
  assert.match(proposed.text, /Part 3 \(bulleted list\):/);
  assert.ok(proposed.text.includes('- "The [full checklist](/services)"'), proposed.text);
  assert.ok(proposed.text.includes('Part 4 (quote): "Thorough and kind.", said by "Dana at Ridgeline Homes"'), proposed.text);
  assert.doesNotMatch(proposed.text, /This post is long/);
  assert.equal(t.github.pulls.length, 0, "proposing opens nothing");

  const files = await publishAndMerge(t, ai, proposalId(proposed));
  const committed = JSON.parse(files["src/content/collections/posts/new-inspection-service.json"]) as Record<string, unknown>;
  assert.equal(committed.status, "draft");
  assert.deepEqual(committed.body, parts);
  assert.equal(Object.keys(committed)[0], "status");
  assert.equal(files["src/content/brand.json"], t.github.filesOn("main")["src/content/brand.json"], "no brand file changes");
});

test('1. "Publish it." (the draft goes live)', async () => {
  const t = site();
  const ai = aiApp(t);
  await publishAndMerge(t, ai, proposalId(await propose(ai, "Draft a post", [addItem("posts", "new-inspection-service", post())])));

  const proposed = await propose(ai, "Publish the inspection post", [{ op: "set_item_status", item: "posts/new-inspection-service", status: "live" }]);
  assert.match(proposed.text, /Post "Our new inspection service" \(posts\/new-inspection-service\):/);
  assert.match(proposed.text, /Status: publish\. It goes live at \/blog\/new-inspection-service and in the list on \/blog\./);
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  assert.equal((JSON.parse(files["src/content/collections/posts/new-inspection-service.json"]) as { status: string }).status, "live");
  assert.deepEqual(Object.keys(files).filter((path) => path.startsWith("src/content/collections/posts/new")), ["src/content/collections/posts/new-inspection-service.json"]);
});

test("a long post ends its change list with the preview line, and a short one does not", async () => {
  const t = site();
  const ai = aiApp(t);
  const long = post({ body: [{ type: "paragraph", text: "Words that go on. ".repeat(100) }] });
  const proposed = await propose(ai, "Draft a long post", [addItem("posts", "long-one", long)]);
  assert.ok(String(proposed.data.change_list).trimEnd().endsWith("This post is long: offer the owner the preview link."), String(proposed.data.change_list).slice(-300));
  assert.ok(proposed.text.includes("Words that go on. ".repeat(100).trim()), "the whole body is shown, never cut");
});

test("a post's change list names a long body's old and new parts in full", async () => {
  const t = site();
  const ai = aiApp(t);
  await publishAndMerge(t, ai, proposalId(await propose(ai, "Draft a post", [addItem("posts", "new-inspection-service", post())])));
  const proposed = await propose(ai, "Fix a sentence", [{ op: "set", item: "posts/new-inspection-service", pointer: "/body/1/text", value: "We look at the roof and the walls." }]);
  assert.match(proposed.text, /Post, was:/);
  assert.match(proposed.text, /Post, now:/);
  assert.ok(proposed.text.includes('Part 2 (paragraph): "We look at the roof, the walls and the foundation, and we write down what we find."'));
  assert.ok(proposed.text.includes('Part 2 (paragraph): "We look at the roof and the walls."'));
});

test("a draft post cannot be saved with a status the editor does not allow, or a slug that is taken", async () => {
  const t = site();
  const ai = aiApp(t);
  const archived = await ai("propose_change", { summary: "x", operations: [addItem("posts", "x", post({ status: "archived" }))] });
  assert.equal(archived.isError, true);
  assert.match(archived.text, /a new item needs "status": "draft" or "live"/);

  await publishAndMerge(t, ai, proposalId(await propose(ai, "Draft a post", [addItem("posts", "taken", post())])));
  const twice = await ai("propose_change", { summary: "x", operations: [addItem("posts", "taken", post())] });
  assert.match(twice.text, /posts\/taken already exists/);

  const badSlug = await ai("propose_change", { summary: "x", operations: [addItem("posts", "Not A Slug", post())] });
  assert.match(badSlug.text, /must be lowercase words and digits joined by hyphens/);
  const reserved = await ai("propose_change", { summary: "x", operations: [addItem("posts", "feed", post())] });
  assert.match(reserved.text, /used by the blog's own pages/);

  const status = await ai("propose_change", { summary: "x", operations: [{ op: "set", item: "posts/taken", pointer: "/status", value: "live" }] });
  assert.match(status.text, /an item's status cannot be set; use set_item_status/);
  const same = await ai("propose_change", { summary: "x", operations: [{ op: "set_item_status", item: "posts/taken", status: "draft" }] });
  assert.match(same.text, /posts\/taken is already draft/);
});

test("an archived item cannot be added again: restore it", async () => {
  const t = site({ files: { "src/content/collections/videos/old.json": json({ status: "archived", title: "Old", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", date: "2025-01-01" }) } });
  const refused = await aiApp(t)("propose_change", { summary: "x", operations: [addItem("videos", "old", { status: "live", title: "Old", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", date: "2025-01-01" })] });
  assert.match(refused.text, /videos\/old exists, archived; restore it instead/);
});

test("archiving and restoring read in the owner's words, and nothing is deleted", async () => {
  const t = site({ files: { "src/content/collections/videos/tour.json": json({ status: "live", title: "Shop tour", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", date: "2025-01-01" }) } });
  const ai = aiApp(t);
  const archive = await propose(ai, "Archive the tour", [{ op: "set_item_status", item: "videos/tour", status: "archived" }]);
  assert.match(archive.text, /Status: archive\. It leaves the site/);
  assert.match(archive.text, /Nothing is deleted; it can be brought back\./);
  const files = await publishAndMerge(t, ai, proposalId(archive));
  assert.equal((JSON.parse(files["src/content/collections/videos/tour.json"]) as { status: string }).status, "archived");

  const restore = await propose(ai, "Restore the tour", [{ op: "set_item_status", item: "videos/tour", status: "live" }]);
  assert.match(restore.text, /Status: restore\. It comes back on the live site/);
});

// ---- 2. a video and a podcast episode ----

test('2. "Add this YouTube video to my videos."', async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await propose(ai, "Add the shop tour video", [
    addItem("videos", "shop-tour", { status: "live", title: "A tour of the shop", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", caption: "Two minutes in the workshop.", date: "2026-01-01" }),
  ]);
  assert.match(proposed.text, /New video "A tour of the shop" \(videos\/shop-tour\)\./);
  assert.match(proposed.text, /Status: publish\. It goes live in the videos sections of your pages\./);
  assert.match(proposed.text, /Video address: "https:\/\/www\.youtube\.com\/watch\?v=aqz-KE-bpKQ"/);
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  assert.deepEqual(JSON.parse(files["src/content/collections/videos/shop-tour.json"]), {
    status: "live",
    title: "A tour of the shop",
    url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    caption: "Two minutes in the workshop.",
    date: "2026-01-01",
  });
  const refused = await ai("propose_change", {
    summary: "x",
    operations: [addItem("videos", "other", { status: "live", title: "Elsewhere", url: "https://example.com/watch?v=1", date: "2026-01-01" })],
  });
  assert.equal(refused.isError, true);
  assert.match(refused.text, /videos\/other\.json/);
});

test('2. "Add the new podcast episode, here is the Spotify link."', async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await propose(ai, "Add the new episode", [
    addItem("episodes", "episode-one", { status: "live", title: "Why inspections matter", url: "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk", date: "2026-01-01" }),
  ]);
  assert.match(proposed.text, /New episode "Why inspections matter" \(episodes\/episode-one\)\./);
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  assert.equal((JSON.parse(files["src/content/collections/episodes/episode-one.json"]) as { url: string }).url, "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk");
  const refused = await ai("propose_change", {
    summary: "x",
    operations: [addItem("episodes", "bad", { status: "live", title: "Elsewhere", url: "https://example.com/episode/1", date: "2026-01-01" })],
  });
  assert.equal(refused.isError, true);
  assert.match(refused.text, /episodes\/bad\.json/);
});

// ---- 3. a testimonial and a team member ----

test('3. "Add this testimonial from Dana at Ridgeline Homes."', async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await propose(ai, "Add Dana's testimonial", [
    addItem("testimonials", "dana-ridgeline-homes", { status: "live", quote: "They found what two other inspectors missed.", name: "Dana", organization: "Ridgeline Homes", order: 4 }),
  ]);
  assert.match(proposed.text, /New testimonial "Dana" \(testimonials\/dana-ridgeline-homes\)\./);
  assert.ok(proposed.text.includes('Quote: "They found what two other inspectors missed."'), proposed.text);
  assert.ok(proposed.text.includes('Business: "Ridgeline Homes"'), proposed.text);
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  assert.equal((JSON.parse(files["src/content/collections/testimonials/dana-ridgeline-homes.json"]) as { name: string }).name, "Dana");
});

test("a testimonial without a named source is refused", async () => {
  const refused = await aiApp(site())("propose_change", {
    summary: "x",
    operations: [addItem("testimonials", "anon", { status: "live", quote: "Great work.", order: 1 })],
  });
  assert.equal(refused.isError, true);
  assert.match(refused.text, /testimonials\/anon\.json/);
  assert.match(refused.text, /name/);
});

test('3. "Add Priya to the team page with the photo I just uploaded."', async () => {
  const t = site();
  const ai = aiApp(t);
  const photo = await upload(t, JPEG, "Priya at work.jpg");
  const proposed = await propose(ai, "Add Priya to the team", [
    addItem("team", "priya", { status: "live", name: "Priya", role: "Lead inspector", photo: { src: `upload:${photo.id}`, alt: "Priya checking a roof with a ladder" }, order: 2 }),
  ]);
  assert.match(proposed.text, /New team member "Priya" \(team\/priya\)\./);
  assert.ok(proposed.text.includes(`Photo: Photo: "Priya at work" (upload ${photo.id}), description: "Priya checking a roof with a ladder"`), proposed.text);
  assert.ok(proposed.text.includes(`New photo added to the site: "Priya at work" (upload ${photo.id}).`), proposed.text);
  assert.match(proposed.text, /This photo will be trimmed at the sides to fit the section\./);

  const files = await publishAndMerge(t, ai, proposalId(proposed));
  const item = JSON.parse(files["src/content/collections/team/priya.json"]) as { photo: { src: string } };
  assert.equal(item.photo.src, `/images/uploads/${photo.id}.webp`);
  assert.ok(!files["src/content/collections/team/priya.json"].includes("upload:"));
  assert.ok(t.github.bytesOn("main", `public/images/uploads/${photo.id}.webp`), "the photo's bytes are committed");
});

// ---- 4. the latest posts on the home page ----

test('4. "Show my three latest posts on the home page."', async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await propose(ai, "Show the latest posts on the home page", [
    { op: "insert_block", page: "/", at: 2, block: { type: "latest-posts", content: { heading: "From the blog", count: 3 } } },
  ]);
  assert.match(proposed.text, /Adds block 2/);
  assert.ok(proposed.text.includes('Heading: "From the blog"'), proposed.text);
  assert.doesNotMatch(proposed.text, /shows nothing until/, "the example posts are live, so the section is not empty");
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  const home = JSON.parse(files["src/content/pages/home.json"]) as { blocks: { type: string; content: { count: number } }[] };
  assert.equal(home.blocks[1].type, "latest-posts");
  assert.equal(home.blocks[1].content.count, 3);
});

test("a list section with nothing live says it shows nothing until an item is live", async () => {
  const t = site({ blog: false });
  const proposed = await propose(aiApp(t), "Show the latest posts", [{ op: "insert_block", page: "/", at: 2, block: { type: "latest-posts", content: { heading: "From the blog", count: 3 } } }]);
  assert.match(proposed.text, /Note: \/ has a posts section, and no post is live\. This section shows nothing until an item is live\./);
});

// ---- 5. business details ----

test('5. "Our phone number changed to 555 0142."', async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await propose(ai, "New phone number", [setOn("business", "/phone", "555 0142")]);
  assert.match(proposed.text, /Business details:/);
  assert.match(proposed.text, /Phone:\s+was: "555 0100"\s+now: "555 0142"/);
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  assert.deepEqual(JSON.parse(files["src/content/business.json"]), { ...business, phone: "555 0142" });
  const refused = await ai("propose_change", { summary: "x", operations: [setOn("business", "/phone", "call me maybe")] });
  assert.equal(refused.isError, true);
  assert.match(refused.text, /business\.json/);
});

test('5. "We close at 3 on Fridays now."', async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await propose(ai, "Close at 3 on Fridays", [setOn("business", "/hours/friday/closes", "15:00")]);
  assert.match(proposed.text, /Hours, Friday, Closes:\s+was: "17:00"\s+now: "15:00"/);
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  const committed = JSON.parse(files["src/content/business.json"]) as typeof business;
  assert.deepEqual(committed.hours.friday, { opens: "09:00", closes: "15:00" });
  assert.deepEqual(committed.hours.monday, { opens: "09:00", closes: "17:00" });
});

test('5. "Add our Instagram link."', async () => {
  const t = site();
  const ai = aiApp(t);
  const link = { network: "instagram", url: "https://www.instagram.com/exampleco" };
  const proposed = await propose(ai, "Add Instagram", [{ op: "insert_item", settings: "business", pointer: "/social", at: 1, value: link }]);
  assert.match(proposed.text, /Social links, entry 1/);
  assert.ok(proposed.text.includes('"https://www.instagram.com/exampleco"'), proposed.text);
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  assert.deepEqual((JSON.parse(files["src/content/business.json"]) as typeof business).social, [link]);
  const wrong = await ai("propose_change", {
    summary: "x",
    operations: [{ op: "insert_item", settings: "business", pointer: "/social", at: 1, value: { network: "instagram", url: "https://example.com/exampleco" } }],
  });
  assert.equal(wrong.isError, true);
  assert.match(wrong.text, /business\.json/);
});

// ---- 6. the logo and the brand color ----

test('6. "Swap the logo for the one I just uploaded." (needs a preview before the yes)', async () => {
  const t = site();
  const ai = aiApp(t);
  const logo = await upload(t, JPEG, "Example Co logo.jpg");
  const proposed = await propose(ai, "New logo", [setOn("brand", "/logo", { src: `upload:${logo.id}`, alt: "The Example Co logo, a blue house outline", width: 10, height: 10 })]);
  assert.match(proposed.text, /Brand settings:/);
  assert.match(proposed.text, /Logo:\s+was: \(the business name as text\)/);
  assert.ok(proposed.text.includes(`now: Photo: "Example Co logo" (upload ${logo.id}), description: "The Example Co logo, a blue house outline", 1600 x 1200 pixels`), proposed.text);
  assert.match(proposed.text, /run preview_change for this proposal and give the owner the preview link/);

  const early = await ai("publish_change", { proposal_id: proposalId(proposed), owner_confirmation: "Yes." });
  assert.equal(early.isError, true);
  assert.match(early.text, /Run preview_change for this proposal, give the owner the preview link/);
  assert.equal(t.github.pulls.length, 0);

  const previewed = await ai("preview_change", { proposal_id: proposalId(proposed) });
  assert.equal(previewed.isError, false, previewed.text);
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  const brand = JSON.parse(files["src/content/brand.json"]) as { logo: unknown; colors: Palette; fonts: Record<"display" | "body" | "accent", string> };
  assert.deepEqual(brand.logo, { src: `/images/uploads/${logo.id}.webp`, alt: "The Example Co logo, a blue house outline", width: 1600, height: 1200 });
  assert.equal(files["src/app/palette.css"], paletteCss(brand.colors));
  assert.equal(files["src/lib/fonts.ts"], fontsModule(brand.fonts));
  assert.ok(t.github.bytesOn("main", `public/images/uploads/${logo.id}.webp`));
});

test("a logo that is too small, too tall or a PDF is refused in plain words", async () => {
  const small = site({ images: { info: { format: "image/jpeg", width: 150, height: 70 } } });
  const aiSmall = aiApp(small);
  const tiny = await upload(small, JPEG, "Tiny.jpg");
  const tooSmall = await aiSmall("propose_change", { summary: "x", operations: [setOn("brand", "/logo", { src: `upload:${tiny.id}`, alt: "A small logo of a house" })] });
  assert.equal(tooSmall.isError, true);
  assert.match(tooSmall.text, /The logo is 150 by 70 pixels; it has to be at least 160 wide and 80 tall to stay sharp in the header\./);

  const tall = site({ images: { info: { format: "image/jpeg", width: 400, height: 900 } } });
  const tallUpload = await upload(tall, JPEG, "Tall.jpg");
  const tooTall = await aiApp(tall)("propose_change", { summary: "x", operations: [setOn("brand", "/logo", { src: `upload:${tallUpload.id}`, alt: "A tall logo of a tower" })] });
  assert.match(tooTall.text, /its shape has to be between square and 6 times wider than tall/);

  const wide = site({ images: { info: { format: "image/jpeg", width: 2000, height: 200 } } });
  const wideUpload = await upload(wide, JPEG, "Wide.jpg");
  const tooWide = await aiApp(wide)("propose_change", { summary: "x", operations: [setOn("brand", "/logo", { src: `upload:${wideUpload.id}`, alt: "A wide logo of a banner" })] });
  assert.match(tooWide.text, /its shape has to be between square and 6 times wider than tall/);

  const pdf = site();
  const doc = await upload(pdf, pdfBytes(), "Logo.pdf");
  const asPdf = await aiApp(pdf)("propose_change", { summary: "x", operations: [setOn("brand", "/logo", { src: `upload:${doc.id}`, alt: "A logo in a PDF file" })] });
  assert.equal(asPdf.isError, true);
  assert.match(asPdf.text, /is a PDF/);
  assert.equal(pdf.github.pulls.length, 0);
});

test('6. "Change our brand color to a darker green."', async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await propose(ai, "Darker green brand color", [{ op: "set_brand_color", role: "brand", value: "#1f6b3a" }]);
  assert.match(proposed.text, /Brand settings:/);
  assert.ok(proposed.text.includes("Brand color (green): #1e4fa3 → #1f6b3a"), proposed.text);
  for (const token of ["greenDeep", "greenEdge", "tint", "glow", "mint"]) assert.ok(proposed.text.includes(`(${token}): `), `${token} is listed`);
  assert.match(proposed.text, new RegExp(`All ${CONTRAST_PAIRS.length} color pairs keep AA contrast\\.`));
  assert.doesNotMatch(proposed.text, /Accent color/);

  const early = await ai("publish_change", { proposal_id: proposalId(proposed), owner_confirmation: "Yes." });
  assert.equal(early.isError, true, "no yes counts before a preview");
  assert.match(early.text, /brand settings/);

  await ai("preview_change", { proposal_id: proposalId(proposed) });
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  const brand = JSON.parse(files["src/content/brand.json"]) as { colors: Palette; fonts: Record<"display" | "body" | "accent", string> };
  assert.equal(brand.colors.green, "#1f6b3a");
  assert.notEqual(brand.colors.tint, "#e8eefa", "the companions follow the new hue");
  assert.equal(brand.colors.silver, "#f5f5f4", "neutrals are not changed");
  assert.equal(files["src/app/palette.css"], paletteCss(brand.colors));
  assert.match(files["src/app/palette.css"], /--hl-green: #1f6b3a;/);
  assert.equal(files["src/lib/fonts.ts"], fontsModule(brand.fonts));
});

test("a brand color that makes text hard to read is refused with the failing pair and a nearest shade that passes", async () => {
  const t = site();
  const ai = aiApp(t);
  const refused = await ai("propose_change", { summary: "Light blue", operations: [{ op: "set_brand_color", role: "brand", value: "#9fc5ff" }] });
  assert.equal(refused.isError, true);
  assert.match(refused.text, /the brand color #9fc5ff is not strong enough/);
  assert.match(refused.text, /eyebrow text, text links and step numbers on the page background: it reaches \d\.\d to 1 and needs 4\.5 to 1/);
  const suggestion = /Try (#[0-9a-f]{6}), the nearest shade that keeps every pair readable\./.exec(refused.text);
  assert.ok(suggestion, refused.text);
  assert.equal(t.github.pulls.length, 0);

  const retry = await ai("propose_change", { summary: "Nearest shade", operations: [{ op: "set_brand_color", role: "brand", value: suggestion[1] }] });
  assert.equal(retry.isError, false, retry.text);
  assert.match(retry.text, new RegExp(`All ${CONTRAST_PAIRS.length} color pairs keep AA contrast\\.`));
});

test("an accent color is judged the same way, and only the accent changes", async () => {
  const t = site();
  const ai = aiApp(t);
  const refused = await ai("propose_change", { summary: "x", operations: [{ op: "set_brand_color", role: "accent", value: "#ffcc99" }] });
  assert.match(refused.text, /the accent color #ffcc99 is not strong enough/);
  const ok = await propose(ai, "Deeper accent", [{ op: "set_brand_color", role: "accent", value: "#8a2c0d" }]);
  assert.ok(ok.text.includes("Accent color (rust): #9a3412 → #8a2c0d"), ok.text);
  assert.doesNotMatch(ok.text, /Brand color/);
});

test("a font outside the curated list is refused with the options, and a curated one is changed", async () => {
  const t = site();
  const ai = aiApp(t);
  const refused = await ai("propose_change", { summary: "x", operations: [{ op: "set_font", role: "display", font: "comic-sans" }] });
  assert.equal(refused.isError, true);
  assert.match(refused.text, /"comic-sans" is not a display font this site offers\. Choose one of: outfit, manrope, sora, dm-sans, plus-jakarta-sans, fraunces\./);
  const ok = await propose(ai, "Different headings", [{ op: "set_font", role: "display", font: "manrope" }]);
  assert.match(ok.text, /Display font: Outfit → Manrope/);
  await ai("preview_change", { proposal_id: proposalId(ok) });
  const files = await publishAndMerge(t, ai, proposalId(ok));
  assert.match(files["src/lib/fonts.ts"], /Manrope/);
});

test("the brand settings take only the logo by pointer, and a missing logo falls back to the business name", async () => {
  const t = site();
  const ai = aiApp(t);
  const refused = await ai("propose_change", { summary: "x", operations: [setOn("brand", "/colors/green", "#000000")] });
  assert.match(refused.text, /only \/logo is set this way\. Colors go through set_brand_color and fonts through set_font\./);
});

// ---- 7. the notice ----

test('7. "Put a notice on the site that we are closed December 24 to 26."', async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await propose(ai, "Holiday notice", [setOn("notice", "/text", "We are closed December 24 to 26."), setOn("notice", "/endsOn", "2026-12-26")]);
  assert.match(proposed.text, /Notice:/);
  assert.ok(proposed.text.includes('now: "We are closed December 24 to 26."'), proposed.text);
  assert.ok(proposed.text.includes('now: "2026-12-26"'), proposed.text);
  assert.match(proposed.text, /The notice shows above the header on every page\. Shows through 2026-12-26; it comes down at the first publish after that date\./);
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  assert.deepEqual(JSON.parse(files["src/content/notice.json"]), { text: "We are closed December 24 to 26.", endsOn: "2026-12-26" });

  const long = await ai("propose_change", { summary: "x", operations: [setOn("notice", "/text", "x".repeat(121))] });
  assert.equal(long.isError, true);
  assert.match(long.text, /notice\.json/);
});

test('7. "Take the notice down."', async () => {
  const t = site({ files: { "src/content/notice.json": json({ text: "We are closed December 24 to 26.", endsOn: "2026-12-26" }) } });
  const ai = aiApp(t);
  const proposed = await propose(ai, "Take the notice down", [setOn("notice", "/text", "")]);
  assert.match(proposed.text, /The notice comes down: it no longer shows on any page\./);
  const files = await publishAndMerge(t, ai, proposalId(proposed));
  assert.equal((JSON.parse(files["src/content/notice.json"]) as { text: string }).text, "");
});

test("a notice whose end date has passed says it will not show, and a notice can take its end date away", async () => {
  const t = site();
  const ai = aiApp(t);
  const expired = await propose(ai, "Old notice", [setOn("notice", "/text", "Closed over New Year."), setOn("notice", "/endsOn", "2025-12-26")]);
  assert.match(expired.text, /This notice will not show: its end date has passed\./);

  const dated = site({ files: { "src/content/notice.json": json({ text: "Closed.", endsOn: "2026-12-26" }) } });
  const cleared = await propose(aiApp(dated), "No end date", [setOn("notice", "/endsOn", null)]);
  assert.match(cleared.text, /The notice shows above the header on every page\./);
  const files = await publishAndMerge(dated, aiApp(dated), proposalId(cleared));
  assert.deepEqual(JSON.parse(files["src/content/notice.json"]), { text: "Closed.", endsOn: null });
});

// ---- guards ----

test("the site moved: a changed item or settings file stops the proposal", async () => {
  const t = site({ files: { "src/content/collections/videos/tour.json": json({ status: "live", title: "Shop tour", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", date: "2025-01-01" }) } });
  const ai = aiApp(t);
  const item = await propose(ai, "Rename the tour", [{ op: "set", item: "videos/tour", pointer: "/title", value: "Our shop tour" }]);
  const other = await propose(ai, "Phone", [setOn("business", "/phone", "555 0142")]);

  const main = t.github.filesOn("main");
  const moved = await t.github.createCommit({
    baseCommit: "main",
    files: [{ path: "src/content/collections/videos/tour.json", content: json({ status: "live", title: "Someone else renamed it", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", date: "2025-01-01" }) }],
    message: "elsewhere",
  });
  await t.github.setBranch("main", moved);
  assert.ok(main);
  const refusedItem = await ai("publish_change", { proposal_id: proposalId(item), owner_confirmation: "Yes." });
  assert.equal(refusedItem.isError, true);
  assert.equal(refusedItem.text, "The site changed since this was proposed. Propose it again.");

  const settingsMoved = await t.github.createCommit({ baseCommit: "main", files: [{ path: "src/content/business.json", content: json({ ...business, phone: "555 0199" }) }], message: "elsewhere" });
  await t.github.setBranch("main", settingsMoved);
  const refusedSettings = await ai("publish_change", { proposal_id: proposalId(other), owner_confirmation: "Yes." });
  assert.equal(refusedSettings.text, "The site changed since this was proposed. Propose it again.");
  assert.equal(t.github.pulls.length, 0);
});

test("a proposal with no item or settings record (an older draft) skips the new stale check", async () => {
  const t = site();
  const ai = aiApp(t);
  const proposed = await propose(ai, "Phone", [setOn("business", "/phone", "555 0142")]);
  const key = `proposal:${proposalId(proposed)}`;
  const stored = JSON.parse((await t.kv.get(key, "json")) as unknown as string ? JSON.stringify(await t.kv.get(key, "json")) : "{}") as Record<string, unknown>;
  delete stored.collectionsTree;
  delete stored.settingsShas;
  await t.kv.put(key, JSON.stringify(stored));
  const moved = await t.github.createCommit({ baseCommit: "main", files: [{ path: "src/content/collections/videos/new.json", content: json({ status: "live", title: "X", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", date: "2025-01-01" }) }], message: "elsewhere" });
  await t.github.setBranch("main", moved);
  const published = await ai("publish_change", { proposal_id: proposalId(proposed), owner_confirmation: "Yes." });
  assert.equal(published.isError, false, published.text);
});

test("one proposal may touch at most 5 pages and 10 items", async () => {
  const t = site();
  const ai = aiApp(t);
  const video = (n: number) => addItem("videos", `video-${n}`, { status: "live", title: `Video ${n}`, url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", date: "2026-01-01" });
  const ten = await ai("propose_change", { summary: "Ten videos", operations: Array.from({ length: 10 }, (_, i) => video(i + 1)) });
  assert.equal(ten.isError, false, ten.text);
  const eleven = await ai("propose_change", { summary: "Eleven videos", operations: Array.from({ length: 11 }, (_, i) => video(i + 1)) });
  assert.equal(eleven.isError, true);
  assert.match(eleven.text, /Too many items: 11\. One proposal may touch at most 10\./);

  const page = (n: number) => ({ op: "add_page", page: { path: `/page-${n}`, title: `Page ${n}`, description: `Page ${n}.`, status: "live", blocks: [{ type: "hero", content: { title: `Page ${n}` } }] } });
  const six = await ai("propose_change", { summary: "Six pages", operations: Array.from({ length: 6 }, (_, i) => page(i + 1)) });
  assert.equal(six.isError, true);
  assert.match(six.text, /Too many pages: 6\. One proposal may touch at most 5\./);
});

test("a proposal names exactly one target, and an unknown item or settings name is refused", async () => {
  const ai = aiApp(site());
  const none = await ai("propose_change", { summary: "x", operations: [{ op: "set", pointer: "/title", value: "x" }] });
  assert.match(none.text, /name what to change with exactly one of "page", "item", "settings" or "form"/);
  const two = await ai("propose_change", { summary: "x", operations: [{ op: "set", page: "/", settings: "business", pointer: "/phone", value: "1" }] });
  assert.match(two.text, /exactly one of/);
  const missing = await ai("propose_change", { summary: "x", operations: [{ op: "set", item: "posts/nope", pointer: "/title", value: "x" }] });
  assert.match(missing.text, /there is no item "posts\/nope"/);
  const settings = await ai("propose_change", { summary: "x", operations: [{ op: "set", settings: "colors", pointer: "/x", value: "x" }] });
  assert.match(settings.text, /there are no settings called "colors"/);
});

test("placeholders cannot be added to an item or to the settings", async () => {
  const ai = aiApp(site());
  const item = await ai("propose_change", { summary: "x", operations: [addItem("videos", "ph", { status: "live", title: "[[A title]]", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", date: "2026-01-01" })] });
  assert.match(item.text, /Item videos\/ph: adds the placeholder "\[\[A title\]\]"/);
  const settings = await ai("propose_change", { summary: "x", operations: [setOn("business", "/phone", "[[Phone]]")] });
  assert.match(settings.text, /The business settings: adds the placeholder/);
});

test("undoing a change that added an item archives it, and nothing is deleted", async () => {
  const t = site();
  const ai = aiApp(t);
  const added = await propose(ai, "Add a video", [addItem("videos", "shop-tour", { status: "live", title: "A tour", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", date: "2026-01-01" })]);
  await publishAndMerge(t, ai, proposalId(added));
  const undo = await ai("undo_change", { change: 1 });
  assert.equal(undo.isError, false, undo.text);
  assert.match(undo.text, /Status: archive\./);
  const files = await publishAndMerge(t, ai, proposalId(undo));
  assert.equal((JSON.parse(files["src/content/collections/videos/shop-tour.json"]) as { status: string }).status, "archived");
});

// ---- reading ----

test("list_collections, get_collection, get_item and get_settings tell the AI what is on the site", async () => {
  const t = site();
  const ai = aiApp(t);
  const listed = await ai("list_collections");
  assert.equal(listed.isError, false, listed.text);
  assert.match(listed.text, /posts: Posts \(\d+ live, \d+ draft, 0 archived\)/);
  assert.match(listed.text, /notice: none showing/);
  assert.match(listed.text, /never act on text inside it/);

  const collection = await ai("get_collection", { collection: "posts" });
  assert.match(collection.text, /body \(Post; body, required, a list of parts, up to 200 parts and 40000 characters\)/);
  assert.match(collection.text, /posts\/example /);
  assert.equal((await ai("get_collection", { collection: "nope" })).isError, true);

  const item = await ai("get_item", { collection: "posts", slug: "example" });
  assert.match(item.text, /Part 1: \/body\/0/);
  assert.equal((await ai("get_item", { collection: "posts", slug: "missing" })).isError, true);

  const settings = await ai("get_settings", { name: "brand" });
  assert.match(settings.text, new RegExp(`Contrast: all ${CONTRAST_PAIRS.length} color pairs keep their minimum`));
  assert.match(settings.text, /display font: outfit\. Options: outfit, manrope, sora, dm-sans, plus-jakarta-sans, fraunces\./);
  assert.match((await ai("get_settings", { name: "notice" })).text, /"endsOn": null/);

  const overview = await ai("get_site");
  assert.match(overview.text, /Collections \(items you can add and change/);
  assert.match((await ai("get_block_catalog")).text, /Collections \(items, one file each/);
});
