import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { audioModel } from "./audio-player.ts";
import { AUDIO_PLAYER_HEIGHT } from "./embeds.ts";
import { fillCopy, formatDate, initials } from "./list-format.ts";
import { playerCopy } from "../content/players.ts";

const SPOTIFY = "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk";
const APPLE = "https://podcasts.apple.com/us/podcast/the-example-show/id1234567890?i=1000123456789";

test("the model gives the listen link and the provider's exact height; nothing is loaded before a press", () => {
  const spotify = audioModel(SPOTIFY);
  assert.equal(spotify?.height, AUDIO_PLAYER_HEIGHT.spotify);
  assert.equal(spotify?.listenUrl, SPOTIFY);
  assert.match(spotify?.embedUrl ?? "", /^https:\/\/open\.spotify\.com\/embed\/episode\//);
  assert.equal(audioModel(APPLE)?.height, AUDIO_PLAYER_HEIGHT.apple);
  assert.equal(audioModel("https://evil.example/episode/4rOoJ6Egrf8K2IrywzwOMk"), null);
});

test("the facade's markup: a link without script and a button after hydration, no iframe or provider request before the press, a fixed-height frame", () => {
  const source = readFileSync(new URL("./library/episode-list/AudioFacade.tsx", import.meta.url), "utf8");
  const beforePress = source.slice(source.indexOf("  const label ="));
  assert.match(beforePress, /<button type="button" onClick=\{\(\) => setPlaying\(true\)\}/);
  assert.match(beforePress, /<a href=\{listenUrl\}\s+target="_blank"\s+rel="noopener noreferrer"/);
  assert.doesNotMatch(beforePress, /<iframe|<img|<Image/);
  assert.match(source, /allow="autoplay; encrypted-media"/);
  assert.match(source, /loading="lazy"/);
});

test("the height tokens match the players' real heights", () => {
  const css = readFileSync(new URL("../app/hl.css", import.meta.url), "utf8");
  assert.match(css, new RegExp(`--spacing-player-spotify:\\s*${AUDIO_PLAYER_HEIGHT.spotify}px`));
  assert.match(css, new RegExp(`--spacing-player-apple:\\s*${AUDIO_PLAYER_HEIGHT.apple}px`));
});

test("copy fills in the title and provider", () => {
  assert.equal(fillCopy(playerCopy.playLabel, { title: "Episode 1", provider: "Spotify" }), "Play Episode 1 on Spotify");
});

test("dates and initials", () => {
  assert.equal(formatDate("2026-03-27"), "March 27, 2026");
  assert.equal(formatDate("soon"), "soon");
  assert.equal(initials("Ada Lovelace"), "AL");
  assert.equal(initials("Mary Ann Smith"), "MS");
  assert.equal(initials("[[Team member name]]"), "TN");
  assert.equal(initials("Cher"), "C");
});
