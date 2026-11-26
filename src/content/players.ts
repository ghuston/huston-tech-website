/**
 * The words around the podcast player and the list blocks (src/blocks/library/episode-list and its neighbours). Plain
 * data, so a client change may edit it (tier 1). `{title}` and `{provider}` are filled in by the component.
 */
export const playerCopy = {
  /** The play control's name once the page is interactive: a press plays the episode in place. */
  playLabel: "Play {title} on {provider}",
  /** The name before JavaScript runs (or without it): the link opens the episode on its own site in a new tab. */
  playLabelNewTab: "Listen to {title} on {provider} (opens {provider})",
  /** The visible link in the compact list. */
  listenLink: "Listen on {provider}",
  /** The compact link's accessible name, so each link says which episode it plays. It starts with the visible words (WCAG 2.5.3). */
  listenLinkLabel: "Listen on {provider}: {title} (opens {provider})",
  providerNames: { spotify: "Spotify", apple: "Apple Podcasts" },
} as const;
