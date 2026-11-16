/**
 * The contact form's option values and limits (docs/website-plan.md B7). The browser form and the Worker
 * (worker/contact.ts) both validate against this module, so their rules always match. It imports nothing, because
 * the Worker bundles it too.
 */
export type Need = "website" | "workflow" | "both" | "unsure";

export const needOptions: readonly { value: Need; label: string }[] = [
  { value: "website", label: "A website" },
  { value: "workflow", label: "Help with a workflow" },
  { value: "both", label: "Both" },
  { value: "unsure", label: "Not sure" },
];

/** Values of the hidden `topic` field, read from `/contact?topic=`. */
export const urlTopics = ["website", "workflow", "partner"] as const;
export type UrlTopic = (typeof urlTopics)[number];

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
