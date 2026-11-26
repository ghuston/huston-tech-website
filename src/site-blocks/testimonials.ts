// The client quotes this site's blocks show, read from the testimonials collection (src/content/collections/testimonials).
// Server only. Only live items render; the written approval is recorded in each item's `source`.
import { itemText } from "../blocks/list-format.ts";
import type { LoadedItem } from "../collections/schema.ts";
import { getItems } from "../lib/collections.ts";
import { TESTIMONIAL_PLACEMENTS } from "./collection-fields.ts";

export type TestimonialPlacement = (typeof TESTIMONIAL_PLACEMENTS)[number];

export type Testimonial = {
  /** The item's slug (its file name). */
  id: string;
  /** Short cut used on cards. Rendered exactly as written, including "…" cuts. */
  quoteShort: string;
  /** Fuller quote, used inside case studies. */
  quoteLong?: string;
  name: string;
  role: string;
  business: string;
  industry?: string;
  caseStudy?: string;
  placements: string[];
};

function toTestimonial(item: LoadedItem): Testimonial | null {
  const quoteShort = itemText(item.data, "quote");
  const name = itemText(item.data, "name");
  if (quoteShort === undefined || name === undefined) return null;
  const placements = item.data["placements"];
  return {
    id: item.slug,
    quoteShort,
    quoteLong: itemText(item.data, "quoteLong"),
    name,
    role: itemText(item.data, "role") ?? "",
    business: itemText(item.data, "organization") ?? "",
    industry: itemText(item.data, "industry"),
    caseStudy: itemText(item.data, "caseStudy"),
    placements: Array.isArray(placements) ? placements.filter((p): p is string => typeof p === "string") : [],
  };
}

function all(): Testimonial[] {
  return getItems("testimonials").flatMap((item) => {
    const t = toTestimonial(item);
    return t === null ? [] : [t];
  });
}

/** The live testimonials placed on a page, in the collection's order. */
export function getTestimonials(placement: TestimonialPlacement): Testimonial[] {
  return all().filter((t) => t.placements.includes(placement));
}

/** One live testimonial by slug (case-insensitive, so an older id like "T1-hideout" still finds its file). */
export function getTestimonialById(id: string): Testimonial {
  const slug = id.toLowerCase();
  const found = all().find((t) => t.id === slug);
  if (!found) throw new Error(`Live testimonial not found: ${id}`);
  return found;
}
