import { Container } from "@/components/hl/Container";
import { Faq } from "@/components/hl/Faq";
import { Text } from "@/components/ui/Text";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { faqDefinition } from "./definition";

export function FaqBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof faqDefinition.fields>>) {
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24">
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          <Text>{content.heading}</Text>
        </h2>
        <div className="mt-8 max-w-faq">
          <Faq items={content.items} />
        </div>
      </Container>
    </section>
  );
}
