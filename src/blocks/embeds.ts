// The single allowlist of video and audio sites. Import-free so Node scripts and Next share it. A video address is parsed to a
// provider and an id; the address that is embedded or linked is always rebuilt from those, never taken from the input.

export type VideoRef = { provider: "youtube" | "vimeo"; id: string; hash?: string };

export const embedOrigins = ["https://www.youtube-nocookie.com", "https://player.vimeo.com", "https://open.spotify.com", "https://embed.podcasts.apple.com"] as const;

export const videoProviders = [
  { name: "YouTube", example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { name: "Vimeo", example: "https://vimeo.com/76979871" },
] as const;

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{1,12}$/;
const VIMEO_HASH = /^[0-9a-f]{10}$/;

function segments(pathname: string): string[] {
  return pathname.replace(/\/$/, "").split("/").slice(1);
}

function youtubeId(id: string | undefined): VideoRef | null {
  return id !== undefined && YOUTUBE_ID.test(id) ? { provider: "youtube", id } : null;
}

/** The video a pasted address points to, or null when it is not on the allowlist. Extra parameters (t, si, list) are ignored. */
export function parseVideoUrl(input: unknown): VideoRef | null {
  if (typeof input !== "string" || input.length > 300 || /\s/.test(input)) return null;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username !== "" || url.password !== "" || url.port !== "") return null;
  const host = url.hostname.toLowerCase();
  const parts = segments(url.pathname);

  if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
    if (parts.length === 1 && parts[0] === "watch") return youtubeId(url.searchParams.get("v") ?? undefined);
    if (parts.length === 2 && (parts[0] === "embed" || parts[0] === "shorts")) return youtubeId(parts[1]);
    return null;
  }
  if (host === "youtube-nocookie.com" || host === "www.youtube-nocookie.com") {
    return parts.length === 2 && parts[0] === "embed" ? youtubeId(parts[1]) : null;
  }
  if (host === "youtu.be" || host === "www.youtu.be") {
    return parts.length === 1 ? youtubeId(parts[0]) : null;
  }
  if (host === "vimeo.com" || host === "www.vimeo.com") {
    const id = parts[0];
    if (parts.length < 1 || parts.length > 2 || id === undefined || !VIMEO_ID.test(id)) return null;
    const hash = parts[1];
    if (hash === undefined) return { provider: "vimeo", id };
    return VIMEO_HASH.test(hash) ? { provider: "vimeo", id, hash } : null;
  }
  if (host === "player.vimeo.com") {
    const id = parts[1];
    if (parts.length !== 2 || parts[0] !== "video" || id === undefined || !VIMEO_ID.test(id)) return null;
    const hash = url.searchParams.get("h");
    if (hash === null) return { provider: "vimeo", id };
    return VIMEO_HASH.test(hash) ? { provider: "vimeo", id, hash } : null;
  }
  return null;
}

/** The player address the page swaps in when the visitor presses play. */
export function embedUrl(video: VideoRef): string {
  if (video.provider === "youtube") return `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1`;
  const hash = video.hash === undefined ? "" : `&h=${video.hash}`;
  return `https://player.vimeo.com/video/${video.id}?autoplay=1&dnt=1${hash}`;
}

/** The address of the video on its own site: the no-JavaScript fallback link. */
export function watchUrl(video: VideoRef): string {
  if (video.provider === "youtube") return `https://www.youtube.com/watch?v=${video.id}`;
  return video.hash === undefined ? `https://vimeo.com/${video.id}` : `https://vimeo.com/${video.id}/${video.hash}`;
}

// ---- Audio: Spotify and Apple Podcasts episodes. Same rule as video: parse to parts, rebuild the address from the parts.

export type AudioRef =
  | { provider: "spotify"; id: string }
  | { provider: "apple"; country: string; slug: string; show: string; episode: string };

export const audioProviders = [
  { name: "Spotify", example: "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk" },
  { name: "Apple Podcasts", example: "https://podcasts.apple.com/us/podcast/the-example-show/id1234567890?i=1000123456789" },
] as const;

/** The exact height of each player, so swapping the facade for the frame never shifts the page. */
export const AUDIO_PLAYER_HEIGHT = { spotify: 152, apple: 175 } as const;

const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;
const SPOTIFY_LOCALE = /^intl-[a-z]{2}(?:-[A-Za-z]{2,4})?$/;
const APPLE_COUNTRY = /^[a-z]{2}$/;
const APPLE_SLUG = /^(?:[A-Za-z0-9-]|%[0-9A-Fa-f]{2}){1,120}$/;
const APPLE_SHOW = /^id(\d{1,15})$/;
const DIGITS = /^\d{1,20}$/;

/** The episode a pasted address points to, or null when it is not on the audio allowlist. Extra parameters are ignored. */
export function parseAudioUrl(input: unknown): AudioRef | null {
  if (typeof input !== "string" || input.length > 400 || /\s/.test(input)) return null;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username !== "" || url.password !== "" || url.port !== "") return null;
  const host = url.hostname.toLowerCase();
  const parts = segments(url.pathname);

  if (host === "open.spotify.com") {
    const rest = parts[0] !== undefined && SPOTIFY_LOCALE.test(parts[0]) ? parts.slice(1) : parts;
    const id = rest[1];
    return rest.length === 2 && rest[0] === "episode" && id !== undefined && SPOTIFY_ID.test(id) ? { provider: "spotify", id } : null;
  }
  if (host === "podcasts.apple.com") {
    const [country, kind, slug, showPart] = parts;
    const episode = url.searchParams.get("i");
    const show = showPart === undefined ? undefined : APPLE_SHOW.exec(showPart)?.[1];
    if (parts.length !== 4 || kind !== "podcast" || country === undefined || slug === undefined || show === undefined) return null;
    if (!APPLE_COUNTRY.test(country) || !APPLE_SLUG.test(slug) || episode === null || !DIGITS.test(episode)) return null;
    return { provider: "apple", country, slug, show, episode };
  }
  return null;
}

/** The player address the page swaps in when the visitor presses play. */
export function audioEmbedUrl(ref: AudioRef): string {
  if (ref.provider === "spotify") return `https://open.spotify.com/embed/episode/${ref.id}`;
  return `https://embed.podcasts.apple.com/${ref.country}/podcast/${ref.slug}/id${ref.show}?i=${ref.episode}`;
}

/** The episode on its own site: the no-JavaScript "Listen on" link. */
export function audioListenUrl(ref: AudioRef): string {
  if (ref.provider === "spotify") return `https://open.spotify.com/episode/${ref.id}`;
  return `https://podcasts.apple.com/${ref.country}/podcast/${ref.slug}/id${ref.show}?i=${ref.episode}`;
}
