import { defineBlock } from "../../blocks/schema.ts";

export const insightsIndexDefinition = defineBlock({
  type: "insights-index",
  title: "Insights index",
  description: "The article list on Insights: a row of categories once there are articles, and until then one line with a link to ask a question.",
  source: "site",
  fields: {
    categories: {
      kind: "list",
      label: "Categories",
      help: "Shown only once there are articles. The first is the active one.",
      min: 1,
      max: 10,
      of: { kind: "text", label: "Category", max: 40 },
    },
    emptyText: { kind: "text", label: "Line shown while there are no articles", max: 160 },
    askLink: {
      kind: "object",
      label: "Link after that line",
      fields: {
        label: { kind: "text", label: "Link text", max: 40 },
        href: { kind: "link", label: "Link" },
      },
    },
  },
  variants: [{ name: "default", description: "The category row (when there are articles), then the line." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "compact", joinsHero: true, onlyOn: "/insights", plainWrapper: true },
  motion: { entrance: "none", reason: "Plain list and text with no motion of its own (STYLE-GUIDE §9.4); it shows at once." },
  example: {
    categories: ["All", "Websites"],
    emptyText: "Nothing here yet. Got a question you'd like answered?",
    askLink: { label: "Ask me →", href: "/contact" },
  },
});
