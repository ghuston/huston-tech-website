// This site's extra fields for the template's collections. Site-owned: a template update never changes this file.
// src/collections/definitions.ts merges them into the template's fields. Import-free apart from a type import.
import type { Fields } from "../blocks/schema.ts";

/** Where a testimonial may show. The same four pages the old testimonials.ts named. */
export const TESTIMONIAL_PLACEMENTS = ["home", "past-work", "services", "about"] as const;

/**
 * Extra optional fields (all optional, so the template's own example items stay valid) per collection kind. A kind may not reuse a template field name. Testimonials: the fuller quote
 * used inside case studies, the client's industry (a fact about the client, never a target market), where the written
 * approval came from, the pages it may appear on, and the case study it belongs to.
 */
export const siteCollectionFields = {
  testimonials: {
    quoteLong: { kind: "text", label: "Fuller quote", max: 1000, required: false, help: "Used inside a case study. Only words the client really said, cuts marked with …." },
    industry: { kind: "text", label: "Client's industry", max: 60, required: false },
    source: { kind: "text", label: "Where the approval came from", max: 120, required: false, help: "The written source and its date, for example a client survey or wrap-up feedback." },
    placements: {
      kind: "list",
      label: "Pages it may appear on",
      min: 1,
      max: 4,
      required: false,
      of: { kind: "choice", label: "Page", options: TESTIMONIAL_PLACEMENTS },
    },
    caseStudy: { kind: "choice", label: "Case study it belongs to", options: ["hideout-fitness", "irvine-family-counseling"], required: false },
  },
} as const satisfies Partial<Record<string, Fields>>;
