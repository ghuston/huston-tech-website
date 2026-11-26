import { defineBlock } from "../../blocks/schema.ts";

export const homeInstallingDefinition = defineBlock({
  type: "home-installing",
  title: "What I'm installing now",
  description: "A heading with the things an owner says and what the system does, the app's phone screens, and a line with a link.",
  source: "site",
  fields: {
    eyebrow: { kind: "text", label: "Small line above the heading", max: 60 },
    heading: { kind: "text", label: "Heading", max: 100 },
    pairs: {
      kind: "list",
      label: "What is said, and what happens",
      min: 1,
      max: 5,
      of: {
        kind: "object",
        label: "Pair",
        fields: {
          said: { kind: "text", label: "What the owner says", max: 140 },
          result: { kind: "text", label: "What the system does", max: 140 },
        },
      },
    },
    screens: {
      kind: "list",
      label: "Phone screens",
      min: 1,
      max: 4,
      of: {
        kind: "object",
        label: "Screen",
        fields: {
          key: { kind: "choice", label: "Which screen", options: ["today", "pipeline", "brief", "rule"] },
          label: { kind: "text", label: "Name", max: 30 },
          alt: { kind: "text", label: "What the screen shows", max: 160 },
        },
      },
    },
    screensLabel: { kind: "text", label: "Name of the swipe row, for screen readers", max: 60 },
    screensNote: { kind: "text", label: "Line under the screens", max: 30 },
    line: { kind: "text", label: "Closing sentence", max: 320 },
    link: {
      kind: "object",
      label: "Link under the sentence",
      fields: {
        label: { kind: "text", label: "Link text", max: 60 },
        href: { kind: "link", label: "Link" },
      },
    },
  },
  variants: [{ name: "default", description: "Heading, talk pairs, phone screens and a line, in one column, then two, then three as the screen widens." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "installing" },
  motion: { entrance: "none", reason: "Keeps this site's own one-moment-per-section motion (STYLE-GUIDE §9.4): the talk pairs play once in view." },
  example: {
    eyebrow: "What I'm working on now",
    heading: "A heading that names the system",
    pairs: [{ said: "“Something the owner says.”", result: "What the system does." }],
    screens: [{ key: "today", label: "Today", alt: "The Today screen of the follow-up app, with demo data" }],
    screensLabel: "App screens, demo data",
    screensNote: "Demo data",
    line: "One sentence about how it is set up and handed over.",
    link: { label: "See how it works →", href: "/contact" },
  },
});
