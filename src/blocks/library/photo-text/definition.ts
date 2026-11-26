import { defineBlock } from "../../schema.ts";

export const photoTextDefinition = defineBlock({
  type: "photo-text",
  title: "Photo with text",
  description: "One photo beside a heading, a few paragraphs and an optional button. Good for an about section, a place or a service.",
  source: "library",
  fields: {
    image: { kind: "image", shape: "4:3", label: "Photo", help: "Cropped to a 4 by 3 shape." },
    heading: { kind: "text", label: "Heading", max: 90 },
    paragraphs: { kind: "list", label: "Paragraphs", min: 1, max: 4, of: { kind: "text", label: "Paragraph", max: 600 } },
    action: { kind: "action", label: "Button", labelMax: 40, required: false },
  },
  variants: [
    { name: "photo-start", description: "The photo sits on the left on wide screens, the text on the right. On phones the photo is above the text." },
    { name: "photo-end", description: "The photo sits on the right on wide screens, the text on the left. On phones the photo is above the text." },
  ],
  placement: { position: "any", maxPerPage: 4, rhythm: "section" },
  motion: { entrance: "default" },
  example: {
    image: {
      src: "/images/examples/vase-and-pears.jpg",
      alt: "Abstract still life: a pale vase and two pears in soft window light",
    },
    heading: "A short heading that says what the photo is about",
    paragraphs: [
      "A few sentences that tell the story behind the photo in plain words.",
      "A second paragraph for the detail a visitor would ask about next.",
    ],
    action: { label: "A short button label", href: "/contact" },
  },
});
