import assert from "node:assert/strict";
import { test } from "node:test";
import brand from "../content/brand.json" with { type: "json" };
import type { Palette } from "./contrast-pairs.ts";
import { paletteCss } from "./palette.ts";

const colors = brand.colors as Palette;

test("paletteCss writes the 13 tokens in order, matching hl.css's names", () => {
  assert.equal(
    paletteCss(colors),
    `/* Generated from src/content/brand.json by \`npm run sync:config\`. Do not edit by hand. */
:root {
  --hl-silver: #f3f5f4;
  --hl-silver-2: #e8eeea;
  --hl-white: #ffffff;
  --hl-ink: #29332d;
  --hl-ink-2: #4a5750;
  --hl-green: #2b6455;
  --hl-green-deep: #1e4a3d;
  --hl-green-edge: #4e9a7c;
  --hl-tint: #e6f1eb;
  --hl-glow: #b4dec8;
  --hl-mint: #cde6d8;
  --hl-rust: #994d34;
  --hl-line: #d3dad6;
}
`,
  );
});

test("paletteCss lowercases a valid color", () => {
  assert.match(paletteCss({ ...colors, green: "#2B6455" }), /--hl-green: #2b6455;/);
});

test("paletteCss throws on anything that is not #rrggbb, so no style value can slip in", () => {
  for (const bad of ["red", "#fff", "#2b6455; } body { display: none", "url(x)", "", "#2b6455 "]) {
    assert.throws(() => paletteCss({ ...colors, green: bad }), /must be #rrggbb/, bad);
  }
  const missing = { ...colors } as Partial<Palette>;
  delete missing.rust;
  assert.throws(() => paletteCss(missing as Palette));
});
