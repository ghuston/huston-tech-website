import { defineBlock } from "../../blocks/schema.ts";

export const servicesWebsitesDefinition = defineBlock({
  type: "services-websites",
  title: "The website offer",
  description: "The website offer in full: a heading and paragraphs beside a line drawing, what is included, the details (after launch, price) and a button.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    paragraphs: { kind: "list", label: "Paragraphs beside the drawing", min: 1, max: 3, of: { kind: "text", label: "Paragraph", max: 500 } },
    includesHeading: { kind: "text", label: "Heading above the list", max: 60 },
    includes: { kind: "list", label: "What is included", min: 1, max: 8, of: { kind: "text", label: "Item", max: 200 } },
    details: { kind: "list", label: "Details under the list", min: 1, max: 4, of: { kind: "text", label: "Paragraph", max: 600 } },
    cta: {
      kind: "object",
      label: "Button",
      fields: {
        label: { kind: "text", label: "Button label", max: 40 },
        href: { kind: "text", label: "Address", max: 80, help: "Written as /contact?topic=website; the contact form reads the topic." },
      },
    },
  },
  variants: [{ name: "default", description: "Text beside a drawing of site frames, then the included list, details and button." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "compact", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own one-moment-per-section motion (STYLE-GUIDE §9.4): the drawing is drawn once in view." },
  example: {
    heading: "Accelerated Websites",
    paragraphs: ["What the offer is, in one paragraph."],
    includesHeading: "What's included",
    includes: ["A custom design"],
    details: ["**Price:** fixed, and agreed in writing before I start."],
    cta: { label: "Start a website →", href: "/contact?topic=website" },
  },
});
