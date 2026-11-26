import assert from "node:assert/strict";
import { test } from "node:test";
import { defineBlock } from "../src/blocks/schema.ts";
import {
  END_MARKER,
  LANES_FILE,
  MARKDOWN_FILE,
  JSON_FILE,
  START_MARKER,
  buildCatalog,
  generatedFiles,
  placementWords,
  renderBlocksMarkdown,
  renderJson,
  renderLanesList,
  replaceBetweenMarkers,
  staleFiles,
  staleMessage,
} from "./blocks-catalog.mjs";

const hero = defineBlock({
  type: "hero",
  title: "Hero",
  description: "Opens a page with a headline.",
  source: "library",
  fields: {
    title: { kind: "text", label: "Headline", max: 80, help: "The page's one main heading." },
    action: { kind: "action", label: "Button", labelMax: 30, required: false },
  },
  variants: [{ name: "default", description: "Left-aligned." }],
  placement: { position: "first", maxPerPage: 1, rhythm: "hero" },
  motion: { entrance: "none", reason: "It is the first paint." },
  example: { title: "A headline" },
});

const gallery = defineBlock({
  type: "gallery",
  title: "Gallery",
  description: "A few pictures with captions.",
  source: "library",
  fields: {
    items: {
      kind: "list",
      label: "Pictures",
      min: 1,
      max: 4,
      of: { kind: "object", label: "Picture", fields: { photo: { kind: "image", label: "Photo", shape: "3:2" }, caption: { kind: "text", label: "Caption", max: 50, required: false } } },
    },
  },
  variants: [
    { name: "grid", description: "A grid." },
    { name: "row", description: "One row." },
  ],
  placement: { position: "any", maxPerPage: 2, rhythm: "section", joinsHero: true },
  motion: { entrance: "default", signature: { keyframes: "spin", reason: "It spins." } },
  fixedAnchor: "pictures",
  example: { items: [{ photo: { src: "/images/a.jpg", alt: "A cat on a mat" } }] },
});

const registry = [hero, gallery];

test("catalog has the expected shape and key order", () => {
  const catalog = buildCatalog(registry);
  assert.deepEqual(Object.keys(catalog), ["version", "generatedBy", "pageRules", "blocks", "collections", "settings"]);
  assert.equal(catalog.version, 1);
  assert.equal(catalog.generatedBy, "npm run blocks:catalog");
  assert.equal(catalog.blocks.length, 2);
  const [h, g] = catalog.blocks;
  assert.deepEqual(Object.keys(h), ["type", "title", "description", "source", "variants", "placement", "motion", "fixedAnchor", "interactive", "fields", "example"]);
  assert.deepEqual(h.variants, [{ name: "default", description: "Left-aligned.", default: true }]);
  assert.deepEqual(h.placement, { position: "first", maxPerPage: 1, rhythm: "hero", joinsHero: false });
  assert.deepEqual(h.motion, { entrance: "none", reason: "It is the first paint.", signature: null });
  assert.deepEqual(h.fields[0], { name: "title", kind: "text", label: "Headline", help: "The page's one main heading.", required: true, max: 80 });
  assert.equal(h.fields[1].required, false);
  assert.equal(h.fields[1].labelMax, 30);
  assert.equal(g.fixedAnchor, "pictures");
  assert.equal(g.motion.signature.keyframes, "spin");
  assert.equal(g.variants[1].default, false);
  assert.deepEqual(g.fields[0].items, { min: 1, max: 4 });
  assert.equal(g.fields[0].of.fields[0].name, "photo");
});

test("page rules take their numbers from the constants", () => {
  const { pageRules } = buildCatalog(registry);
  assert.equal(pageRules.menu.maxHeaderLinks, 6);
  assert.deepEqual(pageRules.requiredLivePages, ["/", "/contact"]);
  assert.ok(pageRules.video.providers.includes("YouTube"));
  assert.ok(pageRules.pageKeys.some((k) => k.key === "blocks"));
  assert.ok(pageRules.reservedPaths.includes("/blocks"));
});

test("json is deterministic, 2-space and ends with a newline", () => {
  const text = renderJson(buildCatalog(registry));
  assert.equal(text, renderJson(buildCatalog(registry)));
  assert.ok(text.endsWith("}\n"));
  assert.ok(text.startsWith('{\n  "version": 1,'));
});

test("markdown names every block, says it is generated and shows the example", () => {
  const md = renderBlocksMarkdown(buildCatalog(registry));
  assert.match(md, /generated/i);
  assert.match(md, /npm run blocks:catalog/);
  assert.match(md, /## Page rules/);
  assert.match(md, /## Hero \(`hero`\)/);
  assert.match(md, /## Gallery \(`gallery`\)/);
  assert.match(md, /first on the page, once/);
  assert.match(md, /anywhere, up to 2 times/);
  assert.match(md, /\| `items\[\]\.photo` \|/);
  assert.match(md, /```json\n\{\n {2}"title": "A headline"/);
  assert.ok(md.endsWith("\n"));
});

test("placement words", () => {
  assert.equal(placementWords({ position: "last", maxPerPage: 1 }), "last on the page, once");
  assert.equal(placementWords({ position: "any", maxPerPage: 3, joinsHero: true }), "anywhere, up to 3 times; it sits close under the hero");
});

test("the lanes list has one bullet per block and no field names", () => {
  const list = renderLanesList(buildCatalog(registry));
  const bullets = list.split("\n").filter((l) => l.startsWith("- "));
  assert.equal(bullets.length, 2);
  assert.match(list, /\*\*Hero\*\*: Opens a page with a headline\.$/m);
  assert.match(list, /\*\*Gallery\*\*: A few pictures with captions\. \(You can choose a look: \*\*grid\*\*, a grid; \*\*row\*\*, one row\.\)/);
  assert.doesNotMatch(list, /labelMax|kind/);
});

const lanes = `# Lanes\n\nIntro.\n\n${START_MARKER}\nold list\n${END_MARKER}\n\nOutro.\n`;

test("replacing between markers keeps the rest of the file", () => {
  const out = replaceBetweenMarkers(lanes, "- **New**: thing.");
  assert.equal(out, `# Lanes\n\nIntro.\n\n${START_MARKER}\n- **New**: thing.\n${END_MARKER}\n\nOutro.\n`);
  assert.equal(replaceBetweenMarkers(out, "- **New**: thing."), out);
  assert.throws(() => replaceBetweenMarkers("no markers", "x"), /needs/);
});

test("--check logic names each stale file and the fix", () => {
  const disk = { [LANES_FILE]: lanes };
  const read = (path) => disk[path] ?? "";
  const expected = generatedFiles(registry, read);
  assert.deepEqual(Object.keys(expected), [JSON_FILE, MARKDOWN_FILE, LANES_FILE]);
  assert.deepEqual(staleFiles(expected, read), [JSON_FILE, MARKDOWN_FILE, LANES_FILE]);
  Object.assign(disk, expected);
  assert.deepEqual(staleFiles(generatedFiles(registry, read), read), []);
  assert.equal(staleMessage([]), null);
  disk[MARKDOWN_FILE] += "hand edit";
  const stale = staleFiles(generatedFiles(registry, read), read);
  assert.deepEqual(stale, [MARKDOWN_FILE]);
  const message = staleMessage(stale);
  assert.match(message, /docs\/BLOCKS\.md/);
  assert.match(message, /run npm run blocks:catalog/);
});

test("an image field shows its shape, and the page rules cover focus and files", () => {
  const catalog = buildCatalog(registry);
  assert.equal(catalog.blocks[1].fields[0].of.fields[0].shape, "3:2");
  assert.match(catalog.pageRules.images.rule, /optional focus: center, top, bottom, left or right/);
  assert.match(catalog.pageRules.files.rule, /\/files\/price-sheet-k3x9q2mz\.pdf/);
  const md = renderBlocksMarkdown(catalog);
  assert.match(md, /a picture under \/images\/ with real alt text, shape 3:2/);
  assert.match(md, /- \*\*Files\.\*\* A link may point to a PDF under \/files\//);
});

// ---- collections, settings and the new field kinds ---------------------------------------------------------------

test("the new field kinds are described in plain words with their limits", () => {
  const block = defineBlock({
    type: "kinds",
    title: "Kinds",
    description: "Every new field kind.",
    source: "library",
    fields: {
      when: { kind: "date", label: "When" },
      count: { kind: "number", label: "Count", min: 0, max: 999 },
      episode: { kind: "audio", label: "Episode" },
      body: { kind: "body", label: "Body", maxParts: 200, maxChars: 40000 },
    },
    variants: [{ name: "default", description: "Plain." }],
    placement: { position: "any", maxPerPage: 1, rhythm: "section" },
    motion: { entrance: "default" },
    example: { when: "2026-01-01", count: 1, episode: "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk", body: [] },
  });
  const catalog = buildCatalog([block]);
  const fields = catalog.blocks[0].fields;
  assert.deepEqual([fields[1].min, fields[1].max], [0, 999]);
  assert.deepEqual([fields[3].maxParts, fields[3].maxChars], [200, 40000]);
  const md = renderBlocksMarkdown(catalog);
  assert.match(md, /\| `when` \| When \| yes \| a date, YYYY-MM-DD \|/);
  assert.match(md, /\| `count` \| Count \| yes \| a whole number from 0 to 999 \|/);
  assert.match(md, /\| `episode` \| Episode \| yes \| a Spotify or Apple Podcasts episode link \|/);
  assert.match(md, /\| `body` \| Body \| yes \| up to 200 parts and 40000 characters: headings, paragraphs, lists, quotes and photos \|/);
});

test("the catalog has a Collections section: every kind with fields, limits, sort and an example", () => {
  const catalog = buildCatalog([hero]);
  assert.deepEqual(catalog.collections.map((c) => c.kind), ["posts", "videos", "episodes", "testimonials", "team"]);
  const posts = catalog.collections[0];
  assert.match(posts.sort, /Newest date first/);
  assert.equal(posts.fields.find((f) => f.name === "body").kind, "body");
  assert.equal(posts.example.status, "live");
  const md = renderBlocksMarkdown(catalog);
  assert.match(md, /^## Collections$/m);
  assert.match(md, /^### Posts \(`posts`\)$/m);
  assert.match(md, /\*\*File\.\*\* `src\/content\/collections\/team\/<slug>\.json`/);
  assert.match(md, /\*\*Sort\.\*\* By the item's order number/);
  assert.match(md, /\| `date` \| Date\. The day the post was written, like 2026-03-27\. \| yes \| a date, YYYY-MM-DD \|/);
  assert.match(md, /\| `order` \| Order\. Lower numbers come first\. \| yes \| a whole number from 0 to 999 \|/);
});

test("the catalog has a Settings section: business, brand (roles, contrast, fonts) and notice", () => {
  const catalog = buildCatalog([hero]);
  const { business, brand, notice } = catalog.settings;
  assert.deepEqual(business.fields.map((f) => f.name), ["name", "phone", "email", "address", "hours", "hoursNote", "social"]);
  assert.deepEqual(brand.colorRoles.map((r) => r.role), ["brand", "accent", "neutrals"]);
  assert.deepEqual(brand.colorRoles[0].tokens, ["green", "greenDeep", "greenEdge", "tint", "glow", "mint"]);
  assert.deepEqual(Object.keys(brand.fonts), ["display", "body", "accent"]);
  assert.ok(brand.fonts.display.some((f) => f.id === "outfit"));
  assert.match(brand.contrastRule, /4\.5 to 1/);
  assert.deepEqual(notice.fields.map((f) => f.name), ["text", "link", "endsOn"]);
  const md = renderBlocksMarkdown(catalog);
  assert.match(md, /^## Settings$/m);
  assert.match(md, /^### Business \(`src\/content\/business\.json`\)$/m);
  assert.match(md, /^### Brand \(`src\/content\/brand\.json`\)$/m);
  assert.match(md, /\*\*Contrast rule\.\*\*/);
  assert.match(md, /^- `display`: outfit \(Outfit\)|^- `display`: outfit, /m);
  assert.match(md, /^### Notice \(`src\/content\/notice\.json`\)$/m);
});

test("the page rules name the audio providers next to the video ones", () => {
  const rules = buildCatalog([hero]).pageRules;
  assert.deepEqual(rules.audio.providers, ["Spotify", "Apple Podcasts"]);
  assert.match(renderBlocksMarkdown(buildCatalog([hero])), /- \*\*Audio\.\*\* An episode address must be from Spotify or Apple Podcasts/);
});
