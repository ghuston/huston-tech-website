import { defineBlock } from "../../blocks/schema.ts";

export const stepListSectionDefinition = defineBlock({
  type: "step-list-section",
  title: "Numbered list section",
  description: "A heading and a numbered list, each item starting with a bold lead-in.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    steps: {
      kind: "list",
      label: "Items",
      min: 1,
      max: 8,
      of: {
        kind: "object",
        label: "Item",
        fields: {
          lead: { kind: "text", label: "Bold lead-in", max: 80 },
          rest: { kind: "text", label: "Rest of the item", max: 200 },
        },
      },
    },
  },
  variants: [{ name: "default", description: "A decimal list with bold numerals." }],
  placement: { position: "any", maxPerPage: 2, rhythm: "compact", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4); this section has none." },
  example: { heading: "What I set up", steps: [{ lead: "A design call.", rest: "We set your stages and your rules." }] },
});
