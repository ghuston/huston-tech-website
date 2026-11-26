import { Container } from "@/components/hl/Container";
import { parseVideoUrl } from "@/blocks/embeds";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { videoDefinition } from "./definition";
import { VideoFacade } from "./VideoFacade";

/** One video behind a play button. The address was checked at build time; it is parsed again only to rebuild the links. */
export function VideoBlock({ content, variant, anchor }: BlockProps<ContentOf<typeof videoDefinition.fields>>) {
  const video = parseVideoUrl(content.url);
  if (!video) throw new Error(`The video address "${content.url}" is not on the allowlist.`);
  return (
    <div id={anchor} className="scroll-mt-24">
      <Container>
        <div className={variant === "inset" ? "mx-auto max-w-faq" : undefined}>
          <VideoFacade video={video} title={content.title} caption={content.caption} poster={content.poster} large={variant !== "inset"} />
        </div>
      </Container>
    </div>
  );
}
