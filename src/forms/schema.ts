// Forms: one JSON file per form (src/content/forms/<id>.json) built from a fixed set of field types. Import-free apart
// from sibling shared modules, so Node scripts, Next and the Worker share it (docs/superpowers/specs/2026-11-25-forms-and-downloads-design.md).
import { SLUG_RE } from "../collections/schema.ts";

export const FIELD_TYPES = ["short-text", "long-text", "email", "phone", "dropdown", "checkbox", "consent"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

/** What a short-text field is for: sets the browser's autocomplete, and tells the Worker which answer is the name, business or website. */
export const PURPOSES = ["name", "organization", "website", "address"] as const;
export type Purpose = (typeof PURPOSES)[number];

/** `archived` forms are never built into a page and the Worker refuses them; the file is never deleted. */
export const FORM_STATUSES = ["live", "archived"] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

export const FORM_DIR = "src/content/forms";

/** The repo path of a form's file. */
export function formFilePath(id: string): string {
  return `${FORM_DIR}/${id}.json`;
}

/** A form's id is its file name: the slug rule of pages and items (lowercase words and digits joined by hyphens, 1 to 60). */
export const FORM_ID_RE = SLUG_RE;
/** A field id is a slug of 1 to 40 characters. */
export const FIELD_ID_RE = /^(?=.{1,40}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Keys a field id may never take. The token and honeypot keys (`turnstileToken`, `company_fax`) cannot be slugs, so only `topic` can collide. */
export const RESERVED_FIELD_IDS = ["topic", "constructor"] as const;

/** The contact form is Huston Logic's: it is never placed through the `form` block and owners cannot change it by chat. */
export const CONTACT_FORM_ID = "contact";
/** The example form of the block showcase. It is code, never a file, and has no endpoint. */
export const SHOWCASE_FORM_ID = "showcase-example";

export type DisplayStyle = "menu" | "buttons";
export const DISPLAYS = ["menu", "buttons"] as const;

/** Limits from the spec's field table. Texts count characters. */
export const LIMITS = {
  nameMax: 60,
  buttonMax: 40,
  thanksMax: 400,
  downloadTitleMax: 80,
  labelMax: 80,
  longLabelMax: 300,
  helpMax: 200,
  errorMax: 120,
  shortText: { max: 300, default: 200 },
  longText: { max: 5000, default: 2000 },
  emailMax: 254,
  phoneMax: 30,
  phoneDigits: { min: 7, max: 20 },
  options: { min: 2, max: 20, optionMax: 80 },
} as const;

/** One field. `required` and `max` are always filled in once a form is parsed (defaults applied). */
export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  help?: string;
  error?: string;
  /** Text limit in characters (short-text, long-text, and the fixed limit of email and phone). */
  max?: number;
  purpose?: Purpose;
  options?: string[];
  display?: DisplayStyle;
};

export type FormDownload = { href: string; title: string };

export type FormDefinition = {
  name: string;
  status: FormStatus;
  fields: FormField[];
  button: string;
  thanks: string;
  download?: FormDownload;
};

/** What the browser may see of a form: never the download link (the link is mailed after a submission). */
export type PublicForm = Omit<FormDefinition, "download"> & { delivers: boolean };

/** A form file as read from disk: `data` is the parsed JSON, `error` says why it could not be read. */
export type FormFile = { id: string; data: unknown; error?: string };

export type FormSettings = { maxForms: number; maxFields: number; maxAnswerChars: number; maxBodyBytes: number };

export const DEFAULT_FORM_SETTINGS: FormSettings = { maxForms: 10, maxFields: 12, maxAnswerChars: 8000, maxBodyBytes: 32768 };
