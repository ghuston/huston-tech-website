import { defineBlock } from "../../blocks/schema.ts";

export const serviceGroupsDefinition = defineBlock({
  type: "service-groups",
  title: "What every project includes",
  description: "A heading and three columns, one per step of the framework, each with a dotted list, and one client quote under them.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    divider: { kind: "boolean", label: "Fading line above the heading", required: false },
    groups: {
      kind: "list",
      label: "Columns",
      min: 1,
      max: 3,
      of: {
        kind: "object",
        label: "Column",
        fields: {
          label: { kind: "text", label: "Column heading", max: 40, help: "Framework words ({scope}, {shape}, {ship}) are filled in from the site settings." },
          items: { kind: "list", label: "Items", min: 1, max: 4, of: { kind: "text", label: "Item", max: 200 } },
        },
      },
    },
    quote: { kind: "choice", label: "Client quote under the columns", options: ["home", "past-work", "services", "about"], required: false, help: "The first approved testimonial placed on that page." },
  },
  variants: [{ name: "default", description: "Three columns side by side from a tablet up, stacked on a phone." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "compact", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4); this section has none." },
  example: {
    heading: "What every project includes",
    groups: [{ label: "{scope}", items: ["A written plan"] }],
  },
});
