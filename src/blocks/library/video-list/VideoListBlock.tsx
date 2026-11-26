import { Container } from "@/components/hl/Container";
import { Text } from "@/components/ui/Text";
import { parseVideoUrl } from "@/blocks/embeds";
import { itemText } from "@/blocks/list-format";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import { VideoFacade } from "../video/VideoFacade";
import type { videoListDefinition } from "./definition";

const DEFAULT_COUNT = 12;

/** The newest videos of the Videos collection, each behind its own play button. The renderer has already sorted and filtered them. */
export function VideoListBlock({ content, variant, anchor, headingId, items }: BlockProps<ContentOf<typeof videoListDefinition.fields>>) {
  const shown = items.slice(0, content.count ?? DEFAULT_COUNT);
  // Three columns only when there are three or more videos, so two never sit beside an empty column.
  const three = variant === "three-column" && shown.length >= 3;
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24">
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          <Text>{content.heading}</Text>
        </h2>
        {content.intro ? (
          <p className="mt-4 max-w-intro text-blurb">
            <Text>{content.intro}</Text>
          </p>
        ) : null}
        <ul role="list" className={`mt-12 grid gap-x-12 gap-y-14 md:grid-cols-2 ${three ? "lg:grid-cols-3" : ""}`}>
          {shown.map((item) => {
            const video = parseVideoUrl(item.data.url);
            const title = itemText(item.data, "title");
            if (!video || title === undefined) return null;
            return (
              <li key={item.slug}>
                <VideoFacade video={video} title={title} caption={itemText(item.data, "caption")} />
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
