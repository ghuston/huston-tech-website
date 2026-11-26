import { defineBlock } from "../../blocks/schema.ts";

export const textStackDefinition = defineBlock({
  type: "text-stack",
  title: "Text section, several paragraphs",
  description: "A heading and a stack of paragraphs, each of which may end with a link, and a fading line above if wanted.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90 },
    divider: { kind: "boolean", label: "Fading line above the heading", required: false },
    width: { kind: "choice", label: "Line length of the paragraphs", options: ["intro", "measure"] },
    paragraphs: {
      kind: "list",
      label: "Paragraphs",
      min: 1,
      max: 10,
      of: {
        kind: "object",
        label: "Paragraph",
        fields: {
          text: { kind: "text", label: "Paragraph", max: 800 },
          link: { kind: "action", label: "Link at the end of the paragraph", labelMax: 100, required: false },
        },
      },
    },
  },
  variants: [{ name: "default", description: "Heading, then the paragraphs one under the other with a gap between." }],
  placement: { position: "any", maxPerPage: 6, rhythm: "compact", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4); this section has none." },
  example: {
    heading: "A heading for a short story",
    width: "measure",
    paragraphs: [{ text: "The first paragraph." }, { text: "The second paragraph, with a link at its end. ", link: { label: "Read more", href: "/contact" } }],
  },
});
