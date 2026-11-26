import { defineBlock } from "../../blocks/schema.ts";

export const dotSectionDefinition = defineBlock({
  type: "dot-section",
  title: "Dotted list section",
  description: "A heading, an optional sentence, a list with green dots and, if wanted, one client quote; a fading line above if wanted.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90 },
    divider: { kind: "boolean", label: "Fading line above the heading", required: false },
    intro: { kind: "text", label: "Sentence above the list", max: 300, required: false, help: "Framework words ({stepsList} and the like) are filled in from the site settings." },
    items: { kind: "list", label: "List items", min: 1, max: 12, of: { kind: "text", label: "Item", max: 700 } },
    quote: { kind: "choice", label: "Client quote under the list", options: ["home", "past-work", "services", "about"], required: false, help: "The first approved testimonial placed on that page." },
  },
  variants: [{ name: "default", description: "Heading, the sentence, the dotted list and the quote." }],
  placement: { position: "any", maxPerPage: 4, rhythm: "compact", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4); this section has none." },
  example: {
    heading: "What working with me is like",
    intro: "Every project runs the same three steps. In practice:",
    items: ["**I listen first.** Before I suggest anything, I make sure I understand."],
  },
});
