"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { Glow } from "@/components/hl/Glow";
import { Text } from "@/components/ui/Text";
import { videoCopy } from "@/content/video";
import { embedUrl, watchUrl, type VideoRef } from "@/blocks/embeds";

type VideoFacadeProps = {
  video: VideoRef;
  title: string;
  caption?: string;
  poster?: { src: string; alt: string };
  /** A larger play mark, for a frame as wide as the page column. */
  large?: boolean;
};

const subscribe = () => () => {};
const fill = (template: string, title: string, provider: string) => template.replace("{title}", title).replace("{provider}", provider);

// One frame for both states, so the player replaces the facade without moving anything.
const FRAME = "relative block aspect-video overflow-hidden rounded-card bg-ink";

/**
 * A video that loads nothing from its site until it is pressed. Before JavaScript it is a link that opens the video in
 * a new tab; after, a press swaps the player into the same 16:9 frame and moves focus to it.
 */
export function VideoFacade({ video, title, caption, poster, large = false }: VideoFacadeProps) {
  const [playing, setPlaying] = useState(false);
  const player = useRef<HTMLIFrameElement>(null);
  // False in the static HTML (the link opens a new tab), true once a press plays the video in place.
  const interactive = useSyncExternalStore(subscribe, () => true, () => false);
  const provider = videoCopy.providerNames[video.provider];

  useEffect(() => {
    if (playing) player.current?.focus();
  }, [playing]);

  const press = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    setPlaying(true);
  };

  return (
    <figure>
      {playing ? (
        <div className={FRAME}>
          <iframe
            ref={player}
            src={embedUrl(video)}
            title={title}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="size-full"
          />
        </div>
      ) : (
        <a
          href={watchUrl(video)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={press}
          aria-label={fill(interactive ? videoCopy.playLabel : videoCopy.playLabelNewTab, title, provider)}
          className={`group ${FRAME}`}
        >
          {poster ? (
            <Image src={poster.src} alt={poster.alt} fill sizes="(min-width: 1320px) 1240px, 100vw" className="object-cover" />
          ) : (
            <span aria-hidden="true" className="absolute inset-0 bg-linear-to-br from-ink to-ink-2">
              <Glow variant="green" className="hl-glow-hero opacity-30" />
            </span>
          )}
          <span className="absolute inset-0 grid place-items-center">
            <span
              aria-hidden="true"
              className={`grid ${large ? "size-16 md:size-24" : "size-16"} place-items-center rounded-pill bg-silver text-ink shadow-chip transition-transform motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110`}
            >
              <svg viewBox="0 0 24 24" className={`${large ? "size-6 md:size-9" : "size-6"} translate-x-0.5`} fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </a>
      )}
      <figcaption className="mt-4">
        <p className="font-ui text-item font-semibold">
          <Text>{title}</Text>
        </p>
        {caption ? (
          <p className="mt-1 text-list">
            <Text>{caption}</Text>
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}
