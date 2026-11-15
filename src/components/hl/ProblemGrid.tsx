import { Button } from "./Button";
import { CellDividers } from "./CellDividers";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { TwoVoice } from "./TwoVoice";

type ProblemGridProps = {
  content: {
    eyebrow: string;
    line1: string;
    line2: string;
    items: readonly { title: string; line: string }[];
    after: string;
    cta: string;
  };
  /** Where the "Book a free call →" button goes. */
  ctaHref: string;
};

/**
 * "Sound familiar?" (docs/STYLE-GUIDE.md §7.11): six moments the visitor has lived through, as a grid of ideas with
 * fading dividers, not cards. Three columns on desktop, two on tablets, one on phones.
 */
export function ProblemGrid({ content, ctaHref }: ProblemGridProps) {
  return (
    <section aria-labelledby="problems-title" className="relative pb-16 pt-5 md:pb-24">
      <Container>
        <Eyebrow className="mb-[14px]">{content.eyebrow}</Eyebrow>
        <TwoVoice id="problems-title" line1={content.line1} line2={content.line2} />
        <ul className="mt-12 grid gap-x-12 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {content.items.map((item, index) => (
            <li key={item.title} className="relative">
              <p className="font-ui text-item font-semibold">{item.title}</p>
              <p className="mt-2 text-[17px] leading-[1.55]">{item.line}</p>
              <CellDividers index={index} total={content.items.length} md={2} lg={3} />
            </li>
          ))}
        </ul>
        <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-4">
          <p className="text-blurb">{content.after}</p>
          <Button href={ctaHref}>{content.cta}</Button>
        </div>
      </Container>
    </section>
  );
}
