/**
 * The words around a video player (src/blocks/library/video). Plain data, so a client change may edit it (tier 1).
 * `{title}` and `{provider}` are filled in by the player.
 */
export const videoCopy = {
  /** The play control's name once the page is interactive: a press plays the video in place. */
  playLabel: "Play video: {title}",
  /** The name before JavaScript runs (or without it): the link opens the video on its own site in a new tab. */
  playLabelNewTab: "Play video: {title} (opens {provider})",
  providerNames: { youtube: "YouTube", vimeo: "Vimeo" },
} as const;
