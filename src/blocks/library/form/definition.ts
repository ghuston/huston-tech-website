import { defineBlock } from "../../schema.ts";

export const formDefinition = defineBlock({
  type: "form",
  title: "Form",
  description:
    "One of the site's forms (a quote request, a download sign-up) in a panel, with an optional heading and a sentence above or beside it. The form's fields, button and thank-you message are in its own form file.",
  source: "library",
  fields: {
    form: { kind: "form", label: "Form", help: "The id of a live form, other than the contact form." },
    heading: { kind: "text", label: "Heading", max: 60, required: false },
    intro: { kind: "text", label: "Intro", max: 300, required: false },
  },
  variants: [
    { name: "stacked", description: "The heading and intro above the form panel, in one centred column." },
    { name: "beside", description: "The heading and intro on the left, the form panel on the right (stacked on phones)." },
  ],
  placement: { position: "any", maxPerPage: 1, rhythm: "compact" },
  motion: { entrance: "none", reason: "People type here, so the form stays still and is usable the moment it appears." },
  example: {
    form: "showcase-example",
    heading: "A short heading that says what the form is for",
    intro: "A sentence or two that says what happens after the visitor sends the form.",
  },
});
