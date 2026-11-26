import { defineBlock } from "../../schema.ts";

export const businessDetailsDefinition = defineBlock({
  type: "business-details",
  title: "Business details",
  description:
    "A heading and the business's address, phone, email and opening hours, read from the business details settings (business.json), so they are written once and stay the same everywhere. Parts that are empty are left out.",
  source: "library",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90 },
  },
  variants: [
    { name: "columns", description: "Address, contact and hours side by side on wide screens, stacked on phones." },
    { name: "compact", description: "Address, contact and hours in one narrow column." },
  ],
  placement: { position: "any", maxPerPage: 1, rhythm: "section" },
  motion: { entrance: "default" },
  example: {
    heading: "Where to find me",
  },
});
