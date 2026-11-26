import { defineBlock } from "../../blocks/schema.ts";

export const closingCallDefinition = defineBlock({
  type: "closing-call",
  title: "Closing call",
  description: "The last block of a page: a heading (one line, or two in the second voice), an optional sentence, the call button and an optional second link, blended into the page by a soft glow.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading (single voice)", max: 90, required: false, help: "Use this, or line 1 and line 2 for the two-voice heading." },
    line1: { kind: "text", label: "Heading, line 1 (first voice)", max: 60, required: false },
    line2: { kind: "text", label: "Heading, line 2 (second voice)", max: 80, required: false },
    body: { kind: "text", label: "Sentence under the heading", max: 240, required: false },
    cta: { kind: "text", label: "Button label", max: 60 },
    secondary: { kind: "action", label: "Second link", labelMax: 40, required: false },
  },
  variants: [{ name: "default", description: "Left-aligned, with a soft seam glow along its top edge." }],
  placement: { position: "last", maxPerPage: 1, rhythm: "section" },
  motion: { entrance: "none", reason: "Keeps this site's own one-moment-per-section motion (STYLE-GUIDE §9.4); this section has none." },
  example: {
    line1: "A first line in the heading voice.",
    line2: "A second line in the other voice.",
    body: "One sentence that says what happens next.",
    cta: "A label that says what the button does",
    secondary: { label: "Or send a quick note →", href: "/contact" },
  },
});
