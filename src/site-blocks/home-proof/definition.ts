import { defineBlock } from "../../blocks/schema.ts";

export const homeProofDefinition = defineBlock({
  type: "home-proof",
  title: "Proof",
  description: "A heading with a tag, the client quotes chosen for the home page, a row of survey scores and two case-study teasers with a screenshot each.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 80 },
    tag: { kind: "text", label: "Tag beside the heading", max: 60 },
    quotesLabel: { kind: "text", label: "Name of the quotes' swipe row, for screen readers", max: 40 },
    stats: {
      kind: "list",
      label: "Survey scores",
      min: 1,
      max: 5,
      of: {
        kind: "object",
        label: "Score",
        fields: {
          value: { kind: "text", label: "Figure", max: 20 },
          label: { kind: "text", label: "What it measures", max: 60 },
        },
      },
    },
    footnote: { kind: "text", label: "Small print", max: 120 },
    teasers: {
      kind: "list",
      label: "Case-study teasers",
      min: 1,
      max: 4,
      of: {
        kind: "object",
        label: "Teaser",
        fields: {
          name: { kind: "text", label: "Project", max: 60 },
          body: { kind: "text", label: "One sentence", max: 200 },
          href: { kind: "link", label: "Page and section it links to" },
          image: {
            kind: "object",
            label: "Screenshot",
            fields: {
              src: { kind: "text", label: "File under public/, without .avif or .webp", max: 80 },
              alt: { kind: "text", label: "What the screenshot shows", max: 200 },
              width: { kind: "number", label: "Width in pixels", min: 100, max: 4000 },
              height: { kind: "number", label: "Height in pixels", min: 100, max: 4000 },
            },
          },
        },
      },
    },
    teaserLinkLabel: { kind: "text", label: "Link text on every teaser", max: 40 },
  },
  variants: [{ name: "default", description: "Heading and tag, three quotes, score chips, then two teaser cards side by side." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "proof" },
  motion: { entrance: "none", reason: "Keeps this site's own one-moment-per-section motion (STYLE-GUIDE §9.4): the score chips pop in once in view." },
  example: {
    heading: "What clients said afterward",
    tag: "Custom systems, 2024 to 2025",
    quotesLabel: "Client quotes",
    stats: [{ value: "3 of 3", label: "met the goals set at kickoff" }],
    footnote: "From client wrap-up surveys. A small sample, I know.",
    teasers: [
      {
        name: "Hideout Fitness",
        body: "An owner dashboard for retention, revenue and profit by coach and client.",
        href: "/past-work#hideout-fitness",
        image: { src: "/work/systems-1", alt: "An owner dashboard with pie charts of profit against trainer pay by session type and bar charts of average profit", width: 1200, height: 656 },
      },
    ],
    teaserLinkLabel: "Read the project →",
  },
});
