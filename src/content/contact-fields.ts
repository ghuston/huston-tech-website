/**
 * The contact form's option values and limits (docs/website-rev8.md B7). The browser form and the Worker
 * (worker/contact.ts) both validate against this module, so their rules always match. It imports nothing, because
 * the Worker bundles it too.
 */
export type Need = "website" | "system" | "both" | "unsure";

export const needOptions: readonly { value: Need; label: string }[] = [
  { value: "website", label: "A website" },
  { value: "system", label: "An AI system for my business" },
  { value: "both", label: "Both" },
  { value: "unsure", label: "Not sure" },
];

/** Values of the hidden `topic` field, read from `/contact?topic=`. */
export const urlTopics = ["website", "system"] as const;
export type UrlTopic = (typeof urlTopics)[number];

/** Old links used `workflow` for what is now `system`. */
export function normalizeNeed(raw: string): string {
  return raw === "workflow" ? "system" : raw;
}

/** Reads `/contact?topic=`: `workflow` counts as `system`; anything else unknown (including `partner`) is no topic. */
export function topicFromUrl(raw: string | null): UrlTopic | "" {
  if (raw === null) return "";
  const topic = normalizeNeed(raw);
  return (urlTopics as readonly string[]).includes(topic) ? (topic as UrlTopic) : "";
}

export const sourceOptions: readonly string[] = ["Referral", "Google", "LinkedIn", "Article", "Other"];

/** Maximum length of each text field, in characters. The form sets these as `maxLength`, so only a crafted request hits them. */
export const fieldLimits = {
  name: 100,
  email: 254,
  business: 200,
  message: 5000,
  tools: 500,
  website: 300,
} as const;

/** The hidden spam-trap field. People never see it; bots that fill every field do. */
export const honeypot = { name: "company_fax", label: "Leave this empty" } as const;
