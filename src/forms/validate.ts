// The one validator for forms. `validateForms` judges the form files (the content check, the build and the site editor);
// `validateSubmission` judges a visitor's answers against a form definition (the browser and the Worker). Problems come
// back as plain sentences naming the file. Import-free apart from sibling shared modules.
import { FILE_LINK_RE } from "../blocks/schema.ts";
import { textProblem } from "../blocks/validate.ts";
import { cleanLine } from "./clean.ts";
import {
  CONTACT_FORM_ID,
  DISPLAYS,
  FIELD_ID_RE,
  FIELD_TYPES,
  FORM_ID_RE,
  FORM_STATUSES,
  LIMITS,
  PURPOSES,
  RESERVED_FIELD_IDS,
  SHOWCASE_FORM_ID,
  formFilePath,
} from "./schema.ts";
import type { FieldType, FormDefinition, FormFile, FormSettings } from "./schema.ts";
import { healthTerm, refusedTerm } from "./sensitive.ts";
import { defaultMax, formFromFile } from "./submission.ts";

export type FormContext = { fileExists(href: string): boolean; registryIds?: readonly string[] };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const quoted = (names: readonly string[]) => names.map((n) => `"${n}"`).join(", ");
const article = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");

const FORM_KEYS = ["name", "status", "fields", "button", "thanks", "download"];
const BASE_FIELD_KEYS = ["id", "type", "label", "required", "help", "error"];
const EXTRA_FIELD_KEYS: Record<FieldType, readonly string[]> = {
  "short-text": ["max", "purpose"],
  "long-text": ["max"],
  email: [],
  phone: [],
  dropdown: ["options", "display"],
  checkbox: [],
  consent: [],
};
const ALL_FIELD_KEYS = [...BASE_FIELD_KEYS, "max", "purpose", "options", "display"];

// Keys a form file may never carry, each with the reason an owner is told.
const NAMED_KEYS: Record<string, string> = {
  checked: "a field cannot start ticked; visitors tick boxes themselves",
  default: "a field cannot start with an answer in it; visitors fill in every field themselves",
  value: "a field cannot start with an answer in it; visitors fill in every field themselves",
  hidden: "hidden fields are not available; every field is shown to the visitor",
  pattern: "owner-written validation rules are not available; the field type decides what is accepted",
  class: "a form takes no styling; it looks the way the site looks",
  style: "a form takes no styling; it looks the way the site looks",
};

const UPLOAD_REF = /^upload:[a-z0-9]{8}$/;

/** True when the id and text limits are met; says why not otherwise. */
function checkText(value: unknown, min: number, max: number, say: (message: string) => void, what: string): void {
  if (typeof value !== "string") return say(`${what} must be text.`);
  if (value.trim().length < min) return say(`${what} is empty; it needs some text.`);
  if (value.length > max) return say(`${what} is ${value.length} characters; it takes at most ${max}.`);
  const bad = textProblem(value);
  if (bad) say(`${what} ${bad}.`);
}

/** The most characters one answer can add to a submission: its text limit, or the longest option of a dropdown. */
function answerChars(field: Record<string, unknown>, type: FieldType): number {
  if (type === "dropdown") {
    const options = Array.isArray(field["options"]) ? field["options"] : [];
    return options.reduce<number>((most, option) => (typeof option === "string" ? Math.max(most, option.length) : most), 0);
  }
  if (type === "checkbox" || type === "consent") return 0;
  return typeof field["max"] === "number" ? field["max"] : (defaultMax(type) ?? 0);
}

function fieldProblems(field: unknown, n: number, file: string, out: string[]): { type: FieldType | null; chars: number; purpose: string | null } {
  const fallback = { type: null, chars: 0, purpose: null };
  if (!isRecord(field)) {
    out.push(`${file}, field ${n}: must be an object with "id", "type" and "label".`);
    return fallback;
  }
  const rawId = field["id"];
  const where = `${file}, field ${n}${typeof rawId === "string" ? ` ("${rawId}")` : ""}`;
  const say = (message: string) => out.push(`${where}: ${message}`);

  if (typeof rawId !== "string") say('"id" is missing or not text.');
  else if (!FIELD_ID_RE.test(rawId)) say(`"id" "${rawId}" must be lowercase words and digits joined by hyphens, 1 to 40 characters.`);
  else if ((RESERVED_FIELD_IDS as readonly string[]).includes(rawId)) say(`"id" "${rawId}" is reserved by the site; choose another.`);

  const rawType = field["type"];
  const type = (FIELD_TYPES as readonly unknown[]).includes(rawType) ? (rawType as FieldType) : null;
  if (type === null) say(`"type" must be one of: ${FIELD_TYPES.join(", ")}.`);

  const allowed = type === null ? ALL_FIELD_KEYS : [...BASE_FIELD_KEYS, ...EXTRA_FIELD_KEYS[type]];
  for (const key of Object.keys(field)) {
    if (allowed.includes(key)) continue;
    if (Object.hasOwn(NAMED_KEYS, key)) say(`"${key}" is not allowed: ${NAMED_KEYS[key]}.`);
    else if (type !== null && ALL_FIELD_KEYS.includes(key)) say(`"${key}" does not apply to ${article(type)} ${type} field. It accepts: ${allowed.join(", ")}.`);
    else say(`"${key}" is not a field setting. A field accepts: ${allowed.join(", ")}.`);
  }

  const isBox = type === "checkbox" || type === "consent";
  if (field["label"] === undefined) say('"label" is missing.');
  else checkText(field["label"], 1, isBox ? LIMITS.longLabelMax : LIMITS.labelMax, say, '"label"');
  if (field["help"] !== undefined) checkText(field["help"], 1, LIMITS.helpMax, say, '"help"');
  if (field["error"] !== undefined) checkText(field["error"], 1, LIMITS.errorMax, say, '"error"');
  if (field["required"] !== undefined) {
    if (typeof field["required"] !== "boolean") say('"required" must be true or false.');
    else if (type === "email" && !field["required"]) say('an email field is always required; remove "required" or set it to true.');
  }

  if (type === "short-text" || type === "long-text") {
    const limit = type === "short-text" ? LIMITS.shortText.max : LIMITS.longText.max;
    const max = field["max"];
    if (max !== undefined && (typeof max !== "number" || !Number.isInteger(max) || max < 1 || max > limit)) say(`"max" must be a whole number from 1 to ${limit}.`);
  }
  let purpose: string | null = null;
  if (type === "short-text" && field["purpose"] !== undefined) {
    if (!(PURPOSES as readonly unknown[]).includes(field["purpose"])) say(`"purpose" must be one of: ${PURPOSES.join(", ")}.`);
    else purpose = field["purpose"] as string;
  }
  if (type === "dropdown") {
    const options = field["options"];
    if (!Array.isArray(options)) say(`"options" must be a list of ${LIMITS.options.min} to ${LIMITS.options.max} choices.`);
    else {
      if (options.length < LIMITS.options.min || options.length > LIMITS.options.max) {
        say(`"options" has ${options.length} choice${options.length === 1 ? "" : "s"}; a dropdown takes ${LIMITS.options.min} to ${LIMITS.options.max}.`);
      }
      const seen = new Set<string>();
      options.forEach((option, index) => {
        checkText(option, 1, LIMITS.options.optionMax, say, `option ${index + 1}`);
        if (typeof option === "string") {
          const key = cleanLine(option);
          if (seen.has(key)) say(`option ${index + 1} ("${option}") is listed twice.`);
          seen.add(key);
        }
      });
    }
    if (field["display"] !== undefined && !(DISPLAYS as readonly unknown[]).includes(field["display"])) say(`"display" must be one of: ${DISPLAYS.join(", ")}.`);
  }
  return { type, chars: type === null ? 0 : answerChars(field, type), purpose };
}

function downloadProblems(download: unknown, file: string, ctx: FormContext, out: string[]): void {
  if (!isRecord(download)) {
    out.push(`${file}: "download" must be an object with "href" and "title".`);
    return;
  }
  const say = (message: string) => out.push(`${file}: download ${message}`);
  for (const key of Object.keys(download)) if (key !== "href" && key !== "title") say(`"${key}" is not a download setting. It accepts: href, title.`);
  const href = download["href"];
  if (typeof href !== "string") say('"href" is missing or not text.');
  else if (UPLOAD_REF.test(href)) return checkTitle(download["title"], say);
  else if (!href.startsWith("/files/") || !FILE_LINK_RE.test(href)) {
    say(`"href" "${href}" must be a PDF link like /files/buyers-checklist-k3x9q2mz.pdf, or an upload reference like upload:k3x9q2mz.`);
  } else if (!ctx.fileExists(href)) say(`"href" "${href}" is not a file in public/files/. Upload it first.`);
  checkTitle(download["title"], say);
}

function checkTitle(title: unknown, say: (message: string) => void): void {
  if (title === undefined) say('"title" is missing.');
  else checkText(title, 1, LIMITS.downloadTitleMax, (message) => say(message), '"title"');
}

/** The texts the personal-data rules judge, read tolerantly from raw data. */
function judgedTexts(data: Record<string, unknown>): { where: string; kind: string; text: string }[] {
  const out: { where: string; kind: string; text: string }[] = [];
  if (typeof data["name"] === "string") out.push({ where: "the form", kind: "name", text: data["name"] });
  const fields = Array.isArray(data["fields"]) ? data["fields"] : [];
  fields.forEach((field, index) => {
    if (!isRecord(field)) return;
    const where = `field ${index + 1}${typeof field["id"] === "string" ? ` ("${field["id"]}")` : ""}`;
    if (typeof field["label"] === "string") out.push({ where, kind: "label", text: field["label"] });
    if (typeof field["help"] === "string") out.push({ where, kind: "help text", text: field["help"] });
    if (Array.isArray(field["options"])) {
      for (const option of field["options"]) if (typeof option === "string") out.push({ where, kind: "option", text: option });
    }
  });
  return out;
}

const REFUSED_REASON =
  "A website form is not a safe place for that: the answers sit in email and a spreadsheet in plain text. Use the payment provider's own page for payments, and ask for IDs and passwords by no form at all.";

/** Why a form file is not good, as plain sentences. The contact form is Huston Logic's and skips the personal-data wording rules. */
export function formProblems(id: string, data: unknown, ctx: FormContext, settings: FormSettings): string[] {
  const file = formFilePath(id);
  const out: string[] = [];
  if (!FORM_ID_RE.test(id)) out.push(`${file}: the form id "${id}" must be lowercase words and digits joined by hyphens, 1 to 60 characters.`);
  if (id === SHOWCASE_FORM_ID) out.push(`${file}: the form id "${id}" is the block showcase's example form, which is code; choose another name for this file.`);
  if (!isRecord(data)) {
    out.push(`${file}: a form file must hold one object with ${quoted(["name", "status", "fields", "button", "thanks"])}.`);
    return out;
  }
  for (const key of Object.keys(data)) {
    if (FORM_KEYS.includes(key)) continue;
    if (Object.hasOwn(NAMED_KEYS, key)) out.push(`${file}: "${key}" is not allowed: ${NAMED_KEYS[key]}.`);
    else out.push(`${file}: "${key}" is not a form setting. A form has: ${FORM_KEYS.join(", ")}.`);
  }
  const say = (message: string) => out.push(`${file}: ${message}`);
  if (data["name"] === undefined) say('"name" is missing.');
  else checkText(data["name"], 1, LIMITS.nameMax, say, '"name"');
  if (data["status"] === undefined) say(`"status" is required (${FORM_STATUSES.join(", ")}).`);
  else if (!(FORM_STATUSES as readonly unknown[]).includes(data["status"])) say(`"status" must be one of ${FORM_STATUSES.join(", ")}.`);
  if (data["button"] === undefined) say('"button" is missing.');
  else checkText(data["button"], 1, LIMITS.buttonMax, say, '"button"');
  if (data["thanks"] === undefined) say('"thanks" is missing.');
  else checkText(data["thanks"], 1, LIMITS.thanksMax, say, '"thanks"');
  if (data["download"] !== undefined) downloadProblems(data["download"], file, ctx, out);

  const fields = data["fields"];
  if (!Array.isArray(fields)) say('"fields" must be a list of fields.');
  else {
    if (fields.length < 1) say("it has 0 fields; a form needs at least 1.");
    if (fields.length > settings.maxFields) say(`it has ${fields.length} fields; this site takes at most ${settings.maxFields} per form.`);
    const ids = new Map<string, number>();
    const purposes = new Map<string, number>();
    let emails = 0;
    let chars = 0;
    fields.forEach((field, index) => {
      const n = index + 1;
      const info = fieldProblems(field, n, file, out);
      chars += info.chars;
      if (info.type === "email") emails += 1;
      if (isRecord(field) && typeof field["id"] === "string") {
        const first = ids.get(field["id"]);
        if (first !== undefined) out.push(`${file}, field ${n} ("${field["id"]}"): the id is already used by field ${first}; every field needs its own id.`);
        else ids.set(field["id"], n);
      }
      if (info.purpose !== null) {
        const first = purposes.get(info.purpose);
        if (first !== undefined) out.push(`${file}, field ${n}: the purpose "${info.purpose}" is already used by field ${first}; each purpose goes to one field.`);
        else purposes.set(info.purpose, n);
      }
    });
    if (emails === 0) say("it has no email field; a form needs exactly one, so the owner can reply and a file can be sent.");
    if (emails > 1) say(`it has ${emails} email fields; a form takes exactly one.`);
    if (chars > settings.maxAnswerChars) say(`its fields allow ${chars} characters of answers in all; this site takes at most ${settings.maxAnswerChars}. Shorten some limits or remove a field.`);
  }

  if (id !== CONTACT_FORM_ID) {
    for (const { where, kind, text } of judgedTexts(data)) {
      const term = refusedTerm(text);
      if (term !== null) out.push(`${file}, ${where}: the ${kind} "${text}" matches "${term}", which a form on this site may not ask for. ${REFUSED_REASON}`);
    }
  }
  return out;
}

/** Warnings for a form file: wording that is allowed but needs the owner's thought (health details). */
export function formWarnings(id: string, data: unknown): string[] {
  if (id === CONTACT_FORM_ID || !isRecord(data)) return [];
  const file = formFilePath(id);
  const out: string[] = [];
  for (const { where, kind, text } of judgedTexts(data)) {
    const term = healthTerm(text);
    if (term !== null) {
      out.push(`${file}, ${where}: the ${kind} "${text}" mentions "${term}". This site is not set up for health details, so ask for them on a call instead.`);
    }
  }
  return out;
}

/** Judges every form file. Problems and warnings are plain sentences naming the file; no problems means the forms are good. */
export function validateForms(files: readonly FormFile[], ctx: FormContext, settings: FormSettings): { problems: string[]; warnings: string[] } {
  const problems: string[] = [];
  const warnings: string[] = [];
  let live = 0;
  for (const { id, data, error } of files) {
    if (error !== undefined) {
      problems.push(`${formFilePath(id)}: ${error}`);
      continue;
    }
    const found = formProblems(id, data, ctx, settings);
    problems.push(...found);
    if (found.length === 0) warnings.push(...formWarnings(id, data));
    if (isRecord(data) && data["status"] === "live") live += 1;
  }
  if (live > settings.maxForms) problems.push(`The site has ${live} live forms; this site takes at most ${settings.maxForms}. Archive one first.`);
  if (ctx.registryIds !== undefined) {
    const fileIds = new Set(files.map((file) => file.id));
    const listed = new Set(ctx.registryIds);
    const missing = [...fileIds].filter((id) => !listed.has(id)).sort();
    const extra = [...listed].filter((id) => !fileIds.has(id)).sort();
    if (missing.length > 0 || extra.length > 0) {
      const parts = [
        ...(missing.length > 0 ? [`missing: ${missing.join(", ")}`] : []),
        ...(extra.length > 0 ? [`has no form file: ${extra.join(", ")}`] : []),
      ];
      problems.push(`src/forms/registry.generated.ts does not list exactly the form files (${parts.join("; ")}). Run npm run sync:config to write it again.`);
    }
  }
  return { problems, warnings };
}

/** A form file as a definition with every default filled in, or null on any problem (the Worker fails closed with this). */
export function parseForm(data: unknown, settings: FormSettings, id: string = "form"): FormDefinition | null {
  if (formProblems(id, data, { fileExists: () => true }, settings).length > 0 || !isRecord(data)) return null;
  return formFromFile(data);
}

// The browser-side half lives in submission.ts (it must not pull in these checks); re-exported so imports keep working.
export { publicForm, validateSubmission } from "./submission.ts";
export type { SubmissionResult, SubmissionValue } from "./submission.ts";
