import { defineBlock } from "../../schema.ts";

export const galleryDefinition = defineBlock({
  type: "gallery",
  title: "Photo gallery",
  description: "Two to twelve photos in a grid, each with an optional caption. The photos do not open larger.",
  source: "library",
  fields: {
    heading: { kind: "text", label: "Heading", max: 90, help: "Names the group of photos for everyone, including screen reader users." },
    intro: { kind: "text", label: "Introduction", max: 280, required: false },
    photos: {
      kind: "list",
      label: "Photos",
      min: 2,
      max: 12,
      of: {
        kind: "object",
        label: "Photo",
        fields: {
          image: { kind: "image", shape: "3:2", label: "Photo", help: "Cropped to a 3 by 2 shape." },
          caption: { kind: "text", label: "Caption", max: 140, required: false },
        },
      },
    },
  },
  variants: [
    { name: "three-column", description: "The photos sit three across on wide screens and two across on tablets and phones." },
    { name: "two-column", description: "The photos sit two across on wide screens and tablets, and one across on phones." },
  ],
  placement: { position: "any", maxPerPage: 2, rhythm: "section" },
  motion: { entrance: "default" },
  example: {
    heading: "A short heading that names the photos",
    intro: "A sentence that says what the photos show.",
    photos: [
      { image: { src: "/images/examples/vase-and-pears.jpg", alt: "Abstract still life: a pale vase and two pears in soft window light" }, caption: "A short caption for the first photo." },
      { image: { src: "/images/examples/bowl-and-lemons.jpg", alt: "Abstract still life: a shallow bowl with three lemons on a pale table" }, caption: "A short caption for the second photo." },
      { image: { src: "/images/examples/jug-and-cups.jpg", alt: "Abstract still life: a tall jug beside two small cups in morning light" } },
      { image: { src: "/images/examples/stacked-books.jpg", alt: "Abstract still life: a stack of books with a round glass paperweight on top" }, caption: "A short caption for the fourth photo." },
      { image: { src: "/images/examples/candle-and-plate.jpg", alt: "Abstract still life: a candle in front of a plate, with a long soft shadow" }, caption: "A short caption for the fifth photo." },
      { image: { src: "/images/examples/window-light.jpg", alt: "Abstract still life: a round stool and a plant pot beneath a bright window" } },
    ],
  },
});
