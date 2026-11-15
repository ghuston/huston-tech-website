import type { Testimonial } from "@/content/testimonials";
import { Text } from "@/components/ui/Text";
import { FadingDivider } from "./FadingDivider";
import { Tag } from "./Tag";

/**
 * Testimonials (docs/STYLE-GUIDE.md §7.14): three columns with fading dividers, no photos, cards, carousel or stars.
 * The quote renders exactly as stored in testimonials.ts, including its "…" cuts and original punctuation; the hanging
 * rust mark is decoration. Each carries the label that says what kind of project it was.
 */
export function TestimonialRow({
  testimonials,
  tag,
  quote = "short",
}: {
  testimonials: Testimonial[];
  /** Omit where the surrounding page already says what kind of project it was (case studies). */
  tag?: string;
  /** "long" is the fuller quote used inside case studies. A single testimonial gets a readable line length. */
  quote?: "short" | "long";
}) {
  const single = testimonials.length === 1;
  return (
    <ul className={single ? "max-w-[720px]" : "grid gap-12 md:grid-cols-3"}>
      {testimonials.map((testimonial, index) => (
        <li key={testimonial.id} className="relative">
          {index > 0 ? <FadingDivider direction="vertical" className="absolute -left-6 bottom-0 top-0 hidden md:block" /> : null}
          <figure>
            {tag ? <Tag>{tag}</Tag> : null}
            <blockquote className={`relative font-voice text-quote italic ${tag ? "mt-5" : ""}`}>
              <span aria-hidden="true" className="absolute -left-[0.5em] -top-[0.05em] text-[1.6em] leading-none text-rust">
                “
              </span>
              <p>{quote === "long" ? (testimonial.quoteLong ?? testimonial.quoteShort) : testimonial.quoteShort}</p>
            </blockquote>
            <figcaption className="mt-5">
              <span className="block font-ui text-[17px] font-semibold">{testimonial.name}</span>
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
}
