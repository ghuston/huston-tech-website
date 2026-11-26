import { CaseStudyTeaser } from "@/components/hl/CaseStudyTeaser";
import { Container } from "@/components/hl/Container";
import { ProofChips } from "@/components/hl/ProofChips";
import { Tag } from "@/components/hl/Tag";
import { TestimonialRow } from "@/components/hl/TestimonialRow";
import { getTestimonials } from "@/content/testimonials";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { homeProofDefinition } from "./definition";

/** The quotes come from testimonials.ts (placement "home"); everything else is this block's content. */
export function HomeProofBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof homeProofDefinition.fields>>) {
  const testimonials = getTestimonials("home");
  return (
    <section id={anchor} aria-labelledby={headingId}>
      <Container>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3.5">
          <h2 id={headingId} className="font-ui text-h2 font-bold">
            {content.heading}
          </h2>
          <Tag>{content.tag}</Tag>
        </div>
        <div className="mt-6 md:mt-10">
          <TestimonialRow testimonials={testimonials} swipe={content.quotesLabel} />
        </div>
        <div className="mt-7 md:mt-10">
          <ProofChips content={{ stats: content.stats, footnote: content.footnote }} />
        </div>
        <div className="mt-7 grid gap-6 md:mt-12 md:grid-cols-2 md:gap-7">
          {content.teasers.map((teaser) => (
            <CaseStudyTeaser key={teaser.name} name={teaser.name} body={teaser.body} href={teaser.href} linkLabel={content.teaserLinkLabel} image={teaser.image} />
          ))}
        </div>
      </Container>
    </section>
  );
}
