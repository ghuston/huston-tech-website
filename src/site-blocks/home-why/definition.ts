import { defineBlock } from "../../blocks/schema.ts";

export const homeWhyDefinition = defineBlock({
  type: "home-why",
  title: "Why hire me",
  description: "A two-voice heading and a paragraph, the checks every build passes on a track, a callout and three points.",
  source: "site",
  fields: {
    eyebrow: { kind: "text", label: "Small line above the heading", max: 60 },
    line1: { kind: "text", label: "Heading, line 1 (first voice)", max: 80 },
    line2: { kind: "text", label: "Heading, line 2 (second voice)", max: 80 },
    body: { kind: "text", label: "Paragraph", max: 600 },
    stops: {
      kind: "list",
      label: "The checks, in order",
      help: "The last stop usually has no line: the rust dot rests there.",
      min: 2,
      max: 10,
      of: {
        kind: "object",
        label: "Stop",
        fields: {
          title: { kind: "text", label: "Title", max: 60 },
          line: { kind: "text", label: "Line under the title", max: 100, required: false },
        },
      },
    },
    callout: { kind: "text", label: "Callout", max: 200 },
    points: {
      kind: "list",
      label: "Three points",
      min: 1,
      max: 3,
      of: {
        kind: "object",
        label: "Point",
        fields: {
          title: { kind: "text", label: "Title", max: 40 },
          body: { kind: "text", label: "Sentence", max: 140 },
        },
      },
    },
  },
  variants: [{ name: "default", description: "Heading and paragraph side by side, then the check track, a tinted callout and a row of three points." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "why" },
  motion: { entrance: "none", reason: "Keeps this site's own one-moment-per-section motion (STYLE-GUIDE §9.4): the dot travels the track once in view." },
  example: {
    eyebrow: "Why hire me",
    line1: "A first line in the heading voice.",
    line2: "A second line in the other voice.",
    body: "A paragraph that says why the checks matter.",
    stops: [
      { title: "It builds clean.", line: "On a fresh machine, not only mine." },
      { title: "Then it goes live." },
    ],
    callout: "One sentence that backs up the checks.",
    points: [{ title: "You work with me.", body: "The person on the call is the person doing the work." }],
  },
});
