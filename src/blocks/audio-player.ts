// What the podcast facade needs, worked out on the server from an episode address. Relative .ts imports only, so it is testable.
import { AUDIO_PLAYER_HEIGHT, audioEmbedUrl, audioListenUrl, parseAudioUrl } from "./embeds.ts";
import { playerCopy } from "../content/players.ts";

export type AudioModel = {
  provider: "spotify" | "apple";
  providerName: string;
  /** The player's exact height in pixels: the facade reserves it, so the swap never shifts the page. */
  height: number;
  embedUrl: string;
  listenUrl: string;
};

/** The facade's model for an episode address, or null when the address is not on the audio allowlist. */
export function audioModel(url: unknown): AudioModel | null {
  const ref = parseAudioUrl(url);
  if (!ref) return null;
  return {
    provider: ref.provider,
    providerName: playerCopy.providerNames[ref.provider],
    height: AUDIO_PLAYER_HEIGHT[ref.provider],
    embedUrl: audioEmbedUrl(ref),
    listenUrl: audioListenUrl(ref),
  };
}
