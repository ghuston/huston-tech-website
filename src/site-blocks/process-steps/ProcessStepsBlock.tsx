import { Container } from "@/components/hl/Container";
import { DetailedSteps } from "@/components/hl/DetailedSteps";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { processStepsDefinition } from "./definition";

export function ProcessStepsBlock({ content }: BlockProps<ContentOf<typeof processStepsDefinition.fields>>) {
  return (
    <section>
      <Container>
        <DetailedSteps steps={content.steps} labels={content.labels} headingLevel={2} proof={content.proof} />
      </Container>
    </section>
  );
}
