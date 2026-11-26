import { Container } from "@/components/hl/Container";
import { DotList } from "@/components/hl/DotList";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { TestimonialRow } from "@/components/hl/TestimonialRow";
import { Text } from "@/components/ui/Text";
import { getTestimonials } from "@/content/testimonials";
import { fw } from "@/lib/framework";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { dotSectionDefinition } from "./definition";

export function DotSectionBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof dotSectionDefinition.fields>>) {
  const [quote] = content.quote ? getTestimonials(content.quote) : [];
  return (
    <section id={anchor} aria-labelledby={headingId}>
      <Container>
        {content.divider ? <FadingDivider className="mb-12 md:mb-16" /> : null}
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          {content.heading}
        </h2>
        {content.intro ? (
          <p className="mt-5 max-w-measure text-body">
            <Text>{fw(content.intro)}</Text>
          </p>
        ) : null}
        <DotList items={content.items} className="mt-5 max-w-measure" />
        {quote ? (
          <div className="mt-12">
            <TestimonialRow testimonials={[quote]} />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
