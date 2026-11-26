// The five collection kinds: their fields, limits, sort and example items. Import-free apart from its siblings. Fields use
// the block field schema, so one validator judges blocks and items. Labels and help are template UI copy.
import type { Fields } from "../blocks/schema.ts";
import { siteCollectionFields } from "../site-blocks/collection-fields.ts";
import type { CollectionDefinition, LoadedItem } from "./schema.ts";

const example = (kind: LoadedItem["kind"], slug: string, data: Record<string, unknown>): LoadedItem => ({ kind, slug, status: "live", data });

const postFields = {
  title: { kind: "text", label: "Title", max: 90 },
  description: { kind: "text", label: "Summary", max: 170, help: "The search description, and the summary shown in lists." },
  date: { kind: "date", label: "Date", help: "The day the post was written, like 2026-03-27." },
  updated: { kind: "date", label: "Updated", required: false, help: "Only when the post was changed later." },
  image: { kind: "image", shape: "3:2", label: "Photo", required: false },
  body: { kind: "body", label: "Post", maxParts: 200, maxChars: 40000 },
} as const satisfies Fields;

const videoFields = {
  title: { kind: "text", label: "Title", max: 90 },
  url: { kind: "video", label: "Video address", help: "A YouTube or Vimeo address." },
  caption: { kind: "text", label: "Caption", max: 200, required: false },
  date: { kind: "date", label: "Date" },
} as const satisfies Fields;

const episodeFields = {
  title: { kind: "text", label: "Title", max: 90 },
  url: { kind: "audio", label: "Episode address", help: "A Spotify or Apple Podcasts episode address." },
  summary: { kind: "text", label: "Summary", max: 300, required: false },
  date: { kind: "date", label: "Date" },
} as const satisfies Fields;

const testimonialFields = {
  quote: { kind: "text", label: "Quote", max: 600, help: "Only words the client really said." },
  name: { kind: "text", label: "Name", max: 80, help: "The named person who said it." },
  role: { kind: "text", label: "Role", max: 60, required: false },
  organization: { kind: "text", label: "Business", max: 80, required: false },
  order: { kind: "number", label: "Order", min: 0, max: 999, help: "Lower numbers come first." },
  ...siteCollectionFields.testimonials,
} as const satisfies Fields;

const teamFields = {
  name: { kind: "text", label: "Name", max: 80 },
  role: { kind: "text", label: "Role", max: 60 },
  bio: { kind: "text", label: "Bio", max: 400, required: false },
  photo: { kind: "image", shape: "4:5", label: "Photo", required: false },
  order: { kind: "number", label: "Order", min: 0, max: 999, help: "Lower numbers come first." },
} as const satisfies Fields;

const postBody = [
  { type: "heading", level: 2, text: "[[A heading that opens the first section]]" },
  { type: "paragraph", text: ["[[A paragraph that explains the first idea. Questions? ]]", { text: "Get in touch", href: "/contact" }, "."] },
  { type: "list", style: "bullet", items: ["[[First point]]", "[[Second point]]"] },
  { type: "quote", text: "[[A short quote worth pulling out]]", source: "[[Who said it]]" },
  {
    type: "photo",
    image: { src: "/images/examples/window-light.jpg", alt: "Soft light falling through a window onto a wooden table" },
    caption: "[[A caption for the photo]]",
  },
];

export const collections: CollectionDefinition[] = [
  {
    kind: "posts",
    title: "Posts",
    singular: "post",
    description: "Blog posts. Each one is a page at /blog/<slug>, listed newest first on /blog.",
    fields: postFields,
    sort: "date",
    labelField: "title",
    example: [
      example("posts", "example", {
        title: "[[Post title]]", description: "[[A sentence that says what the post is about]]", date: "2026-03-27",
        image: { src: "/images/examples/vase-and-pears.jpg", alt: "A pale blue vase beside a blue pear and a rust-red pear on a table" },
        body: postBody,
      }),
      example("posts", "example-two", {
        title: "[[Second post title]]", description: "[[A sentence that says what this post is about]]", date: "2026-02-20",
        image: { src: "/images/examples/bowl-and-lemons.jpg", alt: "A shallow bowl holding three blue fruits beside one rust-red fruit" },
        body: postBody.slice(0, 2),
      }),
      example("posts", "example-three", { title: "[[Third post title]]", description: "[[A sentence that says what this post is about]]", date: "2026-01-12", body: postBody.slice(0, 2) }),
    ],
  },
  {
    kind: "videos",
    title: "Videos",
    singular: "video",
    description: "Videos from YouTube or Vimeo. A video plays on the page only when a visitor presses play.",
    fields: videoFields,
    sort: "date",
    labelField: "title",
    example: [
      example("videos", "example", { title: "[[Video title]]", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", caption: "[[A sentence that says what to expect]]", date: "2026-03-27" }),
      example("videos", "example-two", { title: "[[Second video title]]", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", date: "2026-02-20" }),
      example("videos", "example-three", { title: "[[Third video title]]", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", date: "2026-01-12" }),
    ],
  },
  {
    kind: "episodes",
    title: "Podcast episodes",
    singular: "episode",
    description: "Podcast episodes from Spotify or Apple Podcasts. An episode plays on the page only when a visitor presses play.",
    fields: episodeFields,
    sort: "date",
    labelField: "title",
    example: [
      example("episodes", "example", { title: "[[Episode title]]", url: "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk", summary: "[[A sentence or two about the episode]]", date: "2026-03-27" }),
      example("episodes", "example-two", { title: "[[Second episode title]]", url: "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk", date: "2026-02-20" }),
      example("episodes", "example-three", { title: "[[Third episode title]]", url: "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk", date: "2026-01-12" }),
    ],
  },
  {
    kind: "testimonials",
    title: "Testimonials",
    singular: "testimonial",
    description: "Quotes from named clients, in the order you choose. Never write one the client did not say.",
    fields: testimonialFields,
    sort: "order",
    labelField: "name",
    example: [
      example("testimonials", "example", { quote: "[[Client quote, from a named client]]", name: "[[Client name]]", role: "[[Client role]]", organization: "[[Client business]]", order: 1 }),
      example("testimonials", "example-two", { quote: "[[Second client quote, from a named client]]", name: "[[Second client name]]", order: 2 }),
      example("testimonials", "example-three", { quote: "[[Third client quote, from a named client]]", name: "[[Third client name]]", order: 3 }),
    ],
  },
  {
    kind: "team",
    title: "Team",
    singular: "team member",
    description: "The people on the team, in the order you choose.",
    fields: teamFields,
    sort: "order",
    labelField: "name",
    example: [
      example("team", "example", {
        name: "[[Team member name]]", role: "[[Team member role]]", bio: "[[Two sentences about this person]]",
        photo: { src: "/images/examples/jug-and-cups.jpg", alt: "A tall blue jug beside two small cups on a table" },
        order: 1,
      }),
      example("team", "example-two", {
        name: "[[Second team member name]]", role: "[[Second team member role]]",
        photo: { src: "/images/examples/candle-and-plate.jpg", alt: "A lit pale candle beside a blue egg-shaped object on a white plate" },
        order: 2,
      }),
      example("team", "example-three", { name: "[[Third team member name]]", role: "[[Third team member role]]", order: 3 }),
    ],
  },
];

export function collectionFor(kind: string): CollectionDefinition | undefined {
  return collections.find((c) => c.kind === kind);
}
