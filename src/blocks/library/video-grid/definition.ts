import { defineBlock } from "../../schema.ts";

export const videoGridDefinition = defineBlock({
  type: "video-grid",
  title: "Video grid",
  description: "Two to six videos from YouTube or Vimeo side by side, each with a title and a short caption.",
  source: "library",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90, help: "Names the group of videos for everyone, including screen reader users." },
    videos: {
      kind: "list",
      label: "Videos",
      min: 2,
      max: 6,
      of: {
        kind: "object",
        label: "Video",
        fields: {
          url: { kind: "video", label: "Video address", help: "A YouTube or Vimeo address." },
          title: { kind: "text", label: "Title", max: 80 },
          caption: { kind: "text", label: "Caption", max: 200, required: false },
          poster: { kind: "image", shape: "16:9", label: "Cover picture", required: false },
        },
      },
    },
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
    videos: [
      { url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", title: "A short title for the first video", caption: "A sentence about the first video." },
      { url: "https://vimeo.com/1084537", title: "A short title for the second video", caption: "A sentence about the second video." },
      { url: "https://youtu.be/aqz-KE-bpKQ", title: "A short title for the third video", caption: "A sentence about the third video." },
    ],
  },
});
