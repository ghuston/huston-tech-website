import { defineBlock } from "../../blocks/schema.ts";

export const artSectionDefinition = defineBlock({
  type: "art-section",
  title: "Text beside a drawing",
  description: "A heading and a paragraph with one of the site's line drawings beside it (under it on a phone), drawn once as it comes into view.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90 },
    body: { kind: "text", label: "Paragraph", max: 500 },
    art: { kind: "choice", label: "Drawing", options: ["twenty-minutes", "site-frames"] },
  },
  variants: [{ name: "default", description: "Text on the left, the drawing on the right; the drawing sits small under the text on a phone." }],
  placement: { position: "any", maxPerPage: 2, rhythm: "compact", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own one-moment-per-section motion (STYLE-GUIDE §9.4): the drawing is drawn once in view." },
  example: { heading: "A heading", body: "A paragraph that goes with the drawing.", art: "site-frames" },
});
