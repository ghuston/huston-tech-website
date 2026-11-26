import { defineBlock } from "../../schema.ts";

export const contactFormDefinition = defineBlock({
  type: "contact-form",
  title: "Contact form",
  description: "A booking column next to the site's contact form. The form itself is wired to the site's own settings.",
  source: "library",
  fields: {
    heading: { kind: "text", label: "Booking heading", max: 60 },
    body: { kind: "text", label: "Booking text", max: 400 },
    buttonLabel: { kind: "text", label: "Booking button label", max: 40 },
    unsetNote: {
      kind: "text",
      label: "Note shown while no booking link is set",
      max: 120,
      help: "Visitors see this instead of a working button until the site's booking link is set up.",
    },
  },
  variants: [{ name: "default", description: "The booking column on the left, the form on the right (stacked on phones)." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "compact", joinsHero: true },
  motion: { entrance: "none", reason: "People type here, so the form stays still and is usable the moment it appears." },
  fixedAnchor: "book",
  example: {
    heading: "A short heading about booking a time",
    body: "A sentence or two that says what a booking is for.",
    buttonLabel: "A label that says what the button does",
    unsetNote: "A note that says the booking link is not set up yet",
  },
});
