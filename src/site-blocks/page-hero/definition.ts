import { defineBlock } from "../../blocks/schema.ts";

export const pageHeroDefinition = defineBlock({
  type: "page-hero",
  title: "Page hero",
  description: "The top of an inner page: a small line above, the page headline and a short introduction, with a quarter of the logo ring and a soft glow in the corner.",
  source: "site",
  fields: {
    eyebrow: { kind: "text", label: "Small line above the headline", max: 60, required: false },
    title: { kind: "text", label: "Headline", max: 90, help: "The page's one main heading." },
    intro: { kind: "text", label: "Introduction", max: 400, required: false },
    introLink: { kind: "action", label: "Link inside the introduction", labelMax: 80, required: false, help: "Sits right after the introduction text; the words that follow it go in 'After the link'." },
    introAfter: { kind: "text", label: "After the link", max: 120, required: false },
    cta: { kind: "text", label: "Call button label", max: 60, required: false, help: "A button that opens the booking page." },
  },
  variants: [{ name: "default", description: "Left-aligned, with the ring and a green glow in the top-right corner." }],
  placement: { position: "first", maxPerPage: 1, rhythm: "hero" },
  motion: { entrance: "none", reason: "The first block is the first paint, and the ring and glow are static (STYLE-GUIDE §7.25)." },
  example: {
    eyebrow: "A short line that sets the scene",
    title: "A headline that says what this page is about",
    intro: "One or two sentences that say more about the page.",
  },
});
