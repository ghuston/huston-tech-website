import { Button } from "@/components/hl/Button";
import { Container } from "@/components/hl/Container";
import { Photo } from "@/components/hl/Photo";
import { Text } from "@/components/ui/Text";
import { resolveHref } from "@/blocks/links";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { photoTextDefinition } from "./definition";

/** One photo beside a heading and paragraphs. The photo comes first on phones; on wide screens it takes the side the variant names. */
export function PhotoTextBlock({ content, variant, anchor, headingId }: BlockProps<ContentOf<typeof photoTextDefinition.fields>>) {
  const photoEnd = variant === "photo-end";
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24">
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <Photo
            image={content.image}
            shape="4:3"
            sizes="(min-width: 1320px) 600px, (min-width: 1024px) 45vw, 100vw"
            className={photoEnd ? "lg:order-2" : ""}
          />
          <div className="max-w-measure">
            <h2 id={headingId} className="font-ui text-h2 font-bold">
              <Text>{content.heading}</Text>
            </h2>
            <div className="mt-6 space-y-5 text-body">
              {content.paragraphs.map((paragraph, index) => (
                <p key={index}>
                  <Text>{paragraph}</Text>
                </p>
              ))}
            </div>
            {content.action ? (
              <div className="mt-8">
                <Button href={resolveHref(content.action.href)}>{content.action.label}</Button>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
