import { defineBlock } from "../../schema.ts";

export const testimonialsDefinition = defineBlock({
  type: "testimonials",
  title: "Testimonials",
  description: "Quotes from named clients, taken from your Testimonials collection in the order you set there. Every quote shows who said it.",
  source: "library",
  collection: "testimonials",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90 },
    count: { kind: "number", label: "How many", min: 1, max: 12, required: false, help: "The first this many quotes are shown. All of them (up to twelve) when left empty." },
  },
  variants: [
    { name: "grid", description: "The quotes sit in cards, two across on tablets and three across on wide screens (one column on phones)." },
    { name: "feature", description: "The first quote is large, in the accent serif. Any others sit in a row beneath it." },
  ],
  placement: { position: "any", maxPerPage: 2, rhythm: "section" },
  motion: { entrance: "default" },
  example: {
    heading: "A short heading above what clients say",
    count: 3,
  },
});
