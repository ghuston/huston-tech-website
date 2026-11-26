import { defineBlock } from "../../blocks/schema.ts";

export const agencySnapshotsDefinition = defineBlock({
  type: "agency-snapshots",
  title: "Agency experience",
  description: "A heading and a sentence, a list of short snapshots of earlier work with a fading line between them, and small print.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 100 },
    intro: { kind: "text", label: "Sentence under the heading", max: 400 },
    snapshots: { kind: "list", label: "Snapshots", min: 1, max: 12, of: { kind: "text", label: "Snapshot", max: 500 } },
    footnote: { kind: "text", label: "Small print", max: 400 },
  },
  variants: [{ name: "default", description: "A fading line, the heading, the snapshots one under the other, and the small print." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "compact", plainWrapper: true },
  motion: { entrance: "none", reason: "Keeps this site's own motion rules (STYLE-GUIDE §9.4); this section has none." },
  example: {
    heading: "Before Huston Logic",
    intro: "A sentence about the earlier work. A few snapshots:",
    snapshots: ["**A client type:** what I did."],
    footnote: "A line of small print.",
  },
});
