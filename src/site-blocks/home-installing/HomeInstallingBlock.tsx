import { Container } from "@/components/hl/Container";
import { Eyebrow } from "@/components/hl/Eyebrow";
import { PhoneScreens } from "@/components/hl/PhoneScreens";
import { TalkPairs } from "@/components/hl/TalkPairs";
import { TextLink } from "@/components/hl/TextLink";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { homeInstallingDefinition } from "./definition";

export function HomeInstallingBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof homeInstallingDefinition.fields>>) {
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-12 md:scroll-mt-18">
      {/* The four blocks are placed by .hl-installing (hl.css): stacked, then two columns, then three. */}
      <Container className="hl-installing relative z-1">
        <div>
          <Eyebrow className="mb-3.5">{content.eyebrow}</Eyebrow>
          <h2 id={headingId} className="font-ui text-h2 font-bold">
            {content.heading}
          </h2>
        </div>
        <div className="mt-7 lg:mt-9 xl:mt-0 xl:pt-2">
          <TalkPairs pairs={content.pairs} />
        </div>
        <div className="mt-8 lg:mt-9 xl:mt-0">
          <PhoneScreens screens={content.screens} label={content.screensLabel} note={content.screensNote} fluid />
        </div>
        <div className="mt-6 lg:mt-8 xl:mt-6">
          <p className="max-w-intro text-body">{content.line}</p>
          <div className="mt-1 md:mt-2">
            <TextLink href={content.link.href}>{content.link.label}</TextLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
