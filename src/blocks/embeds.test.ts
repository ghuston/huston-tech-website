import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AUDIO_PLAYER_HEIGHT, audioEmbedUrl, audioListenUrl, audioProviders, embedOrigins, parseAudioUrl } from "./embeds.ts";

const SPOTIFY_ID = "4rOoJ6Egrf8K2IrywzwOMk";
const APPLE = "https://podcasts.apple.com/us/podcast/the-example-show/id1234567890?i=1000123456789";

describe("parseAudioUrl", () => {
  it("accepts a Spotify episode address, with and without intl- and ?si=", () => {
    const ref = { provider: "spotify", id: SPOTIFY_ID };
    assert.deepEqual(parseAudioUrl(`https://open.spotify.com/episode/${SPOTIFY_ID}`), ref);
    assert.deepEqual(parseAudioUrl(`https://open.spotify.com/intl-de/episode/${SPOTIFY_ID}`), ref);
    assert.deepEqual(parseAudioUrl(`https://open.spotify.com/episode/${SPOTIFY_ID}?si=abc123def456`), ref);
    assert.deepEqual(parseAudioUrl(`https://open.spotify.com/intl-de/episode/${SPOTIFY_ID}?si=abc`), ref);
  });

  it("accepts an Apple Podcasts episode address", () => {
    assert.deepEqual(parseAudioUrl(APPLE), { provider: "apple", country: "us", slug: "the-example-show", show: "1234567890", episode: "1000123456789" });
  });

  it("refuses a Spotify show, playlist or wrong-length id", () => {
    assert.equal(parseAudioUrl(`https://open.spotify.com/show/${SPOTIFY_ID}`), null);
    assert.equal(parseAudioUrl(`https://open.spotify.com/playlist/${SPOTIFY_ID}`), null);
    assert.equal(parseAudioUrl("https://open.spotify.com/episode/short"), null);
    assert.equal(parseAudioUrl(`https://open.spotify.com/episode/${SPOTIFY_ID}x`), null);
  });

  it("refuses an Apple address without ?i=, or with a non-numeric one", () => {
    assert.equal(parseAudioUrl("https://podcasts.apple.com/us/podcast/the-example-show/id1234567890"), null);
    assert.equal(parseAudioUrl("https://podcasts.apple.com/us/podcast/the-example-show/id1234567890?i=abc"), null);
  });

  it("refuses http:, lookalike hosts, credentials, ports and junk", () => {
    assert.equal(parseAudioUrl(`http://open.spotify.com/episode/${SPOTIFY_ID}`), null);
    assert.equal(parseAudioUrl(`https://open.spotify.com.evil.example/episode/${SPOTIFY_ID}`), null);
    assert.equal(parseAudioUrl(`https://evil-open.spotify.com/episode/${SPOTIFY_ID}`), null);
    assert.equal(parseAudioUrl(`https://user:pw@open.spotify.com/episode/${SPOTIFY_ID}`), null);
    assert.equal(parseAudioUrl(`https://open.spotify.com:8443/episode/${SPOTIFY_ID}`), null);
    assert.equal(parseAudioUrl(APPLE.replace("podcasts.apple.com", "podcasts.apple.com.evil.example")), null);
    assert.equal(parseAudioUrl("https://music.apple.com/us/podcast/x/id1?i=2"), null);
    assert.equal(parseAudioUrl(42), null);
    assert.equal(parseAudioUrl(`https://open.spotify.com/episode/${SPOTIFY_ID} extra`), null);
  });
});

describe("audio player and listen addresses", () => {
  it("rebuilds the embed address from parts, never from the pasted text", () => {
    const spotify = parseAudioUrl(`https://open.spotify.com/intl-de/episode/${SPOTIFY_ID}?si=zzz&x=<script>`);
    assert.ok(spotify);
    assert.equal(audioEmbedUrl(spotify), `https://open.spotify.com/embed/episode/${SPOTIFY_ID}`);
    assert.equal(audioListenUrl(spotify), `https://open.spotify.com/episode/${SPOTIFY_ID}`);
    const apple = parseAudioUrl(`${APPLE}&utm_source=x`);
    assert.ok(apple);
    assert.equal(audioEmbedUrl(apple), "https://embed.podcasts.apple.com/us/podcast/the-example-show/id1234567890?i=1000123456789");
    assert.equal(audioListenUrl(apple), APPLE);
  });

  it("states the player heights and lists each provider's example, which parses", () => {
    assert.deepEqual(AUDIO_PLAYER_HEIGHT, { spotify: 152, apple: 175 });
    for (const provider of audioProviders) assert.ok(parseAudioUrl(provider.example), provider.name);
  });

  it("allows exactly the four player origins, in order", () => {
    assert.deepEqual([...embedOrigins], ["https://www.youtube-nocookie.com", "https://player.vimeo.com", "https://open.spotify.com", "https://embed.podcasts.apple.com"]);
  });
});
