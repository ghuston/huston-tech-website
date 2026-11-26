import { defineBlock } from "../../blocks/schema.ts";

export const contactNextDefinition = defineBlock({
  type: "contact-next",
  title: "What happens next",
  description: "A heading and a numbered list of what happens after a note is sent, then a line with the site's email address.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    steps: {
      kind: "list",
      label: "Steps",
      min: 1,
      max: 5,
      of: {
        kind: "object",
        label: "Step",
        fields: {
          lead: { kind: "text", label: "Bold start of the step", max: 80 },
          body: { kind: "text", label: "Rest of the step", max: 240 },
        },
      },
    },
    emailLabel: { kind: "text", label: "Words before the email address", max: 40 },
  },
  variants: [{ name: "default", description: "A numbered list with green numerals, then the email line." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "compact", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4); this section has none." },
  example: {
    heading: "What happens next",
    steps: [{ lead: "An automatic reply", body: "reaches you right away, so you know it arrived." }],
    emailLabel: "Prefer email?",
  },
});
