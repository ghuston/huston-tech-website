import { Container } from "@/components/hl/Container";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { Text } from "@/components/ui/Text";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { serviceListDefinition } from "./definition";

export function ServiceListBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof serviceListDefinition.fields>>) {
  return (
    // scroll-mt: the renderer's padding is now above the section, so the old 48px margin plus that padding keeps the jump where it was.
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24 md:scroll-mt-28">
      <Container>
        {content.divider ? <FadingDivider className="mb-12 md:mb-16" /> : null}
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          {content.heading}
        </h2>
        <div className="mt-8">
          {content.items.map((item, index) => (
            <div key={item.title}>
              {index > 0 ? <FadingDivider className="my-12" /> : null}
              <div className="max-w-measure">
                <h3 className="font-ui text-head font-bold leading-tight tracking-head">{item.title}</h3>
                <p className="mt-3 text-control leading-list">
                  <Text>{item.paragraph}</Text>
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-measure text-control leading-list">{content.closing}</p>
      </Container>
    </section>
  );
}
