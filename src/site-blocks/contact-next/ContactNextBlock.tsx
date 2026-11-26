import { Container } from "@/components/hl/Container";
import { TextLink } from "@/components/hl/TextLink";
import { siteConfig } from "@/content/site";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { contactNextDefinition } from "./definition";

export function ContactNextBlock({ content, headingId }: BlockProps<ContentOf<typeof contactNextDefinition.fields>>) {
  return (
    <section aria-labelledby={headingId}>
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          {content.heading}
        </h2>
        <ol className="mt-8 max-w-measure space-y-5 text-control leading-list">
          {content.steps.map((step, index) => (
            <li key={step.lead} className="flex gap-4">
              <span aria-hidden="true" className="w-6 shrink-0 font-ui text-item font-semibold text-green">
                {index + 1}
              </span>
              <span>
                <strong>{step.lead}</strong> {step.body}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-8 flex flex-wrap items-center gap-x-2 text-control">
          {content.emailLabel}{" "}
          {siteConfig.email ? (
            <TextLink inline href={`mailto:${siteConfig.email}`}>
              {siteConfig.email}
            </TextLink>
          ) : null}
        </p>
      </Container>
    </section>
  );
}
