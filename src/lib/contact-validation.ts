import { fieldLimits, needOptions, sourceOptions, urlTopics, type Need, type UrlTopic } from "../content/contact-fields.ts";

/** Fields that have a Rev 7.1 error message (docs/website-plan.md B7). */
export type ContactField = "need" | "name" | "email" | "message";

export type ContactSubmission = {
  need: Need | "";
  topic: UrlTopic | "";
  name: string;
  email: string;
  business: string;
  message: string;
  tools: string;
  website: string;
  source: string;
};

export const contactKeys = ["need", "topic", "name", "email", "business", "message", "tools", "website", "source"] as const;
export type ContactInput = Partial<Record<(typeof contactKeys)[number], unknown>>;

export type ContactValidation =
  | { ok: true; value: ContactSubmission }
  | {
      ok: false;
      /** Fields to show the Rev 7.1 message for, in form order. */
      fields: ContactField[];
      /** A value no person could enter through the form (wrong type, unknown option, over the length limit). */
      malformed: boolean;
    };

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// C0 and C1 control characters plus DEL. cleanText keeps tab and newline.
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g;
const CONTROL_EXCEPT_TAB_NEWLINE = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g;

/** One line of text: no control characters or line breaks, single spaces, trimmed. */
export function cleanLine(value: string): string {
  return value.normalize("NFC").replace(CONTROL, " ").replace(/\s+/g, " ").trim();
}

/** Multi-line text: line breaks kept (as \n), other control characters removed, trimmed. */
export function cleanText(value: string): string {
  return value.normalize("NFC").replace(/\r\n?/g, "\n").replace(CONTROL_EXCEPT_TAB_NEWLINE, "").trim();
}

function isNeed(value: string): value is Need {
  return needOptions.some((option) => option.value === value);
}

function isUrlTopic(value: string): value is UrlTopic {
  return (urlTopics as readonly string[]).includes(value);
}

/** Validates a contact submission exactly as the form does. Used by the form in the browser and by the Worker. */
export function validateContact(input: ContactInput): ContactValidation {
  let malformed = false;
  const raw = (key: (typeof contactKeys)[number]): string => {
    const value = input[key];
    if (value === undefined || value === null) return "";
    if (typeof value !== "string") {
      malformed = true;
      return "";
    }
    return value;
  };
  const limited = (key: keyof typeof fieldLimits, clean: (value: string) => string): string => {
    const value = raw(key);
    if (value.length > fieldLimits[key]) malformed = true;
    return clean(value);
  };

  const topicValue = cleanLine(raw("topic"));
  let topic: UrlTopic | "" = "";
  if (isUrlTopic(topicValue)) topic = topicValue;
  else if (topicValue !== "") malformed = true;
  const partner = topic === "partner";

  const needValue = cleanLine(raw("need"));
  let need: Need | "" = "";
  if (isNeed(needValue)) need = partner ? "" : needValue;
  else if (needValue !== "") malformed = true;

  const name = limited("name", cleanLine);
  const email = limited("email", cleanLine);
  const business = limited("business", cleanLine);
  const message = limited("message", cleanText);
  const tools = limited("tools", cleanLine);
  const website = limited("website", cleanLine);

  const sourceValue = cleanLine(raw("source"));
  let source = "";
  if (sourceOptions.includes(sourceValue)) source = sourceValue;
  else if (sourceValue !== "") malformed = true;

  const fields: ContactField[] = [];
  if (!partner && !need) fields.push("need");
  if (!name) fields.push("name");
  if (!EMAIL_PATTERN.test(email)) fields.push("email");
  if (!message) fields.push("message");

  if (fields.length > 0 || malformed) return { ok: false, fields, malformed };
  return { ok: true, value: { need, topic, name, email, business, message, tools, website, source } };
}
