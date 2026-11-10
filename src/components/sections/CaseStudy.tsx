import { CaseStudyPhases } from "@/components/sections/CaseStudyPhases";
import { ScreenshotPlaceholder } from "@/components/ui/MediaPlaceholders";
import { StatusChip } from "@/components/ui/StatusChip";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { Text } from "@/components/ui/Text";
import { casePhasesHeading, type CaseStudyContent } from "@/content/past-work";
import { getTestimonialById } from "@/content/testimonials";

export function CaseStudy({ study }: { study: CaseStudyContent }) {
  const titleId = `${study.id}-title`;
  const testimonial = getTestimonialById(study.testimonialId);
  const [firstShot, ...otherShots] = study.screenshots;

  return (
    <article id={study.id} aria-labelledby={titleId} className="scroll-mt-28">
      <header className="grid gap-6 border-b border-line pb-8 lg:grid-cols-[1.6fr_1fr] lg:items-end">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-signal-deep">{study.client}</p>
          <h2 id={titleId} className="mt-3 text-[1.75rem] leading-tight sm:text-4xl">
            {study.heading}
          </h2>
        </div>
        <ul className="flex flex-wrap gap-2 lg:justify-end">
          {study.meta.map((item) => (
            <li key={item}>
              <StatusChip tone="sage">{item}</StatusChip>
            </li>
          ))}
        </ul>
      </header>

      <div className="mt-8">{firstShot ? <ScreenshotPlaceholder label={firstShot} /> : null}</div>

      <CaseStudyPhases heading={casePhasesHeading} phases={study.phases} />

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-10">
          <div>
            <h3 id={`${study.id}-challenge`} className="text-2xl">
              The challenge
            </h3>
            <p className="mt-3 text-ink/85">{study.challenge}</p>
          </div>
          <div>
            <h3 id={`${study.id}-built`} className="text-2xl">
              {study.builtHeading}
            </h3>
            <ul className="mt-3 list-disc space-y-3 pl-5 text-ink/85 marker:text-signal">
              {study.built.map((item) => (
                <li key={item}>
                  <Text>{item}</Text>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 id={`${study.id}-quote`} className="mb-4 text-2xl">
              {study.quoteHeading}
            </h3>
            <TestimonialCard testimonial={testimonial} long />
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-[14px] bg-sage-tint p-6 sm:p-8">
        <h3 id={`${study.id}-results`} className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-sage">
          {study.resultsLabel}
        </h3>
        <ul className="mt-4 flex flex-wrap gap-3">
          {study.results.map((result) => (
            <li key={result} className="rounded-[10px] border border-sage/25 bg-surface px-4 py-3 text-[0.98rem] font-medium">
              {result}
            </li>
          ))}
        </ul>
      </div>

      {otherShots.length > 0 ? (
        <div className={`mt-8 grid gap-6 ${otherShots.length > 1 ? "md:grid-cols-2" : ""}`}>
          {otherShots.map((shot) => (
            <ScreenshotPlaceholder key={shot} label={shot} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
