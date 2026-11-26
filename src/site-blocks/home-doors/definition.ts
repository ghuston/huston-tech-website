import { defineBlock } from "../../blocks/schema.ts";

export const homeDoorsDefinition = defineBlock({
  type: "home-doors",
  title: "The two doors",
  description: "Two ways to start, one card each, taken from the site's two offers. \"Say hello\" in the menu lands here.",
  source: "site",
  fields: {
    label: { kind: "text", label: "Name of the band, for screen readers", max: 60, help: "The band has no visible heading; each door's own title carries the structure." },
  },
  variants: [{ name: "default", description: "Two doors side by side (stacked on phones); each swings open on hover or focus." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "doors" },
  motion: { entrance: "none", reason: "Keeps this site's own door swing and one-moment-per-section motion (STYLE-GUIDE §9.4)." },
  fixedAnchor: "hello",
  example: { label: "Two ways to start" },
});
