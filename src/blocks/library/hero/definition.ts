import { defineBlock } from "../../schema.ts";

export const heroDefinition = defineBlock({
  type: "hero",
  title: "Hero",
  description: "The top of a page: a small line above, the page headline, a short introduction and, if wanted, one button.",
  source: "library",
  fields: {
    eyebrow: { kind: "text", label: "Small line above the headline", max: 60, required: false },
    title: { kind: "text", label: "Headline", max: 90, help: "The page's one main heading." },
    intro: { kind: "text", label: "Introduction", max: 320, required: false },
    action: { kind: "action", label: "Button", labelMax: 40, required: false },
  },
  variants: [{ name: "default", description: "Left-aligned, with a soft glow in the top-right corner." }],
  placement: { position: "first", maxPerPage: 1, rhythm: "hero" },
  motion: { entrance: "none", reason: "The first block is the first paint, so it shows at once and never waits on motion." },
  example: {
    eyebrow: "A short line that sets the scene",
    title: "A headline that says what this page is about",
    intro: "One or two sentences that say more about the page.",
    action: { label: "A label that says what the button does", href: "@booking" },
  },
});
