import { defineBlock } from "../../schema.ts";

export const highlightsDefinition = defineBlock({
  type: "highlights",
  title: "Highlights",
  description: "A heading and a set of short ideas, each with a title and a few lines of text, and optionally a photo above each. Good for services, reasons or features.",
  source: "library",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90 },
    items: {
      kind: "list",
      label: "Ideas",
      min: 2,
      max: 9,
      together: ["image"],
      of: {
        kind: "object",
        label: "Idea",
        fields: {
          title: { kind: "text", label: "Title", max: 70 },
          body: { kind: "text", label: "Text", max: 280 },
          image: { kind: "image", shape: "3:2", label: "Photo", required: false, help: "Cropped to a 3 by 2 shape. Give every idea a photo, or none." },
        },
      },
    },
  },
  variants: [
    { name: "two-column", description: "The ideas sit in two columns (one column on phones), with soft dividers." },
    { name: "three-column", description: "The ideas sit in three columns on wide screens (with three or more ideas), two on tablets, one on phones." },
  ],
  placement: { position: "any", maxPerPage: 3, rhythm: "section" },
  motion: { entrance: "default" },
  example: {
    heading: "A short heading that says what this section covers",
    items: [
      { title: "A short title for the first idea", body: "A sentence or two that explains the first idea in plain words." },
      { title: "A short title for the second idea", body: "A sentence or two that explains the second idea in plain words." },
      { title: "A short title for the third idea", body: "A sentence or two that explains the third idea in plain words." },
    ],
  },
});
