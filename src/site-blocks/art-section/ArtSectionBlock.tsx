import { Container } from "@/components/hl/Container";
import { ArtAside, SiteFramesArt, TwentyMinutesArt } from "@/components/illustrations/BrandArt";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { artSectionDefinition } from "./definition";

export function ArtSectionBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof artSectionDefinition.fields>>) {
  const art = content.art === "twenty-minutes" ? <TwentyMinutesArt draw className="md:max-w-portrait" /> : <SiteFramesArt draw />;
  return (
    // scroll-mt: the renderer's padding is now above the section, so the old 48px margin plus that padding keeps the jump where it was.
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24 md:scroll-mt-28">
      <Container>
        <ArtAside align="center" phone="below" art={art}>
          <h2 id={headingId} className="font-ui text-h2 font-bold">
            {content.heading}
          </h2>
          <p className="mt-5 max-w-intro text-body">{content.body}</p>
        </ArtAside>
      </Container>
    </section>
  );
}
