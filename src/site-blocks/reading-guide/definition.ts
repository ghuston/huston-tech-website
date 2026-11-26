import { defineBlock } from "../../blocks/schema.ts";

export const readingGuideDefinition = defineBlock({
  type: "reading-guide",
  title: "How to read this page",
  description: "A white panel under the page hero with a title and a short list of what each kind of work on the page means.",
  source: "site",
  fields: {
    title: { kind: "text", label: "Panel title", max: 60 },
    items: { kind: "list", label: "Items", min: 1, max: 5, of: { kind: "text", label: "Item", max: 300 } },
  },
  variants: [{ name: "default", description: "A bordered white panel at a readable width." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "flush", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4); this panel has none." },
  example: { title: "How to read this page", items: ["**First kind of work:** what it means."] },
});
