import { CheckTrack } from "@/components/hl/CheckTrack";
import { Container } from "@/components/hl/Container";
import { Eyebrow } from "@/components/hl/Eyebrow";
import { TwoVoice } from "@/components/hl/TwoVoice";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { homeWhyDefinition } from "./definition";

export function HomeWhyBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof homeWhyDefinition.fields>>) {
  return (
    <section id={anchor} aria-labelledby={headingId}>
      <Container>
        <div className="lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-x-16">
          <div>
            <Eyebrow className="mb-3.5">{content.eyebrow}</Eyebrow>
            <TwoVoice id={headingId} line1={content.line1} line2={content.line2} />
          </div>
          <p className="mt-5.5 max-w-intro text-body lg:mt-0">{content.body}</p>
        </div>
        <div className="mt-8 md:mt-14">
          <CheckTrack stops={content.stops} />
        </div>
        <p className="mt-6 max-w-pitch rounded-card bg-tint px-5 py-4.5 text-chip leading-copy md:mt-10 md:text-control">{content.callout}</p>
        <ul className="mt-8 grid md:mt-12 md:grid-cols-3 md:gap-x-12">
          {content.points.map((point) => (
            <li key={point.title} className="border-t border-hairline py-4 md:py-5">
              <b className="font-ui text-item font-semibold">{point.title}</b>
              <p className="mt-1 text-chip leading-copy md:mt-1.5 md:text-control">{point.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
