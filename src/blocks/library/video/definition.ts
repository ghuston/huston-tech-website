import { defineBlock } from "../../schema.ts";

export const videoDefinition = defineBlock({
  type: "video",
  title: "Video",
  description: "One video from YouTube or Vimeo, with a title and a short caption. It plays on the page when a visitor presses play.",
  source: "library",
  fields: {
    url: { kind: "video", label: "Video address", help: "A YouTube or Vimeo address." },
    title: { kind: "text", label: "Title", max: 80 },
    caption: { kind: "text", label: "Caption", max: 200, required: false },
    poster: { kind: "image", shape: "16:9", label: "Cover picture", required: false, help: "Shown before play. Without one the video shows a plain dark panel." },
  },
  variants: [
    { name: "wide", description: "As wide as the page column." },
    { name: "inset", description: "Narrower and centered, the width of a reading column." },
  ],
  placement: { position: "any", maxPerPage: 4, rhythm: "section" },
  motion: { entrance: "default" },
  interactive: "The play button swaps in the player only when it is pressed, so nothing loads from YouTube or Vimeo before that.",
  example: {
    url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    title: "A short title that says what the video shows",
    caption: "A sentence that says what to expect before pressing play.",
  },
});
