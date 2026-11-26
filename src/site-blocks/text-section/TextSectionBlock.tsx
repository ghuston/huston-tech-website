import { Button } from "@/components/hl/Button";
import { Container } from "@/components/hl/Container";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { TextLink } from "@/components/hl/TextLink";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { Text } from "@/components/ui/Text";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { textSectionDefinition } from "./definition";

const paragraphClass = { intro: "mt-5 max-w-intro text-body", measure: "mt-5 max-w-measure text-body" } as const;

export function TextSectionBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof textSectionDefinition.fields>>) {
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-12 md:scroll-mt-16">
      <Container>
        {content.divider ? <FadingDivider className="mb-12 md:mb-16" /> : null}
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          {content.heading}
        </h2>
        <p className={paragraphClass[content.width]}>
          {content.inlineLink ? (
            <>
              {content.body}
              <TextLink inline href={content.inlineLink.href}>
                {content.inlineLink.label}
              </TextLink>
              {content.afterLink}
            </>
          ) : (
            <Text>{content.body}</Text>
          )}
        </p>
        {content.more ? (
          <div className="mt-4">
            <TextLink href={content.more.href}>{content.more.label}</TextLink>
          </div>
        ) : null}
        {content.cta ? (
          <div className="mt-8">
            <Button href={bookCallHref()}>{content.cta}</Button>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
