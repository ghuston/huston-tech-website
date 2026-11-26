import { Button } from "@/components/hl/Button";
import { Container } from "@/components/hl/Container";
import { DotList } from "@/components/hl/DotList";
import { ArtAside, SiteFramesArt } from "@/components/illustrations/BrandArt";
import { Text } from "@/components/ui/Text";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { servicesWebsitesDefinition } from "./definition";

export function ServicesWebsitesBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof servicesWebsitesDefinition.fields>>) {
  return (
    // scroll-mt: the renderer's padding is now above the section, so the old 48px margin plus that padding keeps the jump where it was.
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24 md:scroll-mt-28">
      <Container>
        <ArtAside art={<SiteFramesArt draw />}>
          <h2 id={headingId} className="font-ui text-h2 font-bold">
            <Text>{content.heading}</Text>
          </h2>
          <div className="mt-5 max-w-intro space-y-4 text-body">
            {content.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </ArtAside>
        <h3 className="font-ui text-head font-bold leading-tight tracking-head mt-10">
          <Text>{content.includesHeading}</Text>
        </h3>
        <DotList items={content.includes} className="mt-5 max-w-measure" />
        <div className="mt-8 max-w-measure space-y-4 text-control leading-list">
          {content.details.map((detail) => (
            <p key={detail}>
              <Text>{detail}</Text>
            </p>
          ))}
        </div>
        <div className="mt-8">
          <Button href={content.cta.href}>{content.cta.label}</Button>
        </div>
      </Container>
    </section>
  );
}
