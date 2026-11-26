import { defineBlock } from "../../schema.ts";

export const latestPostsDefinition = defineBlock({
  type: "latest-posts",
  title: "Latest posts",
  description: "The newest blog posts, with a heading and an optional link to all of them. It updates by itself when a post is added, and is left out of the page while there is no post.",
  source: "library",
  collection: "posts",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90 },
    intro: { kind: "text", label: "Introduction", max: 200, required: false },
    count: { kind: "number", label: "How many posts", min: 1, max: 6, required: false, help: "From 1 to 6. Three when left empty." },
    action: { kind: "action", label: "Link to all posts", labelMax: 40, required: false },
  },
  variants: [
    { name: "cards", description: "Each post is a card with its photo on top (a tinted panel with the date when it has no photo), then the date, title and summary." },
    { name: "list", description: "Each post is a row with its date, title and summary, divided by soft lines." },
  ],
  placement: { position: "any", maxPerPage: 1, rhythm: "section" },
  motion: { entrance: "default" },
  example: {
    heading: "A short heading for the newest posts",
    intro: "One sentence that says what the posts are about.",
    count: 3,
    action: { label: "All posts →", href: "/blog" },
  },
});
