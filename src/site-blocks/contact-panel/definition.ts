import { defineBlock } from "../../blocks/schema.ts";

export const contactPanelDefinition = defineBlock({
  type: "contact-panel",
  title: "Contact panel",
  description: "The booking column (the scheduler button, with a drawing of the note's path beside the form) next to the note form.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Booking heading", max: 60 },
    body: { kind: "text", label: "Booking sentence", max: 240 },
    buttonLabel: { kind: "text", label: "Booking button label", max: 40 },
    unsetNote: { kind: "text", label: "Note shown until a booking link is set", max: 80, help: "Only ever seen while the site has no scheduler link; it fails the launch check on purpose." },
  },
  variants: [{ name: "default", description: "Booking column on the left, the note form on the right (form first on phones)." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "compact", joinsHero: true, plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4): the form has no entrance, the path drawing plays once." },
  interactive: "The note form is a client component: it checks the answers, loads the bot check on focus and posts the note.",
  example: {
    heading: "Book a 20-minute call",
    body: "Pick a time that works. Tell me what you need and I'll tell you whether there's a sensible next step.",
    buttonLabel: "Pick a time →",
    unsetNote: "Booking link not set yet.",
  },
});
