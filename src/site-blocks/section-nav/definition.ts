import { defineBlock } from "../../blocks/schema.ts";

export const sectionNavDefinition = defineBlock({
  type: "section-nav",
  title: "In-page section links",
  description: "A row of links to the sections further down the page, with the current one underlined as the visitor scrolls. It can stay stuck under the header.",
  source: "site",
  fields: {
    label: { kind: "text", label: "Name of the navigation, for screen readers", max: 40 },
    sticky: { kind: "boolean", label: "Stays under the header while scrolling", required: false },
    items: {
      kind: "list",
      label: "Links",
      min: 2,
      max: 6,
      of: {
        kind: "object",
        label: "Link",
        fields: {
          label: { kind: "text", label: "Link text", max: 30 },
          href: { kind: "text", label: "Section address", max: 40, help: "A # and the anchor of a block further down this page, such as #websites." },
        },
      },
    },
  },
  variants: [{ name: "default", description: "A single row of links; it scrolls sideways on a phone." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "flush", contents: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4); native scrolling is never touched." },
  interactive: "It marks the section in view with an IntersectionObserver.",
  example: { label: "On this page", items: [{ label: "First", href: "#first" }, { label: "Second", href: "#second" }] },
});
