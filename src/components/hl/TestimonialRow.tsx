import type { Testimonial } from "@/content/testimonials";
import { Text } from "@/components/ui/Text";
import { FadingDivider } from "./FadingDivider";
import { Tag } from "./Tag";

/**
 * Testimonials (docs/STYLE-GUIDE.md §7.14): three columns with fading dividers, no photos, cards, carousel or stars.
 * The quote renders exactly as stored in testimonials.ts, including its "…" cuts and original punctuation; the hanging
 * rust mark is decoration. Each carries the label that says what kind of project it was, unless the section says it once.
 * With `swipe`, phones get a horizontal swipe row instead of a column: a focusable region named by `swipe`.
 */
export function TestimonialRow({
  testimonials,
  tag,
  quote = "short",
  swipe,
}: {
  testimonials: Testimonial[];
  /** Omit where the surrounding page already says what kind of project it was (case studies). */
  tag?: string;
  /** "long" is the fuller quote used inside case studies. A single testimonial gets a readable line length. */
  quote?: "short" | "long";
  /** The accessible name of the phone swipe row. Omit for the plain column. */
  swipe?: string;
}) {
  const single = testimonials.length === 1;
  const listClass = single
    ? "max-w-story"
    : swipe
      ? "flex w-max gap-7 md:grid md:w-auto md:grid-cols-3 md:gap-12"
      : "grid gap-12 md:grid-cols-3";
  const itemClass = swipe && !single ? "relative w-72.5 flex-none snap-start md:w-auto" : "relative";
  const list = (
    <ul className={listClass}>
      {testimonials.map((testimonial, index) => (
        <li key={testimonial.id} className={itemClass}>
          {index > 0 ? <FadingDivider direction="vertical" className="absolute -left-6 bottom-0 top-0 hidden md:block" /> : null}
          <figure>
            {tag ? <Tag>{tag}</Tag> : null}
            <blockquote className={`relative font-voice text-quote italic ${tag ? "mt-5" : ""}`}>
              <span aria-hidden="true" className="absolute -left-quote-x -top-quote-y text-quote-mark leading-none text-rust">
                “
              </span>
              <p>{quote === "long" ? (testimonial.quoteLong ?? testimonial.quoteShort) : testimonial.quoteShort}</p>
            </blockquote>
            <figcaption className="mt-5">
              <span className="block font-ui text-control font-semibold">{testimonial.name}</span>
              <span className="block text-small text-ink-2">
                <Text>{testimonial.role}</Text>, {testimonial.business}
              </span>
              {testimonial.industry ? <span className="block text-small text-ink-2">{testimonial.industry}</span> : null}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
  if (!swipe || single) return list;
  return (
    <div
      role="region"
      aria-label={swipe}
      tabIndex={0}
      className="-mx-5 snap-x snap-mandatory scroll-px-5 overflow-x-auto px-5 pb-2 md:mx-0 md:overflow-visible md:px-0 md:pb-0"
    >
      {list}
    </div>
  );
}
