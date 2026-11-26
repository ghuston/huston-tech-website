import { Container } from "@/components/hl/Container";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { Text } from "@/components/ui/Text";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { agencySnapshotsDefinition } from "./definition";

export function AgencySnapshotsBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof agencySnapshotsDefinition.fields>>) {
  return (
    // scroll-mt: the renderer's padding is now above the section, so the old 48px margin plus that padding keeps the jump where it was.
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24 md:scroll-mt-28">
      <Container>
        <FadingDivider className="mb-12 md:mb-16" />
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          {content.heading}
        </h2>
        <p className="mt-5 max-w-measure text-body">
          <Text>{content.intro}</Text>
        </p>
        <ul className="hl-leads mt-8 max-w-wide">
          {content.snapshots.map((snapshot, index) => (
            <li key={snapshot}>
              {index > 0 ? <FadingDivider className="my-6" /> : null}
              <p className="text-control leading-list">
                <Text>{snapshot}</Text>
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-measure text-small text-ink-2">{content.footnote}</p>
      </Container>
    </section>
  );
}
