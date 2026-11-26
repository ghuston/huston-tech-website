import { ArrowLabel } from "@/components/hl/Arrow";
import { Container } from "@/components/hl/Container";
import { Text } from "@/components/ui/Text";
import { audioModel } from "@/blocks/audio-player";
import { fillCopy, formatDate, itemText } from "@/blocks/list-format";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import { playerCopy } from "@/content/players";
import { AudioFacade } from "./AudioFacade";
import type { episodeListDefinition } from "./definition";

const DEFAULT_COUNT = 10;

/**
 * The newest episodes of the Podcast episodes collection. `list` puts each episode's player in its row; `compact` has no
 * player and no frame, only a link to the episode on its own site.
 */
export function EpisodeListBlock({ content, variant, anchor, headingId, items }: BlockProps<ContentOf<typeof episodeListDefinition.fields>>) {
  const compact = variant === "compact";
  const shown = items.slice(0, content.count ?? DEFAULT_COUNT);
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
        <ul role="list" className="mt-10 border-b border-hairline">
          {shown.map((item) => {
            const title = itemText(item.data, "title");
            const audio = audioModel(item.data.url);
            if (title === undefined || !audio) return null;
            const date = itemText(item.data, "date");
            const summary = itemText(item.data, "summary");
            return (
              <li key={item.slug} className={`border-t border-hairline py-8 ${compact ? "" : "lg:grid lg:grid-cols-2 lg:items-center lg:gap-12"}`}>
                <div className={compact ? "flex flex-col gap-x-8 gap-y-2 md:flex-row md:items-baseline md:justify-between" : ""}>
                  <div className="max-w-measure">
                    {date ? (
                      <p className="text-label text-ink-2">
                        <time dateTime={date}>{formatDate(date)}</time>
                      </p>
                    ) : null}
                    <h3 className="mt-1 font-ui text-item font-semibold">
                      <Text>{title}</Text>
                    </h3>
                    {summary ? (
                      <p className="mt-2 text-list">
                        <Text>{summary}</Text>
                      </p>
                    ) : null}
                  </div>
                  {compact ? (
                    <a
                      href={audio.listenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={fillCopy(playerCopy.listenLinkLabel, { title, provider: audio.providerName })}
                      className="inline-flex min-h-11 shrink-0 items-center font-ui font-medium text-green"
                    >
                      <ArrowLabel>{fillCopy(playerCopy.listenLink, { provider: audio.providerName })}</ArrowLabel>
                    </a>
                  ) : null}
                </div>
                {compact ? null : (
                  <div className="mt-6 lg:mt-0">
                    <AudioFacade provider={audio.provider} providerName={audio.providerName} title={title} embedUrl={audio.embedUrl} listenUrl={audio.listenUrl} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
