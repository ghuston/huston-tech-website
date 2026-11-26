import { defineBlock } from "../../schema.ts";

export const faqDefinition = defineBlock({
  type: "faq",
  title: "Questions and answers",
  description: "A heading and a list of questions that open to show their answers.",
  source: "library",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90 },
    items: {
      kind: "list",
      label: "Questions",
      min: 1,
      max: 12,
      of: {
        kind: "object",
        label: "Question",
        fields: {
          question: { kind: "text", label: "Question", max: 140 },
          answer: { kind: "text", label: "Answer", max: 900 },
        },
      },
    },
  },
  variants: [{ name: "default", description: "Questions open and close one by one; works without JavaScript." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "section" },
  motion: { entrance: "default" },
  example: {
    heading: "A short heading that introduces the questions",
    items: [
      { question: "A question a visitor might ask?", answer: "A plain answer that describes itself." },
      { question: "Another question a visitor might ask?", answer: "A second plain answer." },
    ],
  },
});
