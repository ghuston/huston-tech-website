import { Container } from "@/components/hl/Container";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { stepListSectionDefinition } from "./definition";

export function StepListSectionBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof stepListSectionDefinition.fields>>) {
  return (
    <section id={anchor} aria-labelledby={headingId}>
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          {content.heading}
        </h2>
        <ol className="mt-6 max-w-intro list-decimal space-y-3 pl-6 text-body marker:font-ui marker:font-bold">
          {content.steps.map((step) => (
            <li key={step.lead} className="pl-2">
              <strong className="font-bold">{step.lead}</strong> {step.rest}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
