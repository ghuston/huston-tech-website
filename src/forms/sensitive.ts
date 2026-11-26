// Personal-data rules for forms: what may never be asked, what gets a warning, and which kinds of personal data a form
// collects. Import-free apart from sibling shared modules.
import type { FormDefinition, FormField } from "./schema.ts";

// Refused. Each entry is [name shown to the owner, pattern]. Word-boundary, case-insensitive. The apostrophe in
// "driver's" may be straight or curly, or missing.
const APOS = "['’]?";
const REFUSED: readonly (readonly [string, RegExp])[] = [
  ["card number", /\bcard numbers?\b/i],
  ["credit card", /\bcredit cards?\b/i],
  ["debit card", /\bdebit cards?\b/i],
  ["CVV", /\bcvv2?\b/i],
  ["CVC", /\bcvc2?\b/i],
  ["security code", /\bsecurity codes?\b/i],
  ["expiry date", /\bexpiry dates?\b/i],
  ["expiration date", /\bexpiration dates?\b/i],
  ["account number", /\baccount numbers?\b/i],
  ["routing number", /\brouting numbers?\b/i],
  ["sort code", /\bsort codes?\b/i],
  ["IBAN", /\bibans?\b/i],
  ["social security number", /\bsocial security\b/i],
  ["SSN", /\bssns?\b/i],
  ["national insurance number", /\bnational insurance\b/i],
  ["passport number", /\bpassport (?:numbers?|no\b\.?)/i],
  ["driver's licence number", new RegExp(`\\bdriver${APOS}s${APOS} licen[cs]e( number)?\\b`, "i")],
  ["tax ID", /\btax ids?\b/i],
  ["TIN", /\bTINs?\b/],
  ["national ID", /\bnational ids?\b/i],
  ["ID number", /\bid numbers?\b/i],
  ["password", /\bpass ?words?\b/i],
  ["PIN", /\bPINs?\b|\b[Pp]in (?:numbers?|codes?)\b/],
];

// Warned, not refused: health words.
const HEALTH =
  /\b(health|medical|diagnos(?:is|es)|medications?|prescriptions?|symptoms?|allerg(?:y|ies)|disabilit(?:y|ies)|therapy|pregnan(?:cy|cies)|injur(?:y|ies))\b/i;

/** The kind of detail a text asks for if a form must never ask for it (card, bank, government ID, password or PIN), or null. */
export function refusedTerm(text: string): string | null {
  for (const [name, pattern] of REFUSED) if (pattern.test(text)) return name;
  return null;
}

/** The health word a text uses (lower-case), or null. */
export function healthTerm(text: string): string | null {
  const match = HEALTH.exec(text);
  return match === null ? null : (match[1] as string).toLowerCase();
}

export const DATA_KINDS = ["name", "email", "phone", "address", "business", "website", "message", "answers", "consent"] as const;
export type DataKind = (typeof DATA_KINDS)[number];

const KIND_LABELS: Record<DataKind, string> = {
  name: "names",
  email: "email addresses",
  phone: "phone numbers",
  address: "postal addresses",
  business: "business names",
  website: "website addresses",
  message: "written messages",
  answers: "answers to questions",
  consent: "consent to be contacted",
};

/** The plural words for a kind of personal data, for a change list or the privacy note. */
export function dataKindLabel(kind: DataKind): string {
  return KIND_LABELS[kind];
}

function kindOf(field: FormField): DataKind {
  switch (field.type) {
    case "email":
      return "email";
    case "phone":
      return "phone";
    case "long-text":
      return "message";
    case "consent":
      return "consent";
    case "short-text":
      if (field.purpose === "name") return "name";
      if (field.purpose === "organization") return "business";
      if (field.purpose === "website") return "website";
      if (field.purpose === "address") return "address";
      return "answers";
    default:
      return "answers";
  }
}

/** The kinds of personal data a form collects, in a fixed order, each once. */
export function dataKinds(def: Pick<FormDefinition, "fields">): DataKind[] {
  const found = new Set(def.fields.map(kindOf));
  return DATA_KINDS.filter((kind) => found.has(kind));
}

/** Kinds that live forms in `after` collect and no live form in `before` did. Archived forms collect nothing. */
export function newDataKinds(before: readonly FormDefinition[], after: readonly FormDefinition[]): DataKind[] {
  const had = new Set(before.filter((form) => form.status === "live").flatMap((form) => dataKinds(form)));
  const now = new Set(after.filter((form) => form.status === "live").flatMap((form) => dataKinds(form)));
  return DATA_KINDS.filter((kind) => now.has(kind) && !had.has(kind));
}
