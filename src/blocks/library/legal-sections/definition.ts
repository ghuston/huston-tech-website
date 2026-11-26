import { defineBlock } from "../../schema.ts";

export const legalSectionsDefinition = defineBlock({
  type: "legal-sections",
  title: "Policy sections",
  description: "A run of titled sections for a policy or terms page, with an optional line at the end such as a last-updated date.",
  source: "library",
  fields: {
    sections: {
      kind: "list",
      label: "Sections",
      min: 1,
      max: 20,
      of: {
        kind: "object",
        label: "Section",
        fields: {
          heading: { kind: "text", label: "Section title", max: 90 },
          body: { kind: "text", label: "Section text", max: 3000 },
        },
      },
    },
    footnote: { kind: "text", label: "Line at the end", max: 160, required: false },
  },
  variants: [{ name: "default", description: "Sections one after another in a comfortable reading width." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "section", joinsHero: true },
  motion: { entrance: "default" },
  example: {
    sections: [
      { heading: "A short title for the first section", body: "Plain text that describes what this section covers." },
      { heading: "A short title for the second section", body: "More plain text for the second section." },
    ],
    footnote: "A short line at the end of the page",
  },
});
