import { defineBlock } from "../../schema.ts";

export const videoListDefinition = defineBlock({
  type: "video-list",
  title: "Video list",
  description: "The newest videos from your Videos collection, side by side, each with its title and caption. Add videos in the collection; this block shows them.",
  source: "library",
  collection: "videos",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90, help: "Names the group of videos for everyone, including screen reader users." },
    intro: { kind: "text", label: "Intro", max: 240, required: false },
    count: { kind: "number", label: "How many", min: 1, max: 24, required: false, help: "The newest this many videos are shown. Twelve when left empty." },
  },
  variants: [
    { name: "two-column", description: "The videos sit in two columns (one column on phones)." },
    { name: "three-column", description: "The videos sit in three columns on wide screens (with three or more videos), two on tablets, one on phones." },
  ],
  placement: { position: "any", maxPerPage: 2, rhythm: "section" },
  motion: { entrance: "default" },
  interactive: "The play button swaps in the player only when it is pressed, so nothing loads from YouTube or Vimeo before that.",
  example: {
    heading: "A short heading that introduces the videos",
    intro: "A sentence that says what the videos are about.",
    count: 6,
  },
});
