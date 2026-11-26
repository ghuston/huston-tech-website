import { defineBlock } from "../../blocks/schema.ts";

const column = (label: string) =>
  ({
    kind: "object",
    label,
    fields: {
      paragraph: { kind: "text", label: "What happens", max: 700 },
      youGet: { kind: "text", label: "What you get", max: 300, required: false },
    },
  }) as const;

export const processStepsDefinition = defineBlock({
  type: "process-steps",
  title: "The three steps in full",
  description: "The Scope, Shape and Ship steps down a white track with the rust dot resting at the bottom, each with a Website and a System column, and a line of proof under them.",
  source: "site",
  fields: {
    steps: {
      kind: "list",
      label: "Steps, in order",
      min: 3,
      max: 3,
      of: {
        kind: "object",
        label: "Step",
        fields: {
          key: { kind: "choice", label: "Which step", options: ["scope", "shape", "ship"] },
          website: column("The Website column"),
          system: column("The System column"),
        },
      },
    },
    labels: {
      kind: "object",
      label: "Column labels",
      fields: {
        website: { kind: "text", label: "Website column", max: 30 },
        system: { kind: "text", label: "System column", max: 30 },
        youGet: { kind: "text", label: "Label before what you get", max: 30 },
      },
    },
    proof: {
      kind: "object",
      label: "Line under the steps",
      fields: {
        text: { kind: "text", label: "Sentence", max: 200 },
        note: { kind: "text", label: "Italic note after it", max: 60 },
      },
    },
  },
  variants: [{ name: "default", description: "A vertical track with a station per step and two columns beside it." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "steps", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4); the steps are static." },
  example: {
    steps: [
      { key: "scope", website: { paragraph: "What happens to a website in this step.", youGet: "a plan." }, system: { paragraph: "What happens to a system in this step." } },
      { key: "shape", website: { paragraph: "What happens to a website in this step." }, system: { paragraph: "What happens to a system in this step." } },
      { key: "ship", website: { paragraph: "What happens to a website in this step." }, system: { paragraph: "What happens to a system in this step." } },
    ],
    labels: { website: "Website", system: "System", youGet: "You get:" },
    proof: { text: "A sentence that backs the steps up.", note: "(A note.)" },
  },
});
