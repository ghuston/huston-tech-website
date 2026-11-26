import { defineBlock } from "../../blocks/schema.ts";

export const homeAboutDefinition = defineBlock({
  type: "home-about",
  title: "About teaser",
  description: "The owner's headshot inside the logo ring, a heading, one paragraph and a link to the About page.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    body: { kind: "text", label: "Paragraph", max: 400 },
    link: {
      kind: "object",
      label: "Link",
      fields: {
        label: { kind: "text", label: "Link text", max: 40 },
        href: { kind: "link", label: "Link" },
      },
    },
  },
  variants: [{ name: "default", description: "Headshot on the left, words on the right (stacked on phones); the rust dot travels the ring once in view." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "teaser", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own one-moment-per-section motion (STYLE-GUIDE §9.4): the ring's dot travels once in view." },
  example: {
    heading: "Hi, I'm Grant.",
    body: "Two sentences about who I am and why I started the business.",
    link: { label: "More about me →", href: "/about" },
  },
});
