import assert from "node:assert/strict";
import { test } from "node:test";
import { contrastRatio, fromOklch, parseHex, toHex, toOklch } from "./color.ts";

test("parseHex accepts only #rrggbb", () => {
  assert.deepEqual(parseHex("#1e4fa3"), { r: 30, g: 79, b: 163 });
  assert.deepEqual(parseHex("#FFFFFF"), { r: 255, g: 255, b: 255 });
  for (const bad of ["#fff", "1e4fa3", "#1e4fa", "#1e4fa3ff", "rgb(0,0,0)", "blue", "", "#gggggg"]) assert.equal(parseHex(bad), null, bad);
});

test("toHex writes lowercase and clamps", () => {
  assert.equal(toHex({ r: 30, g: 79, b: 163 }), "#1e4fa3");
  assert.equal(toHex({ r: 300, g: -4, b: 0.4 }), "#ff0000");
});

test("contrastRatio follows WCAG", () => {
  assert.equal(contrastRatio("#000000", "#ffffff").toFixed(2), "21.00");
  assert.equal(contrastRatio("#ffffff", "#ffffff"), 1);
  assert.equal(contrastRatio("#777777", "#ffffff").toFixed(2), "4.48");
  assert.equal(contrastRatio("#ffffff", "#777777"), contrastRatio("#777777", "#ffffff"));
});

test("toOklch matches known values", () => {
  const white = toOklch("#ffffff");
  assert.ok(Math.abs(white.l - 1) < 0.001 && white.c < 0.001);
  const red = toOklch("#ff0000");
  assert.ok(Math.abs(red.l - 0.628) < 0.002 && Math.abs(red.c - 0.2577) < 0.002 && Math.abs(red.h - 29.23) < 0.3);
  assert.equal(toOklch("#808080").c, 0);
  assert.equal(toOklch("#808080").h, 0);
});

test("fromOklch round trips real palette colors", () => {
  for (const hex of ["#1e4fa3", "#9a3412", "#f5f5f4", "#1c1917", "#c3d4f0", "#00ff00", "#123456"]) {
    assert.equal(fromOklch(toOklch(hex)), hex);
  }
});

test("fromOklch reduces chroma to stay in sRGB and keeps lightness and hue", () => {
  const hex = fromOklch({ l: 0.5, c: 0.4, h: 150 });
  const back = toOklch(hex);
  assert.ok(parseHex(hex) !== null);
  assert.ok(Math.abs(back.l - 0.5) < 0.02, `lightness ${back.l}`);
  assert.ok(back.c < 0.4);
  assert.ok(Math.abs(back.h - 150) < 4, `hue ${back.h}`);
});

test("fromOklch of a grey is a grey, and extremes are black and white", () => {
  const grey = parseHex(fromOklch({ l: 0.6, c: 0, h: 0 }));
  assert.ok(grey !== null && grey.r === grey.g && grey.g === grey.b);
  assert.equal(fromOklch({ l: 0, c: 0.3, h: 10 }), "#000000");
  assert.equal(fromOklch({ l: 1, c: 0.3, h: 10 }), "#ffffff");
});

test("toOklch throws on a bad color", () => {
  assert.throws(() => toOklch("blue"));
});
