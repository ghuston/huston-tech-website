import { defineBlock } from "../../schema.ts";

export const postIndexDefinition = defineBlock({
  type: "post-index",
  title: "Post index",
  description: "The list of every blog post, newest first, ten to a page, with links to newer and older pages. It belongs on the blog page only, once.",
  source: "library",
  collection: "posts",
  fields: {
    emptyText: { kind: "text", label: "Text while there are no posts", max: 160, help: "Shown on the blog page when no post is live yet." },
  },
  variants: [
    { name: "list", description: "Each post is a row with its date, title and summary, divided by soft lines." },
    { name: "cards", description: "The posts are cards in a grid, each with its photo on top (a tinted panel with the date when it has no photo)." },
  ],
  placement: { position: "any", maxPerPage: 1, rhythm: "section", joinsHero: true, onlyOn: "/blog" },
  motion: { entrance: "default" },
  example: {
    emptyText: "No posts yet. The first one is on its way.",
  },
});
