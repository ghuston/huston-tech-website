import type { Testimonial } from "@/content/testimonials";
import { Text } from "./Text";

export function PullQuote({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="max-w-[var(--container-prose)] border-l-4 border-signal pl-5 sm:pl-7">
      <blockquote className="font-display text-2xl leading-snug sm:text-[1.75rem]">
        <p>&ldquo;{testimonial.quoteShort}&rdquo;</p>
      </blockquote>
      <figcaption className="mt-3 text-[0.95rem] text-muted">
        <span className="font-semibold text-ink">{testimonial.name}</span>, <Text>{testimonial.role}</Text>, {testimonial.business}
      </figcaption>
    </figure>
  );
}
