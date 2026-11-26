// The light half of the form rules: what the browser needs to build a form definition from its file and to judge a
// visitor's answers. It imports neither the authoring checks (validate.ts) nor the personal-data word lists (sensitive.ts),
// so the contact page does not ship them. The Worker still judges the file with `parseForm` (validate.ts) and fails closed.
import { cleanLine, cleanText, EMAIL_PATTERN } from "./clean.ts";
import { LIMITS } from "./schema.ts";
import type { FieldType, FormDefinition, FormField, PublicForm } from "./schema.ts";

export function defaultMax(type: FieldType): number | undefined {
  if (type === "short-text") return LIMITS.shortText.default;
  if (type === "long-text") return LIMITS.longText.default;
  if (type === "email") return LIMITS.emailMax;
  if (type === "phone") return LIMITS.phoneMax;
  return undefined;
}

export function defaultRequired(type: FieldType): boolean {
  return type === "short-text" || type === "long-text" || type === "email" || type === "dropdown";
}

/** A form file as a definition with every default filled in. It does not judge the file: call it only on data already checked. */
export function formFromFile(data: Record<string, unknown>): FormDefinition {
  const fields = (data["fields"] as Record<string, unknown>[]).map((raw): FormField => {
    const type = raw["type"] as FieldType;
    const field: FormField = {
      id: raw["id"] as string,
      type,
      label: raw["label"] as string,
      required: type === "email" ? true : typeof raw["required"] === "boolean" ? raw["required"] : defaultRequired(type),
    };
    if (raw["help"] !== undefined) field.help = raw["help"] as string;
    if (raw["error"] !== undefined) field.error = raw["error"] as string;
    const max = typeof raw["max"] === "number" ? raw["max"] : defaultMax(type);
    if (max !== undefined) field.max = max;
    if (raw["purpose"] !== undefined) field.purpose = raw["purpose"] as FormField["purpose"];
    if (type === "dropdown") {
      field.options = (raw["options"] as string[]).map((option) => cleanLine(option));
      field.display = (raw["display"] as FormField["display"] | undefined) ?? "menu";
    }
    return field;
  });
  const def: FormDefinition = {
    name: data["name"] as string,
    status: data["status"] as FormDefinition["status"],
    fields,
    button: data["button"] as string,
    thanks: data["thanks"] as string,
  };
  const download = data["download"];
  if (typeof download === "object" && download !== null && !Array.isArray(download)) {
    const record = download as Record<string, unknown>;
    def.download = { href: record["href"] as string, title: record["title"] as string };
  }
  return def;
}

/** What the browser may see of a form: everything but the download link. */
export function publicForm(def: FormDefinition): PublicForm {
  return {
    name: def.name,
    status: def.status,
    fields: def.fields.map((field) => ({ ...field, ...(field.options !== undefined ? { options: [...field.options] } : {}) })),
    button: def.button,
    thanks: def.thanks,
    delivers: def.download !== undefined,
  };
}

export type SubmissionValue = Record<string, string | boolean>;
export type SubmissionResult =
  | { ok: true; value: SubmissionValue }
  | {
      ok: false;
      /** Field ids with a problem a person can fix, in form order. */
      fields: string[];
      /** A value no person could enter through the form (an unnamed key, a wrong type, an unknown option, over a limit). */
      malformed: boolean;
    };

const PHONE_PATTERN = /^[0-9 +().-]+$/;

/** Judges a visitor's answers against a form definition. The browser and the Worker both call this. */
export function validateSubmission(def: FormDefinition, input: Record<string, unknown>): SubmissionResult {
  let malformed = false;
  const ids = new Set(def.fields.map((field) => field.id));
  for (const key of Object.keys(input)) if (!ids.has(key)) malformed = true;

  const value: SubmissionValue = {};
  const fields: string[] = [];
  for (const field of def.fields) {
    const raw: unknown = Object.hasOwn(input, field.id) ? input[field.id] : undefined;
    const absent = raw === undefined || raw === null;
    if (field.type === "checkbox" || field.type === "consent") {
      if (!absent && typeof raw !== "boolean") malformed = true;
      const ticked = raw === true;
      value[field.id] = ticked;
      if (field.required && !ticked) fields.push(field.id);
      continue;
    }
    let text = "";
    if (!absent) {
      if (typeof raw !== "string") malformed = true;
      else {
        if (raw.length > (field.max ?? Number.MAX_SAFE_INTEGER) && field.type !== "dropdown") malformed = true;
        text = field.type === "long-text" ? cleanText(raw) : cleanLine(raw);
      }
    }
    if (field.type === "dropdown" && text !== "" && !(field.options ?? []).includes(text)) {
      malformed = true;
      text = "";
    }
    value[field.id] = text;
    if (text === "") {
      if (field.required) fields.push(field.id);
    } else if (field.type === "email" && !EMAIL_PATTERN.test(text)) fields.push(field.id);
    else if (field.type === "phone") {
      const digits = text.replace(/\D/g, "").length;
      if (!PHONE_PATTERN.test(text) || digits < LIMITS.phoneDigits.min || digits > LIMITS.phoneDigits.max) fields.push(field.id);
    }
  }
  if (fields.length > 0 || malformed) return { ok: false, fields, malformed };
  return { ok: true, value };
}
