import { Container } from "@/components/hl/Container";
import { Text } from "@/components/ui/Text";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { legalSectionsDefinition } from "./definition";

export function LegalSectionsBlock({ content, anchor }: BlockProps<ContentOf<typeof legalSectionsDefinition.fields>>) {
  return (
    <section id={anchor} className="scroll-mt-24">
      <Container>
        <div className="max-w-measure space-y-8 text-body">
          {content.sections.map((section, index) => (
            <div key={index}>
              <h2 className="font-ui text-subhead font-bold">
                <Text>{section.heading}</Text>
              </h2>
              <p className="mt-3">
                <Text>{section.body}</Text>
              </p>
            </div>
          ))}
          {content.footnote ? (
            <p>
              <Text>{content.footnote}</Text>
            </p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
