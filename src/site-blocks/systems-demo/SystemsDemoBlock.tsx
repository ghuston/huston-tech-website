import { Container } from "@/components/hl/Container";
import { PhoneScreens } from "@/components/hl/PhoneScreens";
import { TalkPairs } from "@/components/hl/TalkPairs";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { systemsDemoDefinition } from "./definition";

export function SystemsDemoBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof systemsDemoDefinition.fields>>) {
  return (
    <section id={anchor} aria-labelledby={headingId}>
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          {content.heading}
        </h2>
        <p className="mt-5 max-w-intro text-body">{content.body}</p>
        <div className="mt-10 max-w-note">
          <TalkPairs pairs={content.pairs} />
        </div>
        <div className="mt-10">
          <PhoneScreens screens={content.screens} label={content.screensLabel} note={content.screensNote} />
        </div>
      </Container>
    </section>
  );
}
