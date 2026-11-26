import { Container } from "@/components/hl/Container";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { ProofChips } from "@/components/hl/ProofChips";
import { SystemsCaseStudy } from "@/components/hl/SystemsCaseStudy";
import { Tag } from "@/components/hl/Tag";
import { TestimonialRow } from "@/components/hl/TestimonialRow";
import { getTestimonials } from "@/site-blocks/testimonials";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { caseStudiesDefinition } from "./definition";

export function CaseStudiesBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof caseStudiesDefinition.fields>>) {
  const standalone = getTestimonials("past-work").filter((t) => !t.caseStudy);
  const { small } = content;
  return (
    // scroll-mt: the renderer's padding is now above the section, so the old 48px margin plus that padding keeps the jump where it was.
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24 md:scroll-mt-28">
      <Container>
        <FadingDivider className="mb-12 md:mb-16" />
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          {content.heading}
        </h2>
        <div className="mt-10">
          {content.studies.map((study, index) => (
            <div key={study.id}>
              {index > 0 ? <FadingDivider className="my-15" /> : null}
              <SystemsCaseStudy study={study} />
            </div>
          ))}
        </div>

        <div className="mt-15">
          <FadingDivider />
          <article id={small.id} aria-labelledby={`${small.id}-title`} className="mt-12 scroll-mt-12">
            <h3 id={`${small.id}-title`} className="max-w-statement font-ui text-head font-bold leading-head tracking-head md:text-head-lg">
              {small.heading}
            </h3>
            <p className="mt-3">
              <Tag>{small.tag}</Tag>
            </p>
            <p className="mt-4 max-w-measure text-body">{small.description}</p>
            <div className="mt-8">
              <TestimonialRow testimonials={standalone.slice(0, 1)} />
            </div>
          </article>
          <div className="mt-12">
            <ProofChips content={{ stats: content.stats, footnote: content.footnote }} />
          </div>
        </div>
      </Container>
    </section>
  );
}
