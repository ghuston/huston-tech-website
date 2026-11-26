import { defineBlock } from "../../schema.ts";

export const stepsDefinition = defineBlock({
  type: "steps",
  title: "Numbered steps",
  description: "A heading and a short numbered list that says what happens, step by step. It can end with an email line.",
  source: "library",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90 },
    steps: {
      kind: "list",
      label: "Steps",
      min: 2,
      max: 6,
      of: {
        kind: "object",
        label: "Step",
        fields: {
          lead: { kind: "text", label: "Bold opening words", max: 80 },
          body: { kind: "text", label: "Text", max: 400 },
        },
      },
    },
    emailLabel: {
      kind: "text",
      label: "Words before the email address",
      max: 80,
      required: false,
      help: "When given, the line shows the site's email address after these words.",
    },
  },
  variants: [{ name: "default", description: "Numbers in green on the left, text in a comfortable reading width." }],
  placement: { position: "any", maxPerPage: 2, rhythm: "compact" },
  motion: { entrance: "default" },
  example: {
    heading: "A short heading that says what happens next",
    steps: [
      { lead: "The first step.", body: "A sentence that describes the first step." },
      { lead: "The second step.", body: "A sentence that describes the second step." },
    ],
  },
});
