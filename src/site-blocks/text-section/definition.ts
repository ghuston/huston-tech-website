import { defineBlock } from "../../blocks/schema.ts";

export const textSectionDefinition = defineBlock({
  type: "text-section",
  title: "Text section",
  description: "A heading and one paragraph, with an optional link inside the paragraph, a link under it or a call button, and a fading line above if wanted.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90 },
    divider: { kind: "boolean", label: "Fading line above the heading", required: false },
    width: { kind: "choice", label: "Line length of the paragraph", options: ["intro", "measure"] },
    body: { kind: "text", label: "Paragraph", max: 800 },
    inlineLink: { kind: "action", label: "Link inside the paragraph", labelMax: 60, required: false, help: "Sits right after the paragraph text; anything that follows it goes in 'After the link'." },
    afterLink: { kind: "text", label: "After the link", max: 40, required: false },
    more: { kind: "action", label: "Link under the paragraph", labelMax: 40, required: false },
    cta: { kind: "text", label: "Call button label", max: 60, required: false, help: "A button that opens the booking page, under the paragraph." },
  },
  variants: [{ name: "default", description: "Heading, then the paragraph at a readable line length." }],
  placement: { position: "any", maxPerPage: 12, rhythm: "compact", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4); this section has none." },
  example: {
    heading: "A heading for one idea",
    width: "intro",
    body: "One paragraph that says it plainly.",
  },
});
