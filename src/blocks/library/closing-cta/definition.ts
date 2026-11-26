import { defineBlock } from "../../schema.ts";

export const closingCtaDefinition = defineBlock({
  type: "closing-cta",
  title: "Closing call to action",
  description: "The last block on a page: a heading, a line of text and one button that says what to do next.",
  source: "library",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90 },
    body: { kind: "text", label: "Text", max: 280, required: false },
    action: { kind: "action", label: "Button", labelMax: 40 },
    note: { kind: "text", label: "Small note under the button", max: 160, required: false },
  },
  variants: [{ name: "default", description: "Left-aligned, with a soft glow that blends it into the page." }],
  placement: { position: "last", maxPerPage: 1, rhythm: "section" },
  motion: { entrance: "default" },
  example: {
    heading: "A short heading that invites the next step",
    body: "One or two plain sentences that say what happens next.",
    action: { label: "A label that says what the button does", href: "/contact" },
    note: "A small reassuring line",
  },
});
