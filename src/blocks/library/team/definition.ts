import { defineBlock } from "../../schema.ts";

export const teamDefinition = defineBlock({
  type: "team",
  title: "Team",
  description: "The people from your Team collection, in the order you set there, with a photo, name, role and short bio.",
  source: "library",
  collection: "team",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90 },
    intro: { kind: "text", label: "Intro", max: 240, required: false },
  },
  variants: [
    { name: "grid", description: "A card per person with a tall photo (a tinted panel with their initials when there is no photo), name, role and bio." },
    { name: "list", description: "Names and roles in two columns, no photos." },
  ],
  placement: { position: "any", maxPerPage: 1, rhythm: "section" },
  motion: { entrance: "default" },
  example: {
    heading: "A short heading that introduces the people",
    intro: "A sentence about who you work with.",
  },
});
