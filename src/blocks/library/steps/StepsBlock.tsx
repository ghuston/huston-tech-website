import { Container } from "@/components/hl/Container";
import { TextLink } from "@/components/hl/TextLink";
import { Text } from "@/components/ui/Text";
import { siteConfig } from "@/content/site";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { stepsDefinition } from "./definition";

export function StepsBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof stepsDefinition.fields>>) {
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24">
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          <Text>{content.heading}</Text>
        </h2>
        <ol className="mt-8 max-w-measure space-y-5 text-list">
          {content.steps.map((step, index) => (
            <li key={index} className="flex gap-4">
              <span aria-hidden="true" className="w-6 shrink-0 font-ui text-item font-semibold text-green">
                {index + 1}
              </span>
              <span>
                <strong>
                  <Text>{step.lead}</Text>
                </strong>{" "}
                <Text>{step.body}</Text>
              </span>
            </li>
          ))}
        </ol>
        {content.emailLabel ? (
          <p className="mt-8 flex flex-wrap items-center gap-x-2 text-control">
            <Text>{content.emailLabel}</Text>{" "}
            {siteConfig.email ? (
              <TextLink inline href={`mailto:${siteConfig.email}`}>
                {siteConfig.email}
              </TextLink>
            ) : null}
          </p>
        ) : null}
      </Container>
    </section>
  );
}
