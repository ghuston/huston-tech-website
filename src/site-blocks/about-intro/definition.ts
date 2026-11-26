import { defineBlock } from "../../blocks/schema.ts";

export const aboutIntroDefinition = defineBlock({
  type: "about-intro",
  title: "About, the short version",
  description: "The founder's headshot in the logo ring beside a heading and a paragraph.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    body: { kind: "text", label: "Paragraph", max: 500 },
  },
  variants: [{ name: "default", description: "The headshot on the left, the words on the right; stacked on a phone." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "compact", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4); this section has none." },
  example: { heading: "The short version", body: "Who I am and what I do, in two sentences." },
});
