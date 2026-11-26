import { Container } from "@/components/hl/Container";
import { Text } from "@/components/ui/Text";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { proseDefinition } from "./definition";

export function ProseBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof proseDefinition.fields>>) {
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24">
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          <Text>{content.heading}</Text>
        </h2>
        <div className="mt-8 max-w-measure space-y-5 text-body">
          {content.paragraphs.map((paragraph, index) => (
            <p key={index}>
              <Text>{paragraph}</Text>
            </p>
          ))}
        </div>
      </Container>
    </section>
  );
}
