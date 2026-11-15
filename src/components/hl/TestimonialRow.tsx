import type { Testimonial } from "@/content/testimonials";
import { Text } from "@/components/ui/Text";
import { FadingDivider } from "./FadingDivider";
import { Tag } from "./Tag";

/**
 * Testimonials (docs/STYLE-GUIDE.md §7.14): three columns with fading dividers, no photos, cards, carousel or stars.
 * The quote renders exactly as stored in testimonials.ts, including its "…" cuts and original punctuation; the hanging
 * rust mark is decoration. Each carries the label that says what kind of project it was.
 */
export function TestimonialRow({ testimonials, tag }: { testimonials: Testimonial[]; tag: string }) {
  return (
    <ul className="grid gap-12 md:grid-cols-3">
      {testimonials.map((testimonial, index) => (
        <li key={testimonial.id} className="relative">
          {index > 0 ? <FadingDivider direction="vertical" className="absolute -left-6 bottom-0 top-0 hidden md:block" /> : null}
          <figure>
            <Tag>{tag}</Tag>
            <blockquote className="relative mt-5 font-voice text-quote italic">
              <span aria-hidden="true" className="absolute -left-[0.5em] -top-[0.05em] text-[1.6em] leading-none text-rust">
                “
              </span>
              <p>{testimonial.quoteShort}</p>
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
