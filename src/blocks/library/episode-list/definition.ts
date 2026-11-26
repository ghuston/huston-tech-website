import { defineBlock } from "../../schema.ts";

export const episodeListDefinition = defineBlock({
  type: "episode-list",
  title: "Podcast episodes",
  description: "The newest episodes from your Podcast episodes collection, each with its date and summary. Add episodes in the collection; this block shows them.",
  source: "library",
  collection: "episodes",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90, help: "Names the list of episodes for everyone, including screen reader users." },
    intro: { kind: "text", label: "Intro", max: 240, required: false },
    count: { kind: "number", label: "How many", min: 1, max: 24, required: false, help: "The newest this many episodes are shown. Ten when left empty." },
  },
  variants: [
    { name: "list", description: "One row per episode with its player beside the text on wide screens (below it on phones)." },
    { name: "compact", description: "One row per episode with its date and a link that opens the episode on Spotify or Apple Podcasts. No player." },
  ],
  placement: { position: "any", maxPerPage: 2, rhythm: "section" },
  motion: { entrance: "default" },
  interactive: "The play button swaps in the Spotify or Apple Podcasts player only when it is pressed, so nothing loads from them before that.",
  example: {
    heading: "A short heading that introduces the episodes",
    intro: "A sentence that says what the show is about.",
    count: 3,
  },
});
