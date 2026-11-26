import { Button } from "@/components/hl/Button";
import { Container } from "@/components/hl/Container";
import { Text } from "@/components/ui/Text";
import { resolveHref } from "@/blocks/links";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { closingCtaDefinition } from "./definition";

/** Closing call to action: not a band; the renderer's seam glow blends it into the page. Left-aligned. */
export function ClosingCtaBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof closingCtaDefinition.fields>>) {
  return (
    <section id={anchor} aria-labelledby={headingId} className="relative scroll-mt-24">
      <Container className="relative z-10">
        <h2 id={headingId} className="max-w-heading font-ui text-h2 font-bold">
          <Text>{content.heading}</Text>
        </h2>
        {content.body ? (
          <p className="mt-4 max-w-intro text-blurb">
            <Text>{content.body}</Text>
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Button href={resolveHref(content.action.href)}>{content.action.label}</Button>
        </div>
        {content.note ? (
          <p className="mt-6 text-label text-ink-2">
            <Text>{content.note}</Text>
          </p>
        ) : null}
      </Container>
    </section>
  );
}
