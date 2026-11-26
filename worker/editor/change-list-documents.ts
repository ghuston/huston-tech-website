// The change list's sections for collection items and the three settings files. Like change-list.ts, it is built from the
// real before and after values (never from the operations), prints every value as quoted plain text, and never cuts an
// item short: the owner reads every field and every body part.
import type { AnyBlockDefinition, Field } from "../../src/blocks/schema.ts";
import { CONTRAST_PAIRS, type ColorToken } from "../../src/brand/contrast-pairs.ts";
import { CURATED_FONTS, FONT_ROLES, type FontRole } from "../../src/brand/fonts.ts";
import { SETTINGS_NAMES } from "../../src/settings/names.ts";
import { BUSINESS_LABELS } from "../../src/settings/business.ts";
import { NOTICE_LABELS } from "../../src/settings/notice.ts";
import { collectionFor } from "../../src/collections/definitions.ts";
import type { CollectionDefinition } from "../../src/collections/schema.ts";
import { siteWarnings } from "../../src/collections/site-validate.ts";
import { DEFAULT_FORM_SETTINGS, type FormDefinition, type FormSettings } from "../../src/forms/schema.ts";
import { dataKindLabel, newDataKinds } from "../../src/forms/sensitive.ts";
import { parseForm } from "../../src/forms/validate.ts";
import { type Ctx, type Entry, diffValue, formatSize, leaves, photoText, quote, render, text } from "./change-list.ts";
import { isObject } from "./json.ts";
import { deepEqual } from "./operations.ts";

export interface DocumentChange {
  before: { items: ReadonlyMap<string, unknown>; settings: ReadonlyMap<string, unknown>; forms?: ReadonlyMap<string, unknown> };
  after: { items: ReadonlyMap<string, unknown>; settings: ReadonlyMap<string, unknown>; forms?: ReadonlyMap<string, unknown> };
  touchedItems: readonly string[];
  /** The forms this change adds or changes, by id. */
  touchedForms?: readonly string[];
  /** For each archived form, the pages whose form sections the change removes. */
  removedFromPages?: ReadonlyMap<string, readonly string[]>;
  formSettings?: FormSettings;
  touchedSettings: readonly string[];
  /** The pages this change adds or changes. */
  touchedPages: readonly string[];
  /** The pages as they would be after the change, to say when a list section would show nothing. */
  pages: ReadonlyMap<string, unknown>;
  /** Today's date, YYYY-MM-DD, in the site's time zone. */
  today: string;
}

/** A post longer than this ends its change list entry with the preview line. */
export const LONG_POST = 1500;
export const LONG_POST_LINE = "This post is long: offer the owner the preview link.";

/** The block types that show a kind's items, from each definition's `collection`; a kind with none live leaves these sections empty. */
function listBlocks(registry: readonly AnyBlockDefinition[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const definition of registry) {
    if (definition.collection !== undefined) out.set(definition.collection, [...(out.get(definition.collection) ?? []), definition.type]);
  }
  return out;
}

const status = (item: unknown): string => (isObject(item) && typeof item.status === "string" ? item.status : "");

// ---- items ----

type Part = Record<string, unknown>;
const parts = (body: unknown): Part[] => (Array.isArray(body) ? body.filter(isObject) : []);

function inlineText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((piece) => (isObject(piece) ? `[${String(piece.text)}](${String(piece.href)})` : String(piece))).join("");
}

function partTexts(part: Part): string[] {
  if (part.type === "list") return Array.isArray(part.items) ? part.items.map((item) => inlineText(item)) : [];
  if (part.type === "quote") return [String(part.text ?? ""), ...(typeof part.source === "string" ? [part.source] : [])];
  if (part.type === "photo") return typeof part.caption === "string" ? [part.caption] : [];
  return [inlineText(part.text)];
}

/** Characters of text in a post body, links as their visible text. */
export function bodyLength(body: unknown): number {
  return parts(body).reduce((sum, part) => sum + partTexts(part).reduce((n, t) => n + t.replace(/\]\([^)]*\)/g, "").replace(/\[/g, "").length, 0), 0);
}

function partLines(part: Part, n: number, ctx: Ctx): string[] {
  if (part.type === "heading") return [`Part ${n} (heading, level ${String(part.level)}): ${quote(inlineText(part.text))}`];
  if (part.type === "paragraph") return [`Part ${n} (paragraph): ${quote(inlineText(part.text))}`];
  if (part.type === "list") {
    const items = Array.isArray(part.items) ? part.items : [];
    return [`Part ${n} (${part.style === "number" ? "numbered" : "bulleted"} list):`, ...items.map((item, i) => `  ${part.style === "number" ? `${i + 1}.` : "-"} ${quote(inlineText(item))}`)];
  }
  if (part.type === "quote") return [`Part ${n} (quote): ${quote(part.text)}${typeof part.source === "string" ? `, said by ${quote(part.source)}` : ""}`];
  if (part.type === "photo") {
    const image = isObject(part.image) && typeof part.image.src === "string" && typeof part.image.alt === "string" ? photoText({ src: part.image.src, alt: part.image.alt, focus: part.image.focus }, ctx) : "Photo";
    return [`Part ${n} (photo): ${image}${typeof part.caption === "string" ? `, caption: ${quote(part.caption)}` : ""}`];
  }
  return [`Part ${n}: ${quote(part)}`];
}

const bodyLines = (body: unknown, ctx: Ctx): string[] => parts(body).flatMap((part, i) => partLines(part, i + 1, ctx));

function fieldsWithoutBody(def: CollectionDefinition): Field {
  const rest = Object.fromEntries(Object.entries(def.fields as Record<string, Field>).filter(([name]) => name !== "body"));
  return { kind: "object", label: "", fields: rest };
}

function withoutStatusAndBody(item: unknown): Record<string, unknown> {
  if (!isObject(item)) return {};
  return Object.fromEntries(Object.entries(item).filter(([name]) => name !== "status" && name !== "body"));
}

function whereItAppears(kind: string, slug: string): string {
  return kind === "posts" ? `at /blog/${slug} and in the list on /blog` : `in the ${kind} sections of your pages`;
}

function statusChange(kind: string, slug: string, from: string, to: string): string {
  const where = whereItAppears(kind, slug);
  if (to === "live" && from === "archived") return `Status: restore. It comes back on the live site, ${where}.`;
  if (to === "live") return `Status: publish. It goes live ${where}.`;
  if (to === "draft" && from === "archived") return "Status: restore as a draft. It stays off the live site until you publish it.";
  if (to === "draft") return `Status: save as a draft. It leaves the live site (it was ${where}) and stays here as a draft.`;
  return `Status: archive. It leaves the site (it was ${where}). Nothing is deleted; it can be brought back.`;
}

function itemSection(key: string, old: unknown, now: unknown, ctx: Ctx): string | null {
  const at = key.indexOf("/");
  const kind = key.slice(0, at);
  const slug = key.slice(at + 1);
  const def = collectionFor(kind);
  if (!def || !isObject(now) || deepEqual(old, now)) return null;
  const label = typeof now[def.labelField] === "string" ? (now[def.labelField] as string) : slug;
  const objectDef = fieldsWithoutBody(def);
  const hasBody = "body" in def.fields;
  const lines: string[] = [];

  if (!isObject(old)) {
    const live = now.status === "live";
    lines.push(`New ${def.singular} ${quote(label)} (${key}).`);
    lines.push(
      live
        ? `  Status: publish. It goes live ${whereItAppears(kind, slug)}.`
        : "  Status: save as a draft. It is not on the live site until the owner says to publish it.",
    );
    lines.push(...leaves(withoutStatusAndBody(now), objectDef, [], [], ctx).map((line) => `  ${line}`));
    if (hasBody && "body" in now) {
      lines.push("  Post:", ...bodyLines(now.body, ctx).map((line) => `    ${line}`));
    }
  } else {
    lines.push(`${def.singular[0].toUpperCase()}${def.singular.slice(1)} ${quote(label)} (${key}):`);
    if (old.status !== now.status) lines.push(`  ${statusChange(kind, slug, status(old), status(now))}`);
    const entries: Entry[] = [];
    diffValue(withoutStatusAndBody(old), withoutStatusAndBody(now), objectDef, [], entries, ctx);
    lines.push(...render(entries));
    if (hasBody && !deepEqual(old.body, now.body)) {
      lines.push("  Post, was:", ...bodyLines(old.body, ctx).map((line) => `    ${line}`));
      lines.push("  Post, now:", ...bodyLines(now.body, ctx).map((line) => `    ${line}`));
    }
  }
  const bodyChanged = !isObject(old) || !deepEqual(old.body, now.body);
  if (kind === "posts" && bodyChanged && bodyLength(now.body) > LONG_POST) lines.push(LONG_POST_LINE);
  return lines.join("\n");
}

/** One note per page whose list section would show nothing because the kind has no live item. */
function emptyListNotes(change: DocumentChange, registry: readonly AnyBlockDefinition[]): string[] {
  const notes: string[] = [];
  const touchedKinds = new Set(change.touchedItems.map((key) => key.slice(0, key.indexOf("/"))));
  for (const [kind, types] of listBlocks(registry)) {
    const live = [...change.after.items].some(([key, item]) => key.startsWith(`${kind}/`) && status(item) === "live");
    if (live) continue;
    for (const [path, page] of change.pages) {
      const blocks = isObject(page) && Array.isArray(page.blocks) ? page.blocks : [];
      const holds = blocks.some((block) => isObject(block) && typeof block.type === "string" && types.includes(block.type));
      if (holds && (touchedKinds.has(kind) || change.touchedPages.includes(path))) {
        notes.push(`Note: ${path} has a ${kind} section, and no ${collectionFor(kind)?.singular ?? "item"} is live. This section shows nothing until an item is live.`);
      }
    }
  }
  return notes;
}

// ---- forms ----

const FIELD_TYPE_NAMES: Record<string, string> = {
  "short-text": "short text",
  "long-text": "long text",
  email: "email",
  phone: "phone",
  dropdown: "dropdown",
  checkbox: "checkbox",
  consent: "consent box (unticked)",
};

type FormFieldData = Record<string, unknown>;
const fieldsOf = (form: unknown): FormFieldData[] => (isObject(form) && Array.isArray(form.fields) ? form.fields.filter(isObject) : []);

function fieldLine(field: FormFieldData, n: number, mark: string): string {
  const type = FIELD_TYPE_NAMES[String(field.type)] ?? String(field.type);
  // Email is always required and a missing "required" is the type's default, so only an explicit value is shown.
  const required = field.type === "email" || field.required === true ? "required" : field.required === false ? "optional" : "default for its type";
  const options = Array.isArray(field.options) ? `, options: ${field.options.map((option) => quote(option)).join(", ")}` : "";
  const size = typeof field.max === "number" ? `, up to ${field.max} characters` : "";
  const help = typeof field.help === "string" ? `, help: ${quote(field.help)}` : "";
  return `    ${n}. ${quote(field.label)}: ${type}, ${required}${options}${size}${help}${mark}`;
}

/** The full numbered field list, with lines marked [new], [changed] or [moved] against the old form; removed fields come last. */
function fieldList(old: unknown, now: unknown): string[] {
  const was = fieldsOf(old);
  const fields = fieldsOf(now);
  const lines = fields.map((field, i) => {
    const before = was.findIndex((candidate) => candidate.id === field.id);
    const mark = !isObject(old) ? "" : before < 0 ? "  [new]" : !deepEqual(was[before], field) ? "  [changed]" : before !== i ? "  [moved]" : "";
    return fieldLine(field, i + 1, mark);
  });
  if (isObject(old)) {
    for (const field of was) if (!fields.some((candidate) => candidate.id === field.id)) lines.push(`    Removed: ${quote(field.label)}`);
  }
  return ["  Fields:", ...lines];
}

function downloadText(download: unknown, ctx: Ctx): string {
  if (!isObject(download)) return "no file";
  const href = String(download.href);
  const upload = ctx.byValue.get(href);
  const from = upload ? `, from the upload ${quote(upload.name)} (PDF, ${formatSize(upload.bytes)})` : "";
  return `${quote(download.title)} at ${href}${from}`;
}

const GATE_NOTE =
  "  The file's link is emailed to each visitor after they send the form. It is a plain public link: anyone who has it can open it, and can share it. It collects an email address; it does not lock the file.";

function formStatusLine(status: string, was: string, id: string, pages: readonly string[]): string {
  if (status === "archived") {
    const where = pages.length > 0 ? `its form ${pages.length === 1 ? "section is" : "sections are"} removed from ${pages.join(", ")}` : "no page shows it";
    return `Status: archive. It leaves the site: ${where}. Nothing is deleted; it can be brought back, but its sections are not put back automatically.`;
  }
  if (was === "archived") return `Status: restore. It can be placed on a page again with a form section for "${id}". No page shows it until one does.`;
  return `Status: live. Nothing shows it until a page has a form section for "${id}".`;
}

function formSection(id: string, old: unknown, now: unknown, ctx: Ctx, removed: readonly string[]): string | null {
  if (!isObject(now) || deepEqual(old, now)) return null;
  const name = typeof now.name === "string" ? now.name : id;
  const lines: string[] = [];
  if (!isObject(old)) {
    lines.push(`New form ${quote(name)} (${id}).`, `  ${formStatusLine(String(now.status), "", id, [])}`);
    lines.push(`  Button: ${quote(now.button)}`, `  Thank-you: ${quote(now.thanks)}`);
    lines.push(`  File to send: ${downloadText(now.download, ctx)}`);
    if (isObject(now.download)) lines.push(GATE_NOTE);
  } else {
    lines.push(`Form ${quote(name)} (${id}):`);
    if (old.status !== now.status) lines.push(`  ${formStatusLine(String(now.status), String(old.status), id, removed)}`);
    for (const [key, label] of [["name", "Name"], ["button", "Button"], ["thanks", "Thank-you"]] as const) {
      if (old[key] !== now[key]) lines.push(`  ${label}, was: ${quote(old[key])}`, `  ${label}, now: ${quote(now[key])}`);
    }
    if (!deepEqual(old.download, now.download)) lines.push(`  File to send, was: ${downloadText(old.download, ctx)}`, `  File to send, now: ${downloadText(now.download, ctx)}`);
    if (isObject(now.download) && !deepEqual(old.download, now.download)) lines.push(GATE_NOTE);
  }
  if (!isObject(old) || old.status === now.status || now.status === "live") lines.push(...fieldList(old, now));
  return lines.join("\n");
}

function definitionsOf(forms: ReadonlyMap<string, unknown> | undefined, settings: FormSettings): FormDefinition[] {
  const out: FormDefinition[] = [];
  for (const [id, data] of forms ?? []) {
    const def = parseForm(data, settings, id);
    if (def !== null) out.push(def);
  }
  return out;
}

/** The warnings for the forms a change touches, and the privacy note when a live form now collects a kind of personal data no live form did. */
function formNotes(change: DocumentChange): string[] {
  const touched = change.touchedForms ?? [];
  if (touched.length === 0) return [];
  const settings = change.formSettings ?? DEFAULT_FORM_SETTINGS;
  const notes = siteWarnings({ forms: touched.map((id) => ({ id, data: change.after.forms?.get(id) })) }).map((warning) => `Warning: ${warning}`);
  const kinds = newDataKinds(definitionsOf(change.before.forms, settings), definitionsOf(change.after.forms, settings));
  if (kinds.length > 0) {
    notes.push(
      `Privacy: this change makes the site collect ${kinds.map(dataKindLabel).join(", ")}, which no form collected before. The privacy page should say so: offer the owner a change to it in this same proposal.`,
    );
  }
  return notes;
}

// ---- settings ----

const B = BUSINESS_LABELS;
const BUSINESS_FIELDS: Field = {
  kind: "object",
  label: "",
  fields: {
    name: text(B.name),
    phone: text(B.phone),
    email: text(B.email),
    address: { kind: "list", label: B.address, min: 0, max: 4, of: text(B.addressLine) },
    hours: {
      kind: "object",
      label: B.hours,
      fields: Object.fromEntries(
        ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => [
          day,
          { kind: "object", label: `${day[0].toUpperCase()}${day.slice(1)}`, fields: { opens: text(B.opens), closes: text(B.closes) } } as Field,
        ]),
      ),
    },
    hoursNote: text(B.hoursNote),
    social: { kind: "list", label: B.social, min: 0, max: 8, of: { kind: "object", label: B.socialLink, fields: { network: text(B.network), url: text(B.url) } } },
  },
};

const N = NOTICE_LABELS;
const NOTICE_FIELDS: Field = {
  kind: "object",
  label: "",
  fields: { text: text(N.text), link: { kind: "object", label: N.link, fields: { label: text(N.linkText), href: text(N.linkHref) } }, endsOn: text(N.endsOn) },
};

/** A null value as "nothing", so the diff prints it as an addition or a removal. */
const nothing = (value: Record<string, unknown>): Record<string, unknown> => Object.fromEntries(Object.entries(value).filter(([, v]) => v !== null));

const COLOR_NAMES: Record<ColorToken, string> = {
  silver: "Page background",
  silver2: "Footer background",
  white: "White",
  ink: "Text",
  ink2: "Secondary text",
  green: "Brand color",
  greenDeep: "Deep brand color",
  greenEdge: "Brand edge color",
  tint: "Brand tint",
  glow: "Brand glow",
  mint: "Brand mint",
  rust: "Accent color",
  line: "Lines",
};

function fontLabel(role: FontRole, id: unknown): string {
  return CURATED_FONTS[role].find((font) => font.id === id)?.label ?? String(id);
}

function logoText(logo: unknown, ctx: Ctx): string {
  if (!isObject(logo) || typeof logo.src !== "string" || typeof logo.alt !== "string") return "(the business name as text)";
  const size = typeof logo.width === "number" && typeof logo.height === "number" ? `, ${logo.width} x ${logo.height} pixels` : "";
  return `${photoText({ src: logo.src, alt: logo.alt }, ctx)}${size}`;
}

function brandSection(old: Record<string, unknown>, now: Record<string, unknown>, ctx: Ctx): string {
  const lines = ["Brand settings:"];
  const was = isObject(old.colors) ? old.colors : {};
  const colors = isObject(now.colors) ? now.colors : {};
  const changed = (Object.keys(COLOR_NAMES) as ColorToken[]).filter((token) => was[token] !== colors[token]);
  for (const token of changed) lines.push(`  ${COLOR_NAMES[token]} (${token}): ${String(was[token])} → ${String(colors[token])}`);
  if (changed.length > 0) lines.push(`  All ${CONTRAST_PAIRS.length} color pairs keep AA contrast.`);
  const wasFonts = isObject(old.fonts) ? old.fonts : {};
  const fonts = isObject(now.fonts) ? now.fonts : {};
  for (const role of FONT_ROLES) {
    if (wasFonts[role] !== fonts[role]) lines.push(`  ${role[0].toUpperCase()}${role.slice(1)} font: ${fontLabel(role, wasFonts[role])} → ${fontLabel(role, fonts[role])}`);
  }
  if (!deepEqual(old.logo, now.logo)) lines.push("  Logo:", `    was: ${logoText(old.logo, ctx)}`, `    now: ${logoText(now.logo, ctx)}`);
  lines.push("  This changes how every page looks. Before it can be published, run preview_change for this proposal and give the owner the preview link to look at.");
  return lines.join("\n");
}

function noticeSection(old: Record<string, unknown>, now: Record<string, unknown>, today: string, ctx: Ctx): string {
  const lines = ["Notice:"];
  const entries: Entry[] = [];
  diffValue(nothing(old), nothing(now), NOTICE_FIELDS, [], entries, ctx);
  lines.push(...render(entries));
  const text = typeof now.text === "string" ? now.text.trim() : "";
  const endsOn = typeof now.endsOn === "string" ? now.endsOn : null;
  if (text === "") lines.push("  The notice comes down: it no longer shows on any page.");
  else if (endsOn !== null && endsOn < today) lines.push("  This notice will not show: its end date has passed.");
  else if (endsOn !== null) lines.push(`  The notice shows above the header on every page. Shows through ${endsOn}; it comes down at the first publish after that date.`);
  else lines.push("  The notice shows above the header on every page.");
  return lines.join("\n");
}

function businessSection(old: Record<string, unknown>, now: Record<string, unknown>, ctx: Ctx): string {
  const entries: Entry[] = [];
  diffValue(nothing(old), nothing(now), BUSINESS_FIELDS, [], entries, ctx);
  return ["Business details:", ...render(entries)].join("\n");
}

/** The change list's sections for the items and settings a change touches (items first, then business, brand, notice). */
export function documentSections(change: DocumentChange, ctx: Ctx, registry: readonly AnyBlockDefinition[]): string[] {
  const sections: string[] = [];
  for (const key of change.touchedItems) {
    const section = itemSection(key, change.before.items.get(key), change.after.items.get(key), ctx);
    if (section !== null) sections.push(section);
  }
  for (const id of change.touchedForms ?? []) {
    const section = formSection(id, change.before.forms?.get(id), change.after.forms?.get(id), ctx, change.removedFromPages?.get(id) ?? []);
    if (section !== null) sections.push(section);
  }
  for (const name of SETTINGS_NAMES) {
    if (!change.touchedSettings.includes(name)) continue;
    const old = change.before.settings.get(name);
    const now = change.after.settings.get(name);
    if (!isObject(old) || !isObject(now)) continue;
    if (name === "business") sections.push(businessSection(old, now, ctx));
    else if (name === "brand") sections.push(brandSection(old, now, ctx));
    else sections.push(noticeSection(old, now, change.today, ctx));
  }
  const notes = [...emptyListNotes(change, registry), ...formNotes(change)];
  if (notes.length > 0) sections.push(notes.join("\n"));
  return sections;
}
