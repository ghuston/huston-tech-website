// The contact form as the first form: its fields are src/content/forms/contact.json; what stays code (the partner
// variant, the topic, the 16 KB body limit) is here. Import-free apart from sibling shared modules and the JSON file.
import contactFile from "../content/forms/contact.json" with { type: "json" };
import type { UrlTopic } from "../content/contact-fields.ts";
import type { FormDefinition } from "./schema.ts";
import { formFromFile } from "./submission.ts";

/** The contact form keeps its own, smaller body limit (R13): a 17,000-character message is refused with 413. */
export const CONTACT_BODY_BYTES = 16384;

let parsed: FormDefinition | null = null;

/** The contact form for a request's topic. The partner variant has no `need` question. A fresh copy each call. */
export function contactDefinitionFor(topic: UrlTopic | "" | "partner"): FormDefinition {
  // contact.json is judged by the content check (formProblems) at build time; the browser does not repeat it.
  parsed ??= formFromFile(contactFile as unknown as Record<string, unknown>);
  const fields = parsed.fields.filter((field) => !(topic === "partner" && field.id === "need")).map((field) => ({ ...field, ...(field.options ? { options: [...field.options] } : {}) }));
  return { ...parsed, fields };
}
