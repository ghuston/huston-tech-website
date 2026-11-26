import { Container } from "@/components/hl/Container";
import { DotList } from "@/components/hl/DotList";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { TestimonialRow } from "@/components/hl/TestimonialRow";
import { getTestimonials } from "@/content/testimonials";
import { fw } from "@/lib/framework";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { serviceGroupsDefinition } from "./definition";

export function ServiceGroupsBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof serviceGroupsDefinition.fields>>) {
  const [quote] = content.quote ? getTestimonials(content.quote) : [];
  return (
    <section id={anchor} aria-labelledby={headingId}>
      <Container>
        {content.divider ? <FadingDivider className="mb-12 md:mb-16" /> : null}
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          {content.heading}
        </h2>
        <div className="mt-8 grid gap-12 md:grid-cols-3 md:gap-10 lg:gap-16">
          {content.groups.map((group) => (
            <div key={group.label}>
              <h3 className="font-ui text-head font-bold leading-tight tracking-head">{fw(group.label)}</h3>
              <DotList items={group.items} className="mt-5" />
            </div>
          ))}
        </div>
        {quote ? (
          <div className="mt-12">
            <TestimonialRow testimonials={[quote]} />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
