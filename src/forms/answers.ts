// Turns a valid submission into the lines the notification, the Sheet and the Pipeline message show. Import-free apart
// from sibling shared modules.
import type { FormDefinition } from "./schema.ts";
import type { SubmissionValue } from "./submission.ts";

export type AnswerLine = { label: string; text: string };

/** One line per answer the visitor gave, in field order. A checkbox always gives an answer: "Yes" or "No". */
export function answerLines(def: FormDefinition, value: SubmissionValue): AnswerLine[] {
  const out: AnswerLine[] = [];
  for (const field of def.fields) {
    const answer = value[field.id];
    if (field.type === "checkbox" || field.type === "consent") out.push({ label: field.label, text: answer === true ? "Yes" : "No" });
    else if (typeof answer === "string" && answer !== "") out.push({ label: field.label, text: answer });
  }
  return out;
}

function textOf(def: FormDefinition, value: SubmissionValue, pick: (field: FormDefinition["fields"][number]) => boolean): string {
  const field = def.fields.find(pick);
  const answer = field === undefined ? undefined : value[field.id];
  return typeof answer === "string" ? answer : "";
}

/** The answer to the field with `purpose: name`, or an empty string. */
export function nameOf(def: FormDefinition, value: SubmissionValue): string {
  return textOf(def, value, (field) => field.type === "short-text" && field.purpose === "name");
}

/** The answer to the form's one email field. */
export function emailOf(def: FormDefinition, value: SubmissionValue): string {
  return textOf(def, value, (field) => field.type === "email");
}

/** The answer to the field with `purpose: organization`, or an empty string. */
export function organizationOf(def: FormDefinition, value: SubmissionValue): string {
  return textOf(def, value, (field) => field.type === "short-text" && field.purpose === "organization");
}
