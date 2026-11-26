import { Container } from "@/components/hl/Container";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { Faq } from "@/components/hl/Faq";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { faqListDefinition } from "./definition";

export function FaqListBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof faqListDefinition.fields>>) {
  return (
    // scroll-mt: the renderer's padding is now above the section, so the old 48px margin plus that padding keeps the jump where it was.
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24 md:scroll-mt-28">
      <Container>
        {content.divider ? <FadingDivider className="mb-12 md:mb-16" /> : null}
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          {content.heading}
        </h2>
        <div className="mt-8 max-w-wide">
          <Faq items={content.items} />
        </div>
      </Container>
    </section>
  );
}
