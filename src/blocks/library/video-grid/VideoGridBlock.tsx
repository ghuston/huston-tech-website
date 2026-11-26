import { Container } from "@/components/hl/Container";
import { Text } from "@/components/ui/Text";
import { parseVideoUrl } from "@/blocks/embeds";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import { VideoFacade } from "../video/VideoFacade";
import type { videoGridDefinition } from "./definition";

/** Two to six videos, each behind its own play button. */
export function VideoGridBlock({ content, variant, anchor, headingId }: BlockProps<ContentOf<typeof videoGridDefinition.fields>>) {
  // Three columns only when there are three or more videos, so two never sit beside an empty column.
  const three = variant === "three-column" && content.videos.length >= 3;
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24">
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          <Text>{content.heading}</Text>
        </h2>
        <ul className={`mt-12 grid gap-x-12 gap-y-14 md:grid-cols-2 ${three ? "lg:grid-cols-3" : ""}`}>
          {content.videos.map((item, index) => {
            const video = parseVideoUrl(item.url);
            if (!video) throw new Error(`The video address "${item.url}" is not on the allowlist.`);
            return (
              <li key={index}>
                <VideoFacade video={video} title={item.title} caption={item.caption} poster={item.poster} />
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
