import { defineBlock } from "../../blocks/schema.ts";

export const privacyTextDefinition = defineBlock({
  type: "privacy-text",
  title: "Privacy text",
  description: "The privacy statement: one paragraph that ends with the site's email address, then the date it was last updated.",
  source: "site",
  fields: {
    body: { kind: "text", label: "Statement", max: 1600, help: "It runs on into the site's email address, so end it with the words that lead there." },
    lastUpdated: { kind: "text", label: "Last-updated line", max: 60 },
  },
  variants: [{ name: "default", description: "One paragraph at reading width." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "section", joinsHero: true, plainWrapper: true },
  motion: { entrance: "none", reason: "Plain text with no motion of its own (STYLE-GUIDE §9.4); it shows at once." },
  example: {
    body: "A short statement of what is collected and why. To have your information deleted, email",
    lastUpdated: "Last updated November 15, 2026.",
  },
});
