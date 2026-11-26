import Image from "next/image";
import { Text } from "@/components/ui/Text";
import { getTestimonialById } from "@/site-blocks/testimonials";
import { fw } from "@/lib/framework";
import type { FrameworkStepKey } from "@/content/site";
import { Card } from "./Card";
import { CaseStudyPhases } from "./CaseStudyPhases";
import { DotList } from "./DotList";
import { Tag } from "./Tag";
import { TestimonialRow } from "./TestimonialRow";

/** The heading over the Scoped / Shaped / Shipped strip. Neither project claims a formal paid Review took place. */
const casePhasesHeading = fw("{steps} at a glance");

/** A blurred screenshot, or a placeholder string until Grant supplies one. Alt text describes the view, never numbers or names. */
export type ScreenshotImage = { src: string; alt: string; width: number; height: number };
export type ScreenshotSlot = string | ScreenshotImage;

export type CaseStudyContent = {
  id: "hideout-fitness" | "irvine-family-counseling";
  heading: string;
  client: string;
  meta: string[];
  testimonialId: string;
  quoteHeading: string;
  screenshots: ScreenshotSlot[];
  phases: Record<FrameworkStepKey, string>;
  challenge: string;
  builtHeading: string;
  built: string[];
  resultsLabel: string;
  results: string[];
};

/** A screenshot on a plain white frame (§7.30): radius 14, card shadow, no tilt. Holds the placeholder until Grant supplies a blurred image. */
function ScreenshotFrame({ shot }: { shot: ScreenshotSlot }) {
  if (typeof shot === "string") {
    return (
      <Card as="figure" className="grid aspect-shot max-w-figure place-items-center p-8 text-center">
        <p className="max-w-hint text-small text-ink-2">
          <Text>{shot}</Text>
        </p>
      </Card>
    );
  }
  return (
    <Card as="figure" className="max-w-figure overflow-hidden p-0">
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
  const h4 = "font-ui text-title-sm font-semibold leading-tight tracking-item";

  return (
    <article id={study.id} aria-labelledby={titleId} className="scroll-mt-12">
      <h3 id={titleId} className="max-w-statement font-ui text-head font-bold leading-head tracking-head md:text-head-lg">
        {study.heading}
      </h3>
      <p className="mt-4 font-ui text-copy font-semibold">{study.client}</p>
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

      <div className="mt-12 max-w-measure">
        <h4 className={h4}>The challenge</h4>
        <p className="mt-3 text-body">
          <Text>{study.challenge}</Text>
        </p>
      </div>

      <div className="mt-10 max-w-measure">
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

      <div className="mt-10 max-w-measure">
        <h4 className={h4}>{study.resultsLabel}</h4>
        <DotList items={study.results} className="mt-4" />
      </div>
    </article>
  );
}
