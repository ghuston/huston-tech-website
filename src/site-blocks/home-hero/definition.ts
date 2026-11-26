import { defineBlock } from "../../blocks/schema.ts";

export const homeHeroDefinition = defineBlock({
  type: "home-hero",
  title: "Home hero",
  description: "The home page's first screen: a small line, the two-voice headline, a short pitch, one line of reassurance, the call button with a link beside it, and the card stack on the right.",
  source: "site",
  fields: {
    eyebrow: { kind: "text", label: "Small line above the headline", max: 120 },
    line1: { kind: "text", label: "Headline, line 1 (first voice)", max: 60 },
    line2: { kind: "text", label: "Headline, line 2 (second voice)", max: 60 },
    subhead: { kind: "text", label: "Pitch under the headline", max: 320 },
    supportingLine: { kind: "text", label: "One line of reassurance", max: 60 },
    cta: { kind: "text", label: "Call button label", max: 60 },
    installLink: {
      kind: "object",
      label: "Link beside the button",
      fields: {
        label: { kind: "text", label: "Link text", max: 60 },
        href: { kind: "text", label: "Section it jumps to, written #name", max: 40 },
      },
    },
    stack: {
      kind: "object",
      label: "The card stack",
      help: "All names on the cards are invented stand-ins; no real person's data.",
      fields: {
        ariaLabel: { kind: "text", label: "What the picture shows, for screen readers", max: 300 },
        board: {
          kind: "object",
          label: "The owner's board",
          fields: {
            heading: { kind: "text", label: "Board heading", max: 30 },
            rows: {
              kind: "list",
              label: "Board rows",
              min: 1,
              max: 4,
              of: {
                kind: "object",
                label: "Row",
                fields: {
                  name: { kind: "text", label: "Name", max: 40 },
                  detail: { kind: "text", label: "Detail", max: 60 },
                  status: { kind: "text", label: "Status", max: 20 },
                  highlighted: { kind: "boolean", label: "Highlighted row" },
                },
              },
            },
          },
        },
        say: {
          kind: "object",
          label: "The spoken note",
          fields: { tag: { kind: "text", label: "Label", max: 40 }, said: { kind: "text", label: "What is said", max: 160 } },
        },
        brief: {
          kind: "object",
          label: "The brief before the next call",
          fields: {
            tag: { kind: "text", label: "Label", max: 40 },
            name: { kind: "text", label: "Name", max: 40 },
            time: { kind: "text", label: "Time", max: 20 },
            line: { kind: "text", label: "Line", max: 80 },
          },
        },
        rule: {
          kind: "object",
          label: "The rule added by asking",
          fields: {
            tag: { kind: "text", label: "Label", max: 40 },
            rule: { kind: "text", label: "The rule", max: 120 },
            undo: { kind: "text", label: "The undo line", max: 80 },
          },
        },
        chip: {
          kind: "object",
          label: "The chip",
          fields: { figure: { kind: "text", label: "Figure", max: 30 }, label: { kind: "text", label: "Label", max: 60 } },
        },
      },
    },
  },
  variants: [{ name: "default", description: "Text on the left, the card stack on the right (below it on phones), with a green glow behind the stack." }],
  placement: { position: "first", maxPerPage: 1, rhythm: "flush" },
  motion: { entrance: "none", reason: "Keeps this site's own headline rise and stack motion (STYLE-GUIDE §5, §9); the first block never waits on scroll." },
  example: {
    eyebrow: "A short line that sets the scene.",
    line1: "A first line in the heading voice",
    line2: "and a second in the other.",
    subhead: "Two sentences that say what you build and how it works for the client.",
    supportingLine: "One short line of reassurance.",
    cta: "Book a free 20-minute call →",
    installLink: { label: "See what I'm working on ↘", href: "#installing" },
    stack: {
      ariaLabel: "A board of today's follow-ups, with a spoken note, a brief and a rule around it.",
      board: { heading: "Today", rows: [{ name: "Dana Ortiz", detail: "Quote, three units", status: "Due Fri", highlighted: true }] },
      say: { tag: "You say", said: "Just talked to Dana. She wants a quote by Friday." },
      brief: { tag: "Before your next call", name: "Dana Ortiz", time: "2:00 pm", line: "Wants three units." },
      rule: { tag: "A rule you added", rule: "Nudge me three days after any proposal.", undo: "Don't like it? “Undo that.”" },
      chip: { figure: "Notes saved", label: "Follow-up set for Friday" },
    },
  },
});
