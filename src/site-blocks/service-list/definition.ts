import { defineBlock } from "../../blocks/schema.ts";

export const serviceListDefinition = defineBlock({
  type: "service-list",
  title: "Service list",
  description: "A heading and a list of services, each with a small heading and a paragraph and a fading line between them, then a closing sentence.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    divider: { kind: "boolean", label: "Fading line above the heading", required: false },
    items: {
      kind: "list",
      label: "Services",
      min: 1,
      max: 5,
      of: {
        kind: "object",
        label: "Service",
        fields: {
          title: { kind: "text", label: "Small heading", max: 60 },
          paragraph: { kind: "text", label: "Paragraph", max: 400 },
        },
      },
    },
    closing: { kind: "text", label: "Closing sentence", max: 300 },
  },
  variants: [{ name: "default", description: "The services one under the other, then the closing sentence." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "compact", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4); this section has none." },
  example: {
    heading: "After launch",
    items: [{ title: "Site Care", paragraph: "What it covers, in a sentence." }],
    closing: "A closing sentence.",
  },
});
