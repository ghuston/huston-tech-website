import { defineBlock } from "../../blocks/schema.ts";

export const systemsDemoDefinition = defineBlock({
  type: "systems-demo",
  title: "What the system does",
  description: "A heading and a paragraph, the things an owner says with what the system does, and the app's phone screens.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    body: { kind: "text", label: "Paragraph", max: 400 },
    pairs: {
      kind: "list",
      label: "What is said, and what happens",
      min: 1,
      max: 5,
      of: {
        kind: "object",
        label: "Pair",
        fields: {
          said: { kind: "text", label: "What the owner says", max: 140 },
          result: { kind: "text", label: "What the system does", max: 140 },
        },
      },
    },
    screens: {
      kind: "list",
      label: "Phone screens",
      min: 1,
      max: 4,
      of: {
        kind: "object",
        label: "Screen",
        fields: {
          key: { kind: "choice", label: "Which screen", options: ["today", "pipeline", "brief", "rule"] },
          label: { kind: "text", label: "Name", max: 30 },
          alt: { kind: "text", label: "What the screen shows", max: 160 },
        },
      },
    },
    screensLabel: { kind: "text", label: "Name of the swipe row, for screen readers", max: 60 },
    screensNote: { kind: "text", label: "Line under the screens", max: 30 },
  },
  variants: [{ name: "default", description: "Heading and paragraph, the talk pairs, then the four phone screens." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "compact", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own one-moment-per-section motion (STYLE-GUIDE §9.4): the talk pairs play once in view." },
  example: {
    heading: "What it does",
    body: "One sentence about what the system does for the owner.",
    pairs: [{ said: "“Something the owner says.”", result: "What the system does." }],
    screens: [{ key: "today", label: "Today", alt: "The Today screen of the follow-up app, with demo data" }],
    screensLabel: "A name for the system's app screens",
    screensNote: "Demo data",
  },
});
