// The content check: judges page files against the block registry and returns problems in plain words, each naming the
// file, the block number and the field. Pure (no file access): the caller passes the pages and a small view of the repo.
// Import-free apart from its siblings, so Node scripts and Next both load it.
import { COLLECTION_KINDS } from "../collections/schema.ts";
import { CONTACT_FORM_ID, SHOWCASE_FORM_ID } from "../forms/schema.ts";
import type { FormStatus } from "../forms/schema.ts";
import { BUILT_IN_RHYTHMS, rhythmTable } from "./rhythm.ts";
import { siteRhythms } from "../site-blocks/design.ts";
import type { RhythmRow } from "../site-blocks/design.ts";
import { audioProviders, parseAudioUrl, parseVideoUrl, videoProviders } from "./embeds.ts";
import {
  BODY_HEADING_LEVELS,
  BODY_LIST_ITEMS_MAX,
  BODY_LIST_STYLES,
  BOOKING_LINK,
  FILE_LINK_RE,
  GENERIC_ALT_WORDS,
  IMAGE_FOCUS,
  IMAGE_SHAPES,
  MENU_PLACES,
  REQUIRED_LIVE,
  RESERVED_PATHS,
  fileForPath,
  pathForFile,
} from "./schema.ts";
import type { AnyBlockDefinition, BodyField, Field, Fields } from "./schema.ts";

export type Repo = { imageExists(src: string): boolean; fileExists(href: string): boolean };
/** Every page in the set, by path, with the anchors a link may point to. */
export type PageIndex = ReadonlyMap<string, { status: string; anchors: ReadonlySet<string> }>;
/** `pages: null` checks only the shape of internal links (used for registry examples, which point at no real page). */
export type Context = {
  repo: Repo;
  pages: PageIndex | null;
  /** Image src to the owner's upload name: alt text equal to that name is refused. */
  uploadNames?: ReadonlyMap<string, string>;
  /** Form id to status: what a `form` field may name. Missing or null means the site has no forms. */
  forms?: ReadonlyMap<string, FormStatus> | null;
};
export type PageFile = { file: string; data: unknown; error?: string };

export const PAGE_KEYS = ["path", "title", "description", "status", "menu", "blocks"];
const MENU_KEYS = ["label", "order", "places"];
/** Optional menu fields: `anchor` makes the link `path#anchor`. */
const MENU_OPTIONAL_KEYS = ["anchor"];
const BLOCK_KEYS = ["type", "variant", "anchor", "content"];
const PATH_RE = /^(?:\/|\/[a-z0-9]+(?:-[a-z0-9]+)*)$/;
const ANCHOR_RE = /^[a-z][a-z0-9-]{0,39}$/;
const KEBAB_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const IMAGE_RE = /^\/images\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.(?:jpe?g|png|webp)$/i;
export const MAX_HEADER_LINKS = 6;
export const TITLE_MAX = 80;
export const DESCRIPTION_MAX = 200;
export const MENU_LABEL_MAX = 24;
export const MAX_BLOCKS = 20;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const quoted = (names: readonly string[]) => names.map((n) => `"${n}"`).join(", ");

/** Why a text value is not plain text (only **bold** and [[placeholder]] are allowed), or null. */
export function textProblem(value: string): string | null {
  const tag = /<[A-Za-z/!][^>]*>?/.exec(value);
  if (tag) return `contains an HTML tag (${tag[0].slice(0, 20)}); only **bold** and [[placeholder]] are allowed`;
  const entity = /&(?:[A-Za-z][A-Za-z0-9]*|#\d+|#[xX][0-9A-Fa-f]+);/.exec(value);
  if (entity) return `contains an HTML entity (${entity[0]}); write the character itself`;
  const link = /\[[^\]]*\]\([^)]*\)/.exec(value);
  if (link) return `contains a markdown link (${link[0].slice(0, 30)}); links belong in a link field, not in text`;
  if (/[\u0000-\u001f\u007f-\u009f]/.test(value)) return "contains a control character (a line break, tab or hidden character); keep each text to one plain line";
  return null;
}

const normalise = (text: string) =>
  text
    .replace(/&(?:#x?[0-9a-f]+|[a-z]+);/gi, " ")
    .replace(/[​-‏⁠­﻿]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const GENERIC_PHRASE = /^(?:images?|photos?|pictures?|photographs?|graphics?|icons?|logos?)(?: of)?$/;
const CAMERA_NAME = /^(?:img|dsc|dscn|dscf|pxl|image|photo|pic|picture|screenshot) ?\d[\d ]*$/;

/** Same rules as altTextProblem in scripts/image-alt.mjs. */
function altProblem(text: string): string | null {
  const trimmed = text.trim();
  const words = normalise(text);
  if (trimmed === "" || (words === "" && /^[\s​-‏⁠­﻿]*$/.test(trimmed))) return "the alt text is empty";
  if (trimmed.includes("[[")) return "the alt text is still a [[placeholder]]";
  const core = words.replace(/^(?:a|an|the) /, "");
  if (GENERIC_ALT_WORDS.includes(words) || GENERIC_ALT_WORDS.includes(core) || GENERIC_PHRASE.test(core)) return `the alt text "${trimmed}" says nothing about the picture`;
  if (CAMERA_NAME.test(words)) return `the alt text "${trimmed}" looks like a camera file name, not a description`;
  if (!/\s/.test(trimmed) && /\.(jpe?g|png|webp)$/i.test(trimmed)) return `the alt text "${trimmed}" is a file name, not a description`;
  if (words.replace(/ /g, "").length < 3) return `the alt text "${trimmed}" is too short to describe a picture`;
  return null;
}

const LINK_HELP = "Use /page, /page#anchor, https://..., mailto:, tel:, @booking or a PDF like /files/price-sheet-k3x9q2mz.pdf.";

/** Why a link is not allowed, or null. */
function linkProblem(href: string, ctx: Context): string | null {
  if (href === BOOKING_LINK) return null;
  const lower = href.trim().toLowerCase();
  if (href.length > 300) return "is longer than 300 characters";
  // Script and data schemes are named here so the message says why; anything else not listed below is refused too.
  const scheme = /^(javascript|vbscript|data):/.exec(lower)?.[1];
  if (scheme !== undefined) return `is a ${scheme}: link, which is never allowed`;
  if (lower.startsWith("http:")) return "is an http: link; use https:// so the visitor's connection is secure";
  if (lower.startsWith("//")) return "starts with //, which can point anywhere; write the full https:// address";
  if (/[\s\u0000-\u001f]/.test(href)) return "contains a space or hidden character";
  if (lower.startsWith("https://")) {
    try {
      const url = new URL(href);
      if (url.protocol !== "https:" || url.hostname === "") return "has no website name after https://";
      if (url.username !== "" || url.password !== "") return "has a user name or password in it, which is never allowed";
    } catch {
      return "is not a valid https:// address";
    }
    return null;
  }
  if (lower.startsWith("mailto:")) {
    return /^mailto:[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(href) ? null : "is not a mailto: link with one email address";
  }
  if (lower.startsWith("tel:")) {
    return /^tel:\+?\d[\d().-]*$/.test(href) && href.replace(/\D/g, "").length >= 3 ? null : "is not a tel: link with a phone number (digits only)";
  }
  if (href.startsWith("/files/")) {
    if (!FILE_LINK_RE.test(href)) return "is not a file link this site allows. A /files/ link must look like /files/price-sheet-k3x9q2mz.pdf (lowercase words, digits and hyphens, ending in .pdf)";
    return ctx.repo.fileExists(href) ? null : "is not a file in public/files/. Upload it first";
  }
  if (href.startsWith("/")) {
    const hash = href.indexOf("#");
    const path = hash === -1 ? href : href.slice(0, hash);
    const anchor = hash === -1 ? null : href.slice(hash + 1);
    if (!PATH_RE.test(path) && path !== "/contact/thanks") return `is not a page address. ${LINK_HELP}`;
    if (anchor !== null && !ANCHOR_RE.test(anchor)) return `has a section name "${anchor}" that is not lowercase letters, numbers and hyphens`;
    if (ctx.pages === null) return null;
    if (path === "/contact/thanks") return anchor === null ? null : "points to a section of the thanks page, which has none";
    const page = ctx.pages.get(path);
    if (page === undefined) return `points to ${path}, which is not a page on this site`;
    if (page.status !== "live") return `points to ${path}, which is archived; link to a live page or restore it`;
    if (anchor !== null && !page.anchors.has(anchor)) return `points to #${anchor} on ${path}, but that page has no section with that anchor`;
    return null;
  }
  return `is not a link this site allows. ${LINK_HELP}`;
}

const articleFor = (noun: string) => `a ${noun.toLowerCase()}`;
const isRequired = (field: Field) => field.required !== false;

const IMAGE_FIELDS: Fields = {
  src: { kind: "text", label: "Image file", max: 200 },
  alt: { kind: "text", label: "Alt text", max: 200 },
  focus: { kind: "choice", label: "Focus", options: IMAGE_FOCUS, required: false },
};

function actionFields(field: Field): Fields {
  return {
    label: { kind: "text", label: "Label", max: field.kind === "action" ? field.labelMax : 40 },
    href: { kind: "link", label: "Link" },
  };
}

const childLabel = (parent: string, key: string) => (parent === "" ? `"${key}"` : `${parent}, "${key}"`);

/** Checks an object's keys against its fields, then each value. `noun` names what accepts the fields, for the message. */
function checkObject(value: unknown, fields: Fields, label: string, noun: string, where: string, ctx: Context, out: string[]): void {
  const prefix = label === "" ? where : `${where}: ${label}`;
  if (!isRecord(value)) {
    out.push(label === "" ? `${where}: the content must be an object.` : `${prefix} must be an object.`);
    return;
  }
  const names = Object.keys(fields);
  for (const key of Object.keys(value)) {
    if (!Object.hasOwn(fields, key)) out.push(`${where}: ${childLabel(label, key)} is not a field ${noun}. It accepts: ${names.join(", ")}.`);
  }
  for (const name of names) {
    const field = fields[name] as Field;
    const present = value[name] !== undefined;
    if (!present) {
      if (isRequired(field)) out.push(`${where}: ${childLabel(label, name)} is required.`);
      continue;
    }
    checkField(field, value[name], childLabel(label, name), where, ctx, out);
  }
}

function checkField(field: Field, value: unknown, label: string, where: string, ctx: Context, out: string[]): void {
  const say = (message: string): void => {
    out.push(`${where}: ${label} ${message}`);
  };
  switch (field.kind) {
    case "text": {
      if (typeof value !== "string") return say("must be text.");
      const min = field.min ?? 1;
      if (value.trim().length < min) return say(min <= 1 ? "is empty; it needs some text." : `is too short; it needs at least ${min} characters.`);
      if (value.length > field.max) return say(`is ${value.length} characters; this block takes at most ${field.max}.`);
      const bad = textProblem(value);
      if (bad) say(`${bad}.`);
      return;
    }
    case "link": {
      if (typeof value !== "string") return say("must be a link written as text.");
      const bad = linkProblem(value, ctx);
      if (bad) say(`"${value}" ${bad}.`);
      return;
    }
    case "action": {
      checkObject(value, actionFields(field), label, "a button accepts", where, ctx, out);
      return;
    }
    case "image": {
      const before = out.length;
      checkObject(value, IMAGE_FIELDS, label, "an image accepts", where, ctx, out);
      if (out.length > before || !isRecord(value)) return;
      const src = value["src"] as string;
      const alt = value["alt"] as string;
      if (!IMAGE_RE.test(src) || src.includes("..")) say(`"${src}" is not an image under /images/ (jpg, png or webp).`);
      else if (!ctx.repo.imageExists(src)) say(`"${src}" is not a file in public/images/. Add the picture first.`);
      const bad = altProblem(alt);
      if (bad) say(`${bad}. Write what the picture shows.`);
      else if (ctx.uploadNames?.get(src)?.trim().toLowerCase() === alt.trim().toLowerCase()) say("The description is the file's name; describe what the photo shows.");
      return;
    }
    case "video": {
      if (typeof value !== "string") return say("must be a video address written as text.");
      if (parseVideoUrl(value) === null) {
        say(`"${value.slice(0, 80)}" is not an address this site can play. Use ${videoProviders.map((p) => `${p.name} (like ${p.example})`).join(" or ")}.`);
      }
      return;
    }
    case "audio": {
      if (typeof value !== "string") return say("must be an episode address written as text.");
      if (parseAudioUrl(value) === null) {
        say(`"${value.slice(0, 80)}" is not an address this site can play. Use ${audioProviders.map((p) => `${p.name} (like ${p.example})`).join(" or ")}.`);
      }
      return;
    }
    case "form": {
      if (typeof value !== "string") return say("must be the id of a form, written as text.");
      if (value === CONTACT_FORM_ID) return say(`"${value}" is the contact form, which only the contact-form block shows; pick another form.`);
      const status = ctx.forms?.get(value);
      if (status === undefined) say(`"${value}" is not a form on this site.`);
      else if (status !== "live") say(`"${value}" is archived; pick a live form or restore it.`);
      return;
    }
    case "date": {
      if (typeof value !== "string" || !DATE_RE.test(value)) return say("must be a date written YYYY-MM-DD, like 2026-03-27.");
      if (!isRealDate(value)) say(`"${value}" is not a real date.`);
      return;
    }
    case "number": {
      if (typeof value !== "number" || !Number.isInteger(value)) return say("must be a whole number.");
      if (value < field.min) say(`is ${value}; it needs to be at least ${field.min}.`);
      else if (value > field.max) say(`is ${value}; it takes at most ${field.max}.`);
      return;
    }
    case "body":
      checkBody(field, value, label, where, ctx, out);
      return;
    case "boolean":
      if (typeof value !== "boolean") say("must be true or false.");
      return;
    case "choice":
      if (typeof value !== "string" || !field.options.includes(value)) say(`must be one of: ${field.options.join(", ")}.`);
      return;
    case "list": {
      if (!Array.isArray(value)) return say("must be a list.");
      if (value.length > field.max) say(`has ${count(value.length, "entry", "entries")}; this block takes at most ${field.max}.`);
      else if (value.length < field.min) say(`has ${count(value.length, "entry", "entries")}; this block needs at least ${field.min}.`);
      value.forEach((item, index) => {
        const entry = `${label} entry ${index + 1}`;
        if (field.of.kind === "object") checkObject(item, field.of.fields, entry, "this entry accepts", where, ctx, out);
        else checkField(field.of, item, entry, where, ctx, out);
      });
      if (field.of.kind === "object" && field.together !== undefined) {
        const items = value.filter(isRecord);
        for (const name of field.together) {
          const given = items.filter((item) => item[name] !== undefined).length;
          if (given === 0 || given === items.length) continue;
          const inner = field.of.fields[name];
          out.push(`${where}: ${label}: give every ${field.of.label.toLowerCase()} ${articleFor(inner?.label ?? name)}, or none.`);
        }
      }
      return;
    }
    case "object":
      checkObject(value, field.fields, label, "this group accepts", where, ctx, out);
      return;
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True when a YYYY-MM-DD string is a day that exists (no February 30). */
function isRealDate(text: string): boolean {
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

const bigNumber = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const LINK_FIELDS: Fields = {
  text: { kind: "text", label: "Link text", max: 200 },
  href: { kind: "link", label: "Link" },
};
const PART_TYPES = ["heading", "paragraph", "list", "quote", "photo"] as const;
const PART_FIELDS: Record<"heading" | "quote" | "photo", Fields> = {
  heading: {
    type: { kind: "choice", label: "Type", options: ["heading"] },
    level: { kind: "number", label: "Level", min: BODY_HEADING_LEVELS[0], max: BODY_HEADING_LEVELS[1] },
    text: { kind: "text", label: "Heading", max: 120 },
  },
  quote: {
    type: { kind: "choice", label: "Type", options: ["quote"] },
    text: { kind: "text", label: "Quote", max: 600 },
    source: { kind: "text", label: "Source", max: 120, required: false },
  },
  photo: {
    type: { kind: "choice", label: "Type", options: ["photo"] },
    image: { kind: "image", label: "Photo", shape: "3:2" },
    caption: { kind: "text", label: "Caption", max: 200, required: false },
  },
};
const PARAGRAPH_MAX = 5000;
const LIST_ITEM_MAX = 500;

/** Checks text with links in it (a string, or a list of strings and link objects). */
function checkInline(value: unknown, label: string, max: number, where: string, ctx: Context, out: string[]): void {
  const say = (message: string): void => {
    out.push(`${where}: ${label} ${message}`);
  };
  if (typeof value !== "string" && !Array.isArray(value)) return say("must be text, or a list of text and links.");
  const pieces = typeof value === "string" ? [value] : value;
  if (pieces.length === 0) return say("is empty; it needs some text.");
  let length = 0;
  let visible = false;
  pieces.forEach((piece, index) => {
    const here = `${label} piece ${index + 1}`;
    if (typeof piece === "string") {
      if (piece === "") return out.push(`${where}: ${here} is empty.`);
      length += piece.length;
      visible ||= piece.trim() !== "";
      const bad = textProblem(piece);
      if (bad) out.push(`${where}: ${here} ${bad}.`);
      return;
    }
    const before = out.length;
    checkObject(piece, LINK_FIELDS, here, "a link accepts", where, ctx, out);
    if (out.length === before && isRecord(piece)) {
      length += (piece["text"] as string).length;
      visible = true;
    }
  });
  if (!visible && pieces.every((p) => typeof p === "string")) say("is empty; it needs some text.");
  if (length > max) say(`is ${bigNumber(length)} characters; this part takes at most ${bigNumber(max)}.`);
}

/** The characters a body part adds to the body's total (defensive: a malformed part counts what it has). */
function partChars(part: Record<string, unknown>): number {
  const len = (v: unknown): number => (typeof v === "string" ? v.length : 0);
  const inline = (v: unknown): number =>
    typeof v === "string" ? v.length : Array.isArray(v) ? v.reduce<number>((sum, p) => sum + (isRecord(p) ? len(p["text"]) : len(p)), 0) : 0;
  const image = isRecord(part["image"]) ? len(part["image"]["alt"]) : 0;
  const items = Array.isArray(part["items"]) ? part["items"].reduce<number>((sum, item) => sum + inline(item), 0) : 0;
  return inline(part["text"]) + len(part["source"]) + len(part["caption"]) + image + items;
}

function checkBody(field: BodyField, value: unknown, label: string, where: string, ctx: Context, out: string[]): void {
  const say = (message: string): void => {
    out.push(`${where}: ${label} ${message}`);
  };
  if (!Array.isArray(value)) return say("must be a list of parts.");
  if (value.length === 0) return say("is empty; a body needs at least one part.");
  if (value.length > field.maxParts) say(`has ${count(value.length, "part", "parts")}; a body takes at most ${field.maxParts}.`);
  let chars = 0;
  value.forEach((part, index) => {
    const here = `${label} part ${index + 1}`;
    if (!isRecord(part)) return void out.push(`${where}: ${here} must be an object with a "type".`);
    chars += partChars(part);
    const type = part["type"];
    if (typeof type !== "string" || !(PART_TYPES as readonly string[]).includes(type)) {
      return void out.push(`${where}: ${here}: ${JSON.stringify(type)} is not a body part. Parts are: ${PART_TYPES.join(", ")}.`);
    }
    if (type === "heading" || type === "quote" || type === "photo") {
      checkObject(part, PART_FIELDS[type], here, "this part accepts", where, ctx, out);
      return;
    }
    const allowed = type === "paragraph" ? ["type", "text"] : ["type", "style", "items"];
    for (const key of Object.keys(part)) if (!allowed.includes(key)) out.push(`${where}: ${here}, "${key}" is not a field this part accepts. It accepts: ${allowed.join(", ")}.`);
    if (type === "paragraph") {
      if (part["text"] === undefined) out.push(`${where}: ${here}, "text" is required.`);
      else checkInline(part["text"], `${here}, "text"`, PARAGRAPH_MAX, where, ctx, out);
      return;
    }
    if (!(BODY_LIST_STYLES as readonly unknown[]).includes(part["style"])) out.push(`${where}: ${here}, "style" must be one of: ${BODY_LIST_STYLES.join(", ")}.`);
    const items = part["items"];
    if (!Array.isArray(items)) return void out.push(`${where}: ${here}, "items" must be a list.`);
    if (items.length < 1) out.push(`${where}: ${here}, "items" has 0 items; a list needs at least 1.`);
    else if (items.length > BODY_LIST_ITEMS_MAX) out.push(`${where}: ${here}, "items" has ${items.length} items; a list takes at most ${BODY_LIST_ITEMS_MAX}.`);
    items.forEach((item, i) => checkInline(item, `${here}, "items" item ${i + 1}`, LIST_ITEM_MAX, where, ctx, out));
  });
  if (chars > field.maxChars) say(`has ${bigNumber(chars)} characters in all; a body takes at most ${bigNumber(field.maxChars)}.`);
}

/** Checks the fields of one item (or any object) against a field schema. `where` names the place, such as the item's file. */
export function validateFields(fields: Fields, value: unknown, where: string, ctx: Context): string[] {
  const out: string[] = [];
  checkObject(value, fields, "", "this item accepts", where, ctx, out);
  return out;
}

/** Checks one block's content against its definition. `where` names the place, such as "services.json, block 3 (faq)". */
export function validateContent(def: AnyBlockDefinition, content: unknown, where: string, ctx: Context): string[] {
  const out: string[] = [];
  checkObject(content, def.fields, "", "this block accepts", where, ctx, out);
  return out;
}

/** Image fields (at any depth) that do not name one of the allowed shapes. */
function shapeProblems(fields: Fields, owner: string, path: string): string[] {
  const out: string[] = [];
  for (const [key, field] of Object.entries(fields)) {
    const here = path === "" ? key : `${path}.${key}`;
    const inner = field.kind === "list" ? field.of : field;
    if (inner.kind === "image" && !(IMAGE_SHAPES as readonly unknown[]).includes((inner as { shape?: unknown }).shape)) {
      out.push(`${owner}: the image field "${here}" needs a shape: ${IMAGE_SHAPES.slice(0, -1).join(", ")} or ${IMAGE_SHAPES[IMAGE_SHAPES.length - 1]}.`);
    }
    if (inner.kind === "object") out.push(...shapeProblems(inner.fields, owner, here));
  }
  return out;
}

/** Problems in the registry itself: duplicate types, bad names, missing reasons, examples that break their own schema. */
export function validateRegistry(
  registry: readonly AnyBlockDefinition[],
  repo: Repo = { imageExists: () => true, fileExists: () => true },
  extraRhythms: Readonly<Record<string, RhythmRow>> = siteRhythms,
): string[] {
  const out: string[] = [];
  const rhythms = rhythmTable(extraRhythms);
  for (const [rhythm, row] of Object.entries(extraRhythms)) {
    if (BUILT_IN_RHYTHMS.includes(rhythm)) out.push(`site rhythm "${rhythm}" is a template rhythm's name; pick another (src/site-blocks/design.ts).`);
    else if (!KEBAB_RE.test(rhythm)) out.push(`site rhythm "${rhythm}": the name must be lowercase words joined by hyphens (src/site-blocks/design.ts).`);
    if (row.full.trim() === "" || row.bottom.trim() === "") out.push(`site rhythm "${rhythm}": both the full and bottom classes are needed (src/site-blocks/design.ts).`);
  }
  const seen = new Map<string, AnyBlockDefinition>();
  for (const def of registry) {
    const name = `block "${def.type}"`;
    const first = seen.get(def.type);
    if (first) {
      out.push(
        first.source !== def.source
          ? `${name}: a site block may not reuse the name of a library block; pick another type name.`
          : `${name} is defined twice; every block type needs its own name.`,
      );
      continue;
    }
    seen.set(def.type, def);
    if (!KEBAB_RE.test(def.type)) out.push(`${name}: the type must be lowercase words joined by hyphens (like closing-cta).`);
    if (def.title.trim() === "") out.push(`${name}: the title is empty.`);
    if (def.description.trim() === "") out.push(`${name}: the description is empty; say in plain words what the block is for.`);
    if (def.variants.length === 0) out.push(`${name}: it has no variants; it needs at least one (the first is the default).`);
    const names = new Set<string>();
    for (const variant of def.variants) {
      if (variant.name.trim() === "") out.push(`${name}: a variant has no name.`);
      else if (names.has(variant.name)) out.push(`${name}: the variant "${variant.name}" is listed twice.`);
      names.add(variant.name);
    }
    if (def.fixedAnchor !== undefined && !ANCHOR_RE.test(def.fixedAnchor)) out.push(`${name}: the fixed anchor "${def.fixedAnchor}" must be lowercase letters, numbers and hyphens.`);
    if (def.motion.entrance === "none" && (def.motion.reason ?? "").trim().length < 20) out.push(`${name}: motion "none" needs a reason of at least 20 characters.`);
    const signature = def.motion.signature;
    if (signature !== undefined && (signature.keyframes.trim() === "" || signature.reason.trim() === "")) {
      out.push(`${name}: a signature animation needs the name of its keyframes and a reason.`);
    }
    if (!Object.hasOwn(rhythms, def.placement.rhythm)) {
      out.push(`${name}: the rhythm "${def.placement.rhythm}" is not defined. Use ${Object.keys(rhythms).join(", ")}, or add it to siteRhythms in src/site-blocks/design.ts.`);
    }
    const onlyOn = def.placement.onlyOn;
    if (onlyOn !== undefined && !PATH_RE.test(onlyOn)) out.push(`${name}: placement onlyOn "${onlyOn}" must be a page path like /blog.`);
    if (def.collection !== undefined && !(COLLECTION_KINDS as readonly string[]).includes(def.collection)) {
      out.push(`${name}: the collection "${def.collection}" is not one of ${COLLECTION_KINDS.join(", ")}.`);
    }
    out.push(...shapeProblems(def.fields, name, ""));
    const problems = validateContent(def, def.example, `${name}, example`, { repo, pages: null, forms: new Map<string, FormStatus>([[SHOWCASE_FORM_ID, "live"]]) });
    out.push(...problems.map((line) => `${line} (the example must pass its own schema)`));
  }
  return out;
}

type Readable = { file: string; data: Record<string, unknown>; path: string };

function anchorsOf(page: Record<string, unknown>, defs: Map<string, AnyBlockDefinition>): Set<string> {
  const anchors = new Set<string>();
  if (!Array.isArray(page["blocks"])) return anchors;
  for (const block of page["blocks"]) {
    if (!isRecord(block)) continue;
    if (typeof block["anchor"] === "string") anchors.add(block["anchor"]);
    const def = typeof block["type"] === "string" ? defs.get(block["type"]) : undefined;
    if (def?.fixedAnchor !== undefined) anchors.add(def.fixedAnchor);
    for (const inner of def?.innerAnchors ?? []) anchors.add(inner);
  }
  return anchors;
}

/** Every readable page by path, with its status and anchors: what an internal link is judged against. */
export function buildPageIndex(files: readonly PageFile[], registry: readonly AnyBlockDefinition[]): Map<string, { status: string; anchors: ReadonlySet<string> }> {
  const defs = new Map<string, AnyBlockDefinition>();
  for (const def of registry) if (!defs.has(def.type)) defs.set(def.type, def);
  const index = new Map<string, { status: string; anchors: ReadonlySet<string> }>();
  for (const { data, error } of files) {
    if (error !== undefined || !isRecord(data) || typeof data["path"] !== "string" || data["path"] === "" || index.has(data["path"])) continue;
    index.set(data["path"], { status: String(data["status"]), anchors: anchorsOf(data, defs) });
  }
  return index;
}

function checkString(data: Record<string, unknown>, key: string, min: number, max: number, file: string, out: string[]): void {
  const value = data[key];
  if (value === undefined) return;
  if (typeof value !== "string") {
    out.push(`${file}: "${key}" must be text.`);
    return;
  }
  if (value.trim().length < min) out.push(`${file}: "${key}" is empty.`);
  else if (value.length > max) out.push(`${file}: "${key}" is ${value.length} characters; a page takes at most ${max}.`);
  else {
    const bad = textProblem(value);
    if (bad) out.push(`${file}: "${key}" ${bad}.`);
  }
}

function checkMenu(menu: unknown, file: string, out: string[]): void {
  if (!isRecord(menu)) {
    out.push(`${file}: "menu" must be an object with ${quoted(MENU_KEYS)}.`);
    return;
  }
  for (const key of Object.keys(menu)) {
    if (!MENU_KEYS.includes(key) && !MENU_OPTIONAL_KEYS.includes(key)) out.push(`${file}: menu "${key}" is not a menu field. A menu has: ${[...MENU_KEYS, ...MENU_OPTIONAL_KEYS].join(", ")}.`);
  }
  const anchor = menu["anchor"];
  if (anchor !== undefined && (typeof anchor !== "string" || !ANCHOR_RE.test(anchor))) {
    out.push(`${file}: menu "anchor" must be lowercase letters, numbers and hyphens, starting with a letter (like websites), so the link is the page address then #anchor.`);
  }
  for (const key of MENU_KEYS) if (menu[key] === undefined) out.push(`${file}: menu "${key}" is missing.`);
  const label = menu["label"];
  if (label !== undefined) {
    if (typeof label !== "string") out.push(`${file}: menu "label" must be text.`);
    else if (label.trim().length < 1 || label.length > MENU_LABEL_MAX) out.push(`${file}: menu "label" is ${label.length} characters; it takes 1 to ${MENU_LABEL_MAX}.`);
    else {
      const bad = textProblem(label);
      if (bad) out.push(`${file}: menu "label" ${bad}.`);
    }
  }
  if (menu["order"] !== undefined && !Number.isInteger(menu["order"])) out.push(`${file}: menu "order" must be a whole number.`);
  const places = menu["places"];
  if (places !== undefined) {
    if (!Array.isArray(places) || places.length === 0) out.push(`${file}: menu "places" must list at least one of ${MENU_PLACES.join(", ")}.`);
    else {
      for (const place of places) if (!(MENU_PLACES as readonly unknown[]).includes(place)) out.push(`${file}: menu place ${JSON.stringify(place)} is not one of ${MENU_PLACES.join(", ")}.`);
      if (new Set(places).size !== places.length) out.push(`${file}: menu "places" lists a place twice.`);
    }
  }
}

function checkBlocks(file: string, path: string, blocks: unknown, defs: Map<string, AnyBlockDefinition>, ctx: Context, out: string[]): void {
  if (!Array.isArray(blocks)) {
    out.push(`${file}: "blocks" must be a list.`);
    return;
  }
  if (blocks.length < 1) out.push(`${file}: "blocks" has 0 blocks; a page needs at least 1.`);
  if (blocks.length > MAX_BLOCKS) out.push(`${file}: "blocks" has ${blocks.length} blocks; a page takes at most ${MAX_BLOCKS}.`);
  const firstTypes = [...defs.values()].filter((d) => d.placement.position === "first").map((d) => d.type);
  const ids = new Map<string, number>();
  const known: { index: number; def: AnyBlockDefinition }[] = [];

  blocks.forEach((block, index) => {
    const n = index + 1;
    if (!isRecord(block)) {
      out.push(`${file}, block ${n}: must be an object with "type" and "content".`);
      return;
    }
    const type = block["type"];
    const def = typeof type === "string" ? defs.get(type) : undefined;
    const where = `${file}, block ${n}${typeof type === "string" ? ` (${type})` : ""}`;
    for (const key of Object.keys(block)) if (!BLOCK_KEYS.includes(key)) out.push(`${where}: "${key}" is not a block field. A block has: ${BLOCK_KEYS.join(", ")}.`);
    if (typeof type !== "string") {
      out.push(`${where}: "type" is missing or not text.`);
      return;
    }
    if (def === undefined) {
      out.push(`${where}: unknown block type "${type}". Known types: ${[...defs.keys()].join(", ")}.`);
      return;
    }
    known.push({ index, def });
    if (block["content"] === undefined) out.push(`${where}: "content" is missing.`);
    else out.push(...validateContent(def, block["content"], where, ctx));

    const variant = block["variant"];
    if (variant !== undefined && (typeof variant !== "string" || !def.variants.some((v) => v.name === variant))) {
      out.push(`${where}: variant ${JSON.stringify(variant)} does not exist; this block has: ${def.variants.map((v) => v.name).join(", ")}.`);
    }
    const anchor = block["anchor"];
    if (def.fixedAnchor !== undefined) {
      if (anchor !== undefined) out.push(`${where}: this block has a fixed anchor ("${def.fixedAnchor}"); remove "anchor".`);
      const owner = ids.get(def.fixedAnchor);
      if (owner !== undefined) out.push(`${where}: the fixed anchor "${def.fixedAnchor}" is already used by block ${owner}.`);
      else ids.set(def.fixedAnchor, n);
    } else if (anchor !== undefined) {
      if (typeof anchor !== "string" || !ANCHOR_RE.test(anchor)) {
        out.push(`${where}: "anchor" must be lowercase letters, numbers and hyphens, starting with a letter, up to 40 characters.`);
      } else if (ids.has(anchor)) out.push(`${where}: the anchor "${anchor}" is already used by block ${ids.get(anchor)} on this page.`);
      else ids.set(anchor, n);
    }
  });

  const total = blocks.length;
  const perType = new Map<string, number>();
  const focal: { index: number; type: string }[] = [];
  for (const { index, def } of known) {
    const n = index + 1;
    const where = `${file}, block ${n} (${def.type})`;
    const { position, maxPerPage, onlyOn } = def.placement;
    if (onlyOn !== undefined && path !== onlyOn) out.push(`${where}: "${def.type}" can only be used on the page ${onlyOn}; this page is ${path === "" ? "missing its path" : path}.`);
    if (index === 0 && position !== "first") out.push(`${where}: a page must open with ${firstTypes.length === 1 ? `a "${firstTypes[0]}" block` : `one of: ${firstTypes.join(", ")}`}; this page opens with "${def.type}".`);
    if (index > 0 && position === "first") out.push(`${where}: "${def.type}" opens a page, so it can only be block 1; it is block ${n}.`);
    if (position === "last" && index !== total - 1) out.push(`${where}: "${def.type}" closes a page, so it must be the last block; it is block ${n} of ${total}.`);
    const seenOfType = (perType.get(def.type) ?? 0) + 1;
    perType.set(def.type, seenOfType);
    if (seenOfType === maxPerPage + 1) out.push(`${where}: a page takes at most ${count(maxPerPage, "block", "blocks")} of type "${def.type}".`);
    if (def.motion.signature !== undefined) focal.push({ index, type: def.type });
  }
  if (focal.length > 1) {
    const second = focal[1] as { index: number; type: string };
    out.push(`${file}, block ${second.index + 1} (${second.type}): a page may have only one focal animation, and block ${(focal[0] as { index: number }).index + 1} already has it.`);
  }
}

/**
 * Judges a whole set of page files. Unreadable files are reported by name. Problems come back as plain sentences, in file
 * order; an empty list means the content is good.
 */
export function validatePages(
  files: readonly PageFile[],
  registry: readonly AnyBlockDefinition[],
  repo: Repo,
  extra: { links?: readonly { where: string; href: string }[]; uploadNames?: ReadonlyMap<string, string>; forms?: ReadonlyMap<string, FormStatus> } = {},
): string[] {
  const out: string[] = [];
  const defs = new Map<string, AnyBlockDefinition>();
  for (const def of registry) if (!defs.has(def.type)) defs.set(def.type, def);

  const readable: Readable[] = [];
  const failedPaths = new Set<string>();
  for (const { file, data, error } of files) {
    if (error !== undefined) {
      out.push(`${file}: ${error}`);
      failedPaths.add(pathForFile(file));
    } else if (!isRecord(data)) out.push(`${file}: a page file must hold one object with ${quoted(PAGE_KEYS)}.`);
    else readable.push({ file, data, path: typeof data["path"] === "string" ? data["path"] : "" });
  }

  const index = new Map<string, { status: string; anchors: ReadonlySet<string> }>();
  for (const page of readable) {
    if (page.path !== "" && !index.has(page.path)) {
      index.set(page.path, { status: String(page.data["status"]), anchors: anchorsOf(page.data, defs) });
    }
  }
  const ctx: Context = {
    repo,
    pages: index,
    ...(extra.uploadNames !== undefined ? { uploadNames: extra.uploadNames } : {}),
    ...(extra.forms !== undefined ? { forms: extra.forms } : {}),
  };

  const fileByPath = new Map<string, string>();
  let headerLinks = 0;
  for (const { file, data, path } of readable) {
    for (const key of Object.keys(data)) if (!PAGE_KEYS.includes(key)) out.push(`${file}: "${key}" is not a page field. A page has: ${PAGE_KEYS.join(", ")}.`);
    for (const key of PAGE_KEYS) if (key !== "menu" && data[key] === undefined) out.push(`${file}: "${key}" is missing.`);

    if (data["path"] !== undefined) {
      if (typeof data["path"] !== "string") out.push(`${file}: "path" must be text.`);
      else if ((RESERVED_PATHS as readonly string[]).includes(path)) out.push(`${file}: the path "${path}" is reserved by the site; choose another.`);
      else if (!PATH_RE.test(path)) out.push(`${file}: the path "${path}" must be / or one lowercase word like /about (letters, numbers and hyphens).`);
      else {
        if (pathForFile(file) !== path) out.push(`${file}: the file name must match the path. The path "${path}" belongs in ${fileForPath(path)}.`);
        const other = fileByPath.get(path);
        if (other !== undefined) out.push(`${file}: the path "${path}" is already used by ${other}; every page needs its own path.`);
        else fileByPath.set(path, file);
      }
    }
    checkString(data, "title", 1, TITLE_MAX, file, out);
    checkString(data, "description", 1, DESCRIPTION_MAX, file, out);
    const status = data["status"];
    if (status !== undefined && status !== "live" && status !== "archived") out.push(`${file}: "status" must be "live" or "archived".`);
    if (data["menu"] !== undefined) {
      checkMenu(data["menu"], file, out);
      const menu = data["menu"];
      if (status === "live" && isRecord(menu) && Array.isArray(menu["places"]) && menu["places"].includes("header")) headerLinks += 1;
    }
    if (data["blocks"] !== undefined) checkBlocks(file, path, data["blocks"], defs, ctx, out);
  }

  for (const { where, href } of extra.links ?? []) {
    if (failedPaths.has(href.split("#")[0] as string)) continue;
    const problem = linkProblem(href, ctx);
    if (problem !== null) out.push(`${where}: "${href}" ${problem}.`);
  }
  if (headerLinks > MAX_HEADER_LINKS) out.push(`The header menu lists ${headerLinks} pages; at most ${MAX_HEADER_LINKS} fit. Remove some from the header or archive them.`);
  for (const path of REQUIRED_LIVE) {
    if (failedPaths.has(path)) continue;
    const page = index.get(path);
    if (page === undefined) out.push(`The page ${path} is missing; add ${fileForPath(path)}. The site needs it.`);
    else if (page.status !== "live") out.push(`The page ${path} must be live (${fileForPath(path)} has status "${page.status}"); the site needs it.`);
  }
  return out;
}
