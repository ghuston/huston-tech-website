import Image from "next/image";
import { Text } from "@/components/ui/Text";
import { casePhasesHeading, type CaseStudyContent, type ScreenshotSlot } from "@/content/past-work";
import { getTestimonialById } from "@/content/testimonials";
import { Card } from "./Card";
import { CaseStudyPhases } from "./CaseStudyPhases";
import { DotList } from "./DotList";
import { Tag } from "./Tag";
import { TestimonialRow } from "./TestimonialRow";

/** A screenshot on a plain white frame (§7.30): radius 14, card shadow, no tilt. Holds the placeholder until Grant supplies a blurred image. */
function ScreenshotFrame({ shot }: { shot: ScreenshotSlot }) {
  if (typeof shot === "string") {
    return (
      <Card as="figure" className="grid aspect-[16/10] max-w-[900px] place-items-center p-8 text-center">
        <p className="max-w-[44ch] text-small text-ink-2">
          <Text>{shot}</Text>
        </p>
      </Card>
    );
  }
  return (
    <Card as="figure" className="max-w-[900px] overflow-hidden p-0">
      <Image
        src={shot.src}
        alt={shot.alt}
        width={shot.width}
        height={shot.height}
        unoptimized
        loading="lazy"
        sizes="(min-width: 900px) 900px, 100vw"
        className="block h-auto w-full"
      />
    </Card>
  );
}

/**
 * A systems case study (docs/STYLE-GUIDE.md §7.30): H3 title, meta tags, screenshots, the Scoped / Shaped / Shipped
 * strip, single-voice H4 sections, the quote and the results as a dotted list. The `id` is the anchor Home links to.
 */
export function SystemsCaseStudy({ study }: { study: CaseStudyContent }) {
  const titleId = `${study.id}-title`;
  const testimonial = getTestimonialById(study.testimonialId);
  const [firstShot, secondShot] = study.screenshots;
  const h4 = "font-ui text-[22px] font-semibold leading-tight tracking-[-0.01em]";

  return (
    <article id={study.id} aria-labelledby={titleId} className="scroll-mt-12">
      <h3 id={titleId} className="max-w-[24em] font-ui text-[28px] font-bold leading-[1.1] tracking-[-0.03em] md:text-[32px]">
        {study.heading}
      </h3>
      <p className="mt-4 font-ui text-[18px] font-semibold">{study.client}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {study.meta.map((item) => (
          <li key={item}>
            <Tag>{item}</Tag>
          </li>
        ))}
      </ul>

      {firstShot ? (
        <div className="mt-8">
          <ScreenshotFrame shot={firstShot} />
        </div>
      ) : null}

      <div className="mt-12">
        <CaseStudyPhases label={casePhasesHeading} phases={study.phases} />
      </div>

      <div className="mt-12 max-w-[64ch]">
        <h4 className={h4}>The challenge</h4>
        <p className="mt-3 text-body">
          <Text>{study.challenge}</Text>
        </p>
      </div>

      <div className="mt-10 max-w-[64ch]">
        <h4 className={h4}>{study.builtHeading}</h4>
        <DotList items={study.built} className="mt-4" />
      </div>

      <div className="mt-10">
        <h4 className={h4}>{study.quoteHeading}</h4>
        <div className="mt-5">
          <TestimonialRow testimonials={[testimonial]} quote="long" />
        </div>
      </div>

      {secondShot ? (
        <div className="mt-10">
          <ScreenshotFrame shot={secondShot} />
        </div>
      ) : null}

      <div className="mt-10 max-w-[64ch]">
        <h4 className={h4}>{study.resultsLabel}</h4>
        <DotList items={study.results} className="mt-4" />
      </div>
    </article>
  );
}
