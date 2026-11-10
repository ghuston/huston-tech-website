import type { Testimonial } from "@/content/testimonials";
import { StatusChip } from "./StatusChip";
import { Text } from "./Text";

type Props = {
  testimonial: Testimonial;
  /** Use the fuller quote instead of the short cut. */
  long?: boolean;
  className?: string;
};

/** Quotes render exactly as stored. Never edit punctuation or capitalization here. */
export function TestimonialCard({ testimonial, long = false, className = "" }: Props) {
  const quote = long && testimonial.quoteLong ? testimonial.quoteLong : testimonial.quoteShort;
  return (
    <figure className={`flex h-full flex-col rounded-[14px] border border-line bg-surface p-6 sm:p-8 ${className}`}>
      <span aria-hidden="true" className="font-display text-6xl leading-none text-signal">
        &ldquo;
      </span>
      <blockquote className="-mt-3 flex-1 font-display text-[1.3rem] leading-snug text-ink">
        <p>{quote}</p>
      </blockquote>
      <figcaption className="mt-6 border-t border-line pt-4 text-[0.95rem]">
        <span className="font-semibold">{testimonial.name}</span>
        <span className="text-muted">
          , <Text>{testimonial.role}</Text>, {testimonial.business}
        </span>
        {testimonial.industry ? (
          <div className="mt-3">
            <StatusChip tone="sage">{testimonial.industry}</StatusChip>
          </div>
        ) : null}
      </figcaption>
    </figure>
  );
}
