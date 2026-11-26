// `npm run blocks:catalog`: writes docs/blocks.json and docs/BLOCKS.md from the block registry, and the list of sections
// in docs/EDITING-LANES.md (between the blocks:start / blocks:end markers). `--check` writes nothing and exits 1 naming each
// stale file. The pure functions are exported for tests; check-content.mjs runs the same check.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { audioProviders, embedOrigins, videoProviders } from "../src/blocks/embeds.ts";
import { collections } from "../src/collections/definitions.ts";
import { CONTRAST_PAIRS } from "../src/brand/contrast-pairs.ts";
import { COMPANION_TOKENS } from "../src/brand/derive.ts";
import { CURATED_FONTS, FONT_ROLES } from "../src/brand/fonts.ts";
import { LOGO_MAX_RATIO, LOGO_MIN_HEIGHT, LOGO_MIN_WIDTH } from "../src/settings/brand.ts";
import { SOCIAL_NETWORKS, WEEKDAYS } from "../src/settings/business.ts";
import { BOOKING_LINK, GENERIC_ALT_WORDS, MENU_PLACES, REQUIRED_LIVE, RESERVED_PATHS } from "../src/blocks/schema.ts";
import { MAX_BLOCKS, MAX_HEADER_LINKS, MENU_LABEL_MAX, PAGE_KEYS, seoLimits } from "../src/blocks/validate.ts";

export const JSON_FILE = "docs/blocks.json";
export const MARKDOWN_FILE = "docs/BLOCKS.md";
export const LANES_FILE = "docs/EDITING-LANES.md";
export const FIX = "run npm run blocks:catalog";
export const START_MARKER = "<!-- blocks:start -->";
export const END_MARKER = "<!-- blocks:end -->";

const providerNames = videoProviders.map((p) => p.name);
const audioNames = audioProviders.map((p) => p.name);

export function pageRules() {
  return {
    pageFile: "One file per page in src/content/pages/. home.json is the home page (/); every other file is named after its one-segment path (services.json is /services). Paths are lowercase words joined by hyphens, one level deep, and each is used once.",
    pageKeys: PAGE_KEYS.map((key) => ({ key, ...pageKeyRule(key) })),
    menuKeys: [
      { key: "label", required: true, rule: `The words in the menu, 1 to ${MENU_LABEL_MAX} characters.` },
      { key: "order", required: true, rule: "A number; lower numbers come first." },
      { key: "places", required: true, rule: `Any of ${MENU_PLACES.map((p) => `"${p}"`).join(", ")}.` },
    ],
    blockKeys: [
      { key: "type", required: true, rule: "The name of a block in this catalog." },
      { key: "variant", required: false, rule: "One of the block's variants; the first is used when it is left out." },
      { key: "anchor", required: false, rule: "A lowercase name (letters, digits, hyphens; starts with a letter; at most 40 characters) that links can point to as /page#name. Unique on the page." },
      { key: "content", required: true, rule: "The block's fields, as listed in its entry." },
    ],
    status: {
      live: "The page is built, listed in the menu places it asks for, and in the sitemap.",
      archived: "The page leaves the build, the menu and the sitemap. The file and its content stay, and setting it back to live restores it. A link to an archived page fails the check.",
    },
    menu: {
      places: [...MENU_PLACES],
      maxHeaderLinks: MAX_HEADER_LINKS,
      rule: `A page appears in the menu only if it has a menu entry. At most ${MAX_HEADER_LINKS} live pages may be in the header.`,
    },
    firstBlock: "The first block must be a block whose position is \"first\" (the hero). It carries the page's one H1, so a page has exactly one.",
    focalAnimation: "At most one block per page may carry a signature (focal) animation.",
    text: "Text is plain. Only **bold** and [[placeholder]] marks are allowed. No HTML tags, no HTML entities, no markdown links and no control characters (line breaks, tabs, hidden characters).",
    links: {
      allowed: [
        "An internal path (/name) or a path with an anchor (/name#anchor) that points to a live page, and to an anchor that exists on it.",
        "An https:// address.",
        "A mailto: address.",
        "A tel: number.",
        `"${BOOKING_LINK}": the site's booking link (the scheduler when set, otherwise /contact#book).`,
      ],
      never: ["javascript:", "data:", "http:", "//host"],
    },
    images: {
      folder: "/images/",
      formats: ["jpg", "png", "webp"],
      rule: "An image is { src, alt } with an optional focus: center, top, bottom, left or right. The file must exist under /images/ and be a jpg, png or webp. Each image slot has a shape (3:2, 4:3, 4:5, 1:1 or 16:9) and the picture is cropped to it; focus says which part to keep. The alt text must really describe the picture, so it can't be empty or only a generic word.",
      genericAltWords: [...GENERIC_ALT_WORDS],
    },
    files: {
      folder: "/files/",
      rule: "A link may point to a PDF under /files/ that exists, such as /files/price-sheet-k3x9q2mz.pdf. Visitors download it.",
    },
    video: {
      providers: [...providerNames],
      rule: `A video address must be from ${providerNames.join(" or ")}. The player is rebuilt from the video's id, not from the address that was pasted. Allowed player origins: ${embedOrigins.join(", ")}.`,
      examples: videoProviders.map((p) => p.example),
    },
    audio: {
      providers: [...audioNames],
      rule: `An episode address must be from ${audioNames.join(" or ")}. The player is rebuilt from the episode's id, not from the address that was pasted.`,
      examples: audioProviders.map((p) => p.example),
    },
    reservedPaths: [...RESERVED_PATHS],
    requiredLivePages: [...REQUIRED_LIVE],
    limits: { maxBlocksPerPage: MAX_BLOCKS, titleMax: seoLimits().titleMax, descriptionMax: seoLimits().descriptionMax },
  };
}

function pageKeyRule(key) {
  switch (key) {
    case "path":
      return { required: true, rule: "\"/\" or a one-segment path like \"/services\". Must match the file name." };
    case "title":
      return { required: true, rule: `The page's search-result title, 1 to ${seoLimits().titleMax} characters.` };
    case "description":
      return { required: true, rule: `The page's search-result description, 1 to ${seoLimits().descriptionMax} characters.` };
    case "status":
      return { required: true, rule: "\"live\" or \"archived\"." };
    case "menu":
      return { required: false, rule: "Where the page appears in the menu: { label, order, places }." };
    case "blocks":
      return { required: true, rule: `The page's sections, in order: at most ${MAX_BLOCKS}.` };
    default:
      return { required: false, rule: "" };
  }
}

/** One field as the catalog holds it. `name` is left out for the item type of a list. */
function describeField(name, field) {
  const out = {};
  if (name !== undefined) out.name = name;
  out.kind = field.kind;
  out.label = field.label;
  if (field.help !== undefined) out.help = field.help;
  out.required = field.required !== false;
  if (field.kind === "text") {
    if (field.min !== undefined) out.min = field.min;
    out.max = field.max;
  }
  if (field.kind === "number") {
    out.min = field.min;
    out.max = field.max;
  }
  if (field.kind === "body") {
    out.maxParts = field.maxParts;
    out.maxChars = field.maxChars;
  }
  if (field.kind === "image") out.shape = field.shape;
  if (field.kind === "action") out.labelMax = field.labelMax;
  if (field.kind === "choice") out.options = [...field.options];
  if (field.kind === "list") {
    out.items = { min: field.min, max: field.max };
    if (field.together !== undefined) out.together = [...field.together];
    out.of = describeField(undefined, field.of);
  }
  if (field.kind === "object") out.fields = Object.entries(field.fields).map(([n, f]) => describeField(n, f));
  return out;
}

export function buildBlock(def) {
  return {
    type: def.type,
    title: def.title,
    description: def.description,
    source: def.source,
    variants: def.variants.map((v, i) => ({ name: v.name, description: v.description, default: i === 0 })),
    placement: {
      position: def.placement.position,
      maxPerPage: def.placement.maxPerPage,
      rhythm: def.placement.rhythm,
      joinsHero: def.placement.joinsHero === true,
    },
    motion: {
      entrance: def.motion.entrance,
      reason: def.motion.entrance === "none" ? def.motion.reason : null,
      signature: def.motion.signature ? { keyframes: def.motion.signature.keyframes, reason: def.motion.signature.reason } : null,
    },
    fixedAnchor: def.fixedAnchor ?? null,
    interactive: def.interactive ?? null,
    fields: Object.entries(def.fields).map(([n, f]) => describeField(n, f)),
    example: def.example,
  };
}

/** Each collection: what it is, its fields with limits, how it is sorted and an example item. */
export function buildCollections() {
  return collections.map((c) => ({
    kind: c.kind,
    title: c.title,
    singular: c.singular,
    description: c.description,
    file: `src/content/collections/${c.kind}/<slug>.json`,
    slug: "Lowercase words and digits joined by hyphens, 1 to 60 characters. It is the file name and, for a post, the address (/blog/<slug>).",
    status: "Every item has a status: draft (built only outside production), live, or archived (never shown, never deleted).",
    fields: Object.entries(c.fields).map(([n, f]) => describeField(n, f)),
    sort: c.sort === "date" ? "Newest date first." : "By the item's order number (lower first), then by its name.",
    labelField: c.labelField,
    example: { status: c.example[0].status, ...c.example[0].data },
  }));
}

/** The three settings files: what the owner may change in each. */
export function buildSettings() {
  const roleToken = { brand: ["green", ...COMPANION_TOKENS], accent: ["rust"] };
  return {
    business: {
      file: "src/content/business.json",
      description: "The business details every page can show: name, phone, email, address, hours and social links.",
      fields: [
        { name: "name", required: true, rule: "The business name, up to 80 characters." },
        { name: "phone", required: true, rule: 'A phone number: 7 to 20 digits, spaces and + ( ) - . only. "" for none.' },
        { name: "email", required: true, rule: 'One email address. "" for none.' },
        { name: "address", required: true, rule: "Up to 4 address lines, each up to 80 characters. [] for none." },
        { name: "hours", required: true, rule: `null (no hours shown) or all seven days (${WEEKDAYS.join(", ")}), each "closed" or { "opens": "09:00", "closes": "17:00" } in 24-hour time, closing after opening.` },
        { name: "hoursNote", required: false, rule: "A note under the hours, up to 120 characters." },
        { name: "social", required: true, rule: `Up to 8 links, each { "network", "url" }. Networks: ${SOCIAL_NETWORKS.map((n) => n.id).join(", ")}. The address must be https:// and on that network's own site.` },
      ],
    },
    brand: {
      file: "src/content/brand.json",
      description: "The colors, fonts and logo. src/app/palette.css and src/lib/fonts.ts are generated from it (npm run sync:config); never edit them by hand.",
      colorRoles: [
        { role: "brand", tokens: roleToken.brand, rule: "The brand color is `green`; its five companions are derived from it, keeping their lightness and softness and taking its hue." },
        { role: "accent", tokens: roleToken.accent, rule: "The accent color is `rust`." },
        { role: "neutrals", tokens: ["silver", "silver2", "white", "ink", "ink2", "line"], rule: "Text and background colors that Huston Logic sets; they are not changed by chat." },
      ],
      colorFormat: "#rrggbb",
      contrastRule: `Every foreground and background pair the design puts together must keep its contrast: ${CONTRAST_PAIRS.filter((p) => p.min === 4.5).length} text pairs need 4.5 to 1, and ${CONTRAST_PAIRS.filter((p) => p.min === 3).length} pairs (large text, icons, control edges, the focus ring) need 3 to 1. A color that fails is refused with the nearest one that works.`,
      fonts: Object.fromEntries(FONT_ROLES.map((role) => [role, CURATED_FONTS[role].map((f) => ({ id: f.id, label: f.label }))])),
      fontRule: "Each role takes one of its listed fonts, by id. The first of each role is the template default.",
      logo: {
        rule: `null (the business name is shown as text) or { src, alt, width, height }: an uploaded photo like /images/uploads/k3x9q2mz.webp with real alt text, at least ${LOGO_MIN_WIDTH} by ${LOGO_MIN_HEIGHT} pixels, between square and ${LOGO_MAX_RATIO} times wider than tall.`,
      },
    },
    notice: {
      file: "src/content/notice.json",
      description: "A one-line notice above the header, with an optional link and last day.",
      fields: [
        { name: "text", required: true, rule: 'The notice, up to 120 characters. "" for no notice.' },
        { name: "link", required: false, rule: "{ label, href }: the link words (up to 40 characters) and a link (see Page rules). It needs notice text." },
        { name: "endsOn", required: true, rule: "The last day it shows, YYYY-MM-DD, or null for no end date." },
      ],
    },
  };
}

export function buildCatalog(registry) {
  return {
    version: 1,
    generatedBy: "npm run blocks:catalog",
    pageRules: pageRules(),
    blocks: registry.map(buildBlock),
    collections: buildCollections(),
    settings: buildSettings(),
  };
}

export function renderJson(catalog) {
  return `${JSON.stringify(catalog, null, 2)}\n`;
}

// ---- Words ----

const lowerFirst = (s) => (s.length > 0 ? s[0].toLowerCase() + s.slice(1) : s);
const noPeriod = (s) => s.replace(/\.$/, "");
const times = (n) => (n === 1 ? "once" : `up to ${n} times`);

export function placementWords(placement) {
  let where;
  if (placement.position === "first") where = `first on the page, ${times(placement.maxPerPage)}`;
  else if (placement.position === "last") where = `last on the page, ${times(placement.maxPerPage)}`;
  else where = `anywhere, ${times(placement.maxPerPage)}`;
  return placement.joinsHero ? `${where}; it sits close under the hero` : where;
}

export function motionWords(motion) {
  const parts = [];
  if (motion.entrance === "none") parts.push(`No entrance motion. ${motion.reason}`);
  else parts.push("Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).");
  if (motion.signature) parts.push(`It carries the page's one focal animation (${motion.signature.keyframes}): ${motion.signature.reason}`);
  return parts.join(" ");
}

function limitsWords(f) {
  switch (f.kind) {
    case "text":
      return f.min !== undefined ? `${f.min} to ${f.max} characters` : `up to ${f.max} characters`;
    case "action":
      return `button words up to ${f.labelMax} characters, and a link`;
    case "link":
      return "a link (see Page rules)";
    case "image":
      return `a picture under /images/ with real alt text, shape ${f.shape}`;
    case "video":
      return `a ${providerNames.join(" or ")} address`;
    case "date":
      return "a date, YYYY-MM-DD";
    case "number":
      return `a whole number from ${f.min} to ${f.max}`;
    case "audio":
      return `a ${audioNames.join(" or ")} episode link`;
    case "form":
      return "the id of a live form (never the contact form)";
    case "body":
      return `up to ${f.maxParts} parts and ${f.maxChars} characters: headings, paragraphs, lists, quotes and photos`;
    case "boolean":
      return "yes or no";
    case "choice":
      return `one of ${f.options.map((o) => `"${o}"`).join(", ")}`;
    case "list": {
      const count = `${f.items.min} to ${f.items.max} items${f.together ? ` (give every item ${f.together.join(" and ")}, or none)` : ""}`;
      return f.of.kind === "object" ? count : `${count}, each ${limitsWords(f.of)}`;
    }
    case "object":
      return "a group of fields";
    default:
      return "";
  }
}

// Backslashes first, so an escaped pipe cannot be undone by a backslash already in the text.
const cell = (s) => String(s).replace(/\\/g, "\\\\").replace(/\|/g, "\\|");

/** Table rows for a field and, for groups and lists of groups, the fields inside them (named like `videos[].url`). */
function fieldRows(f, name) {
  const what = f.help ? `${f.label}. ${f.help}` : f.label;
  const rows = [`| \`${name}\` | ${cell(what)} | ${f.required ? "yes" : "no"} | ${cell(limitsWords(f))} |`];
  if (f.kind === "object") for (const inner of f.fields) rows.push(...fieldRows(inner, `${name}.${inner.name}`));
  if (f.kind === "list" && f.of.kind === "object") for (const inner of f.of.fields) rows.push(...fieldRows(inner, `${name}[].${inner.name}`));
  return rows;
}

function pageRulesMarkdown(r) {
  const lines = ["## Page rules", ""];
  lines.push(`- **Page file.** ${r.pageFile}`);
  lines.push(`- **Page keys.** ${r.pageKeys.map((k) => `\`${k.key}\`${k.required ? "" : " (optional)"}: ${k.rule}`).join(" ")}`);
  lines.push(`- **Menu.** ${r.menuKeys.map((k) => `\`${k.key}\`: ${k.rule}`).join(" ")} ${r.menu.rule}`);
  lines.push(`- **Block keys.** ${r.blockKeys.map((k) => `\`${k.key}\`${k.required ? "" : " (optional)"}: ${k.rule}`).join(" ")}`);
  lines.push(`- **Status.** \`live\`: ${lowerFirst(r.status.live)} \`archived\`: ${lowerFirst(r.status.archived)}`);
  lines.push(`- **Required pages.** ${r.requiredLivePages.map((p) => `\`${p}\``).join(" and ")} must exist and stay live. Reserved paths no page may take: ${r.reservedPaths.map((p) => `\`${p}\``).join(", ")}.`);
  lines.push(`- **The first block.** ${r.firstBlock}`);
  lines.push(`- **Focal animation.** ${r.focalAnimation}`);
  lines.push(`- **Length.** At most ${r.limits.maxBlocksPerPage} blocks on a page.`);
  lines.push(`- **Text.** ${r.text}`);
  lines.push(`- **Links.** Allowed: ${r.links.allowed.join(" ")} Never: ${r.links.never.map((n) => `\`${n}\``).join(", ")}, or any other kind of address (a \`//host\` address has no scheme).`);
  lines.push(`- **Images.** ${r.images.rule} Formats: ${r.images.formats.join(", ")}. Alt text that is only one of these words is rejected: ${r.images.genericAltWords.join(", ")}.`);
  lines.push(`- **Files.** ${r.files.rule}`);
  lines.push(`- **Video.** ${r.video.rule}`);
  lines.push(`- **Audio.** ${r.audio.rule}`);
  lines.push("");
  return lines;
}

function blockMarkdown(b) {
  const lines = [`## ${b.title} (\`${b.type}\`)`, "", b.description, ""];
  lines.push(`**Where it can go:** ${placementWords(b.placement)}.${b.source === "site" ? " This is one of this site's own blocks." : ""}`, "");
  if (b.fixedAnchor) lines.push(`**Fixed anchor:** \`#${b.fixedAnchor}\` (links can point to it; it cannot be changed).`, "");
  if (b.interactive) lines.push(`**Needs JavaScript:** ${b.interactive}`, "");
  lines.push("**Variants** (set with `variant`; the first is used when it is left out):", "");
  for (const v of b.variants) lines.push(`- \`${v.name}\`${v.default ? " (default)" : ""}: ${v.description}`);
  lines.push("", "**Fields** (inside `content`):", "", "| Field | What it is | Required | Limits |", "| --- | --- | --- | --- |");
  for (const f of b.fields) lines.push(...fieldRows(f, f.name));
  lines.push("", `**Motion:** ${motionWords(b.motion)}`, "", "**Example:**", "", "```json", JSON.stringify(b.example, null, 2), "```", "");
  return lines;
}

function collectionsMarkdown(list) {
  const lines = [
    "## Collections",
    "",
    "A collection is a list of items of one kind. Each item is one JSON file, `src/content/collections/<kind>/<slug>.json`, holding its `status` and its fields. List blocks and the blog show them. Items are archived, never deleted.",
    "",
  ];
  for (const c of list) {
    lines.push(`### ${c.title} (\`${c.kind}\`)`, "", c.description, "");
    lines.push(`- **File.** \`${c.file}\`. ${c.slug}`, `- **Status.** ${c.status}`, `- **Sort.** ${c.sort}`, "");
    lines.push("| Field | What it is | Required | Limits |", "| --- | --- | --- | --- |");
    for (const f of c.fields) lines.push(...fieldRows(f, f.name));
    lines.push("", "**Example:**", "", "```json", JSON.stringify(c.example, null, 2), "```", "");
  }
  return lines;
}

function settingRows(fields) {
  return ["| Field | Required | Rule |", "| --- | --- | --- |", ...fields.map((f) => `| \`${f.name}\` | ${f.required ? "yes" : "no"} | ${cell(f.rule)} |`)];
}

function settingsMarkdown(settings) {
  const { business, brand, notice } = settings;
  const lines = ["## Settings", "", "Three files hold the site-wide settings. Each is one JSON object and is checked by `npm run check:content`.", ""];
  lines.push(`### Business (\`${business.file}\`)`, "", business.description, "", ...settingRows(business.fields), "");
  lines.push(`### Brand (\`${brand.file}\`)`, "", brand.description, "");
  lines.push("**Colors** (`colors`, each written as `#rrggbb`):", "");
  for (const r of brand.colorRoles) lines.push(`- **${r.role}:** ${r.tokens.map((t) => `\`${t}\``).join(", ")}. ${r.rule}`);
  lines.push("", `**Contrast rule.** ${brand.contrastRule}`, "", `**Fonts** (\`fonts\`). ${brand.fontRule}`, "");
  for (const [role, list] of Object.entries(brand.fonts)) lines.push(`- \`${role}\`: ${list.map((f) => `${f.id}${f.label !== f.id ? ` (${f.label})` : ""}`).join(", ")}`);
  lines.push("", `**Logo** (\`logo\`). ${brand.logo.rule}`, "");
  lines.push(`### Notice (\`${notice.file}\`)`, "", notice.description, "", ...settingRows(notice.fields), "");
  return lines;
}

export function renderBlocksMarkdown(catalog) {
  const lines = [
    "# Blocks",
    "",
    "<!-- This file is generated. Do not edit it by hand; run `npm run blocks:catalog`. -->",
    "",
    "This file is generated from the block library (`src/blocks/` and `src/site-blocks/`). Do not edit it by hand: run",
    "`npm run blocks:catalog`. The same facts for programs are in `docs/blocks.json`. `npm run check:content` fails when",
    "either file is out of date.",
    "",
    "A page is one file in `src/content/pages/` with an ordered list of blocks. Each block is a designed section: pick a",
    "type, optionally a variant, and fill in its content.",
    "",
    ...pageRulesMarkdown(catalog.pageRules),
    ...collectionsMarkdown(catalog.collections),
    ...settingsMarkdown(catalog.settings),
    ...catalog.blocks.flatMap(blockMarkdown),
  ];
  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

export function variantsWords(variants) {
  return variants.map((v) => `**${v.name}**, ${lowerFirst(noPeriod(v.description)).replace(/ \(([^)]*)\)/g, ", $1")}`).join("; ");
}

/** The sections list for clients: plain words, no field names. */
export function renderLanesList(catalog) {
  return catalog.blocks
    .map((b) => {
      const looks = b.variants.length > 1 ? ` (You can choose a look: ${variantsWords(b.variants)}.)` : "";
      return `- **${b.title}**: ${b.description}${looks}`;
    })
    .join("\n");
}

/** Puts `list` between the markers and keeps everything else. Throws when a marker is missing. */
export function replaceBetweenMarkers(text, list) {
  const start = text.indexOf(START_MARKER);
  const end = text.indexOf(END_MARKER);
  if (start === -1 || end === -1 || end < start) throw new Error(`${LANES_FILE} needs ${START_MARKER} and ${END_MARKER} (in that order).`);
  return `${text.slice(0, start + START_MARKER.length)}\n${list}\n${text.slice(end)}`;
}

/** Every generated file's expected text. `readFile(path)` returns the current text of a file (the lanes file is needed). */
export function generatedFiles(registry, readFile) {
  const catalog = buildCatalog(registry);
  return {
    [JSON_FILE]: renderJson(catalog),
    [MARKDOWN_FILE]: renderBlocksMarkdown(catalog),
    [LANES_FILE]: replaceBetweenMarkers(readFile(LANES_FILE), renderLanesList(catalog)),
  };
}

/** The generated files whose text on disk differs from the generated text. */
export function staleFiles(expected, readFile) {
  return Object.entries(expected)
    .filter(([path, text]) => readFile(path) !== text)
    .map(([path]) => path);
}

/** The plain message for stale files, or null when none are. */
export function staleMessage(stale) {
  if (stale.length === 0) return null;
  return `The block catalog is out of date: ${stale.join(", ")}. Fix: ${FIX}`;
}

/** Reads the three files under `root` and returns the stale-files message, or null when all are fresh. */
export function catalogProblem(registry, root) {
  const readFile = (path) => (existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : "");
  return staleMessage(staleFiles(generatedFiles(registry, readFile), readFile));
}

async function main() {
  const root = process.cwd();
  const { registry } = await import(pathToFileURL(join(root, "src/blocks/definitions.ts")).href);
  const readFile = (path) => (existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : "");
  const expected = generatedFiles(registry, readFile);
  const stale = staleFiles(expected, readFile);
  if (process.argv.includes("--check")) {
    const message = staleMessage(stale);
    if (message) {
      console.error(message);
      process.exit(1);
    }
    console.log("Block catalog is up to date.");
    return;
  }
  for (const [path, text] of Object.entries(expected)) {
    if (stale.includes(path)) {
      writeFileSync(join(root, path), text);
      console.log(`wrote ${path}`);
    } else console.log(`unchanged ${path}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
