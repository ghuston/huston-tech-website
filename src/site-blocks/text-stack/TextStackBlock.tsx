import { Container } from "@/components/hl/Container";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { TextLink } from "@/components/hl/TextLink";
import { Text } from "@/components/ui/Text";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { textStackDefinition } from "./definition";

const stackClass = { intro: "mt-5 max-w-intro space-y-4 text-body", measure: "mt-5 max-w-measure space-y-4 text-body" } as const;

export function TextStackBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof textStackDefinition.fields>>) {
  return (
    <section id={anchor} aria-labelledby={headingId}>
      <Container>
        {content.divider ? <FadingDivider className="mb-12 md:mb-16" /> : null}
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          {content.heading}
        </h2>
        <div className={stackClass[content.width]}>
          {content.paragraphs.map((paragraph) => (
            <p key={paragraph.text}>
              <Text>{paragraph.text}</Text>
              {paragraph.link ? (
                <TextLink inline href={paragraph.link.href}>
                  {paragraph.link.label}
                </TextLink>
              ) : null}
            </p>
          ))}
        </div>
      </Container>
    </section>
  );
}
