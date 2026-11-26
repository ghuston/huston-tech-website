import { defineBlock } from "../../blocks/schema.ts";

export const faqListDefinition = defineBlock({
  type: "faq-list",
  title: "Questions people ask",
  description: "A heading and questions that open to show their answers, with a fading line between them. Works without JavaScript and by keyboard.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    divider: { kind: "boolean", label: "Fading line above the heading", required: false },
    items: {
      kind: "list",
      label: "Questions",
      min: 1,
      max: 15,
      of: {
        kind: "object",
        label: "Question",
        fields: {
          question: { kind: "text", label: "Question", max: 120 },
          answer: { kind: "text", label: "Answer", max: 600 },
        },
      },
    },
  },
  variants: [{ name: "default", description: "A green ring beside each question that gains the logo's rust dot when opened." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "compact", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4); the answers open instantly." },
  example: {
    heading: "Questions people ask",
    items: [{ question: "Who does the work?", answer: "I do, from the first call to the handoff." }],
  },
});
