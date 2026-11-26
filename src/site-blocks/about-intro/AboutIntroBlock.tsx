import { RingHeadshot } from "@/components/hl/AboutTeaser";
import { Container } from "@/components/hl/Container";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { aboutIntroDefinition } from "./definition";

export function AboutIntroBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof aboutIntroDefinition.fields>>) {
  return (
    <section id={anchor} aria-labelledby={headingId}>
      <Container className="grid items-center gap-10 md:grid-cols-[320px_1fr] md:gap-16">
        <RingHeadshot eager className="max-w-photo md:max-w-none" />
        <div>
          <h2 id={headingId} className="font-ui text-h2 font-bold">
            {content.heading}
          </h2>
          <p className="mt-5 max-w-intro text-body">{content.body}</p>
        </div>
      </Container>
    </section>
  );
}
