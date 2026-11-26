import { defineBlock } from "../../schema.ts";

export const proseDefinition = defineBlock({
  type: "prose",
  title: "Text section",
  description: "A heading with a few paragraphs under it. Good for a story, a background or a longer explanation.",
  source: "library",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90 },
    paragraphs: { kind: "list", label: "Paragraphs", min: 1, max: 8, of: { kind: "text", label: "Paragraph", max: 900 } },
  },
  variants: [{ name: "default", description: "Paragraphs in a comfortable reading width." }],
  placement: { position: "any", maxPerPage: 4, rhythm: "section", joinsHero: true },
  motion: { entrance: "default" },
  example: {
    heading: "A short heading that says what this section covers",
    paragraphs: ["A paragraph of plain text that describes itself.", "A second paragraph, also plain text, that continues the thought."],
  },
});
