import assert from "node:assert/strict";
import { test } from "node:test";
import { parseHex, toOklch } from "./color.ts";
import { failingPairs, type Palette } from "./contrast-pairs.ts";
import { COMPANION_TOKENS, deriveFromBrand, nearestPassing, TEMPLATE_COMPANIONS } from "./derive.ts";

// The template's own palette as a fixture. These tests check the derivation against the template's shapes, so they must not
// read this site's brand.json (a site's colors are its own and change the numbers).
const template: Palette = {
  silver: "#f5f5f4",
  silver2: "#e7e5e4",
  white: "#ffffff",
  ink: "#1c1917",
  ink2: "#44403c",
  green: "#1e4fa3",
  greenDeep: "#173b7a",
  greenEdge: "#5b85c9",
  tint: "#e8eefa",
  glow: "#c3d4f0",
  mint: "#d5e1f5",
  rust: "#9a3412",
  line: "#d6d3d1",
};

test("deriving from the current brand color reproduces the template companions", () => {
  const derived = deriveFromBrand(template, template.green);
  for (const token of COMPANION_TOKENS) {
    const a = toOklch(derived[token]);
    const b = toOklch(template[token]);
    assert.ok(Math.abs(a.l - b.l) < 0.01 && Math.abs(a.c - b.c) < 0.01, token);
  }
  assert.deepEqual(failingPairs(derived), []);
});

test("a new brand color keeps each companion's lightness and takes the new hue", () => {
  const derived = deriveFromBrand(template, "#1f6b3a");
  const hue = toOklch("#1f6b3a").h;
  for (const token of COMPANION_TOKENS) {
    const was = toOklch(template[token]);
    const now = toOklch(derived[token]);
    assert.ok(Math.abs(was.l - now.l) < 0.02, `${token} lightness ${was.l} -> ${now.l}`);
    if (now.c > 0.02) assert.ok(Math.abs(now.h - hue) < 8, `${token} hue ${now.h} vs ${hue}`);
  }
  assert.equal(derived.green, "#1f6b3a");
  assert.equal(derived.rust, template.rust);
  assert.equal(derived.ink, template.ink);
});

test("a grey brand color derives greys from the template shapes", () => {
  const derived = deriveFromBrand(template, "#444444");
  for (const token of COMPANION_TOKENS) {
    const rgb = parseHex(derived[token]);
    assert.ok(rgb && rgb.r === rgb.g && rgb.g === rgb.b, `${token} ${derived[token]}`);
    assert.ok(Math.abs(toOklch(derived[token]).l - TEMPLATE_COMPANIONS[token].l) < 0.01);
  }
  assert.deepEqual(failingPairs(derived), []);
});

test("when the current brand is grey the template shapes are used", () => {
  const grey = deriveFromBrand(template, "#444444");
  const blue = deriveFromBrand(grey, "#1e4fa3");
  for (const token of COMPANION_TOKENS) {
    assert.ok(Math.abs(toOklch(blue[token]).l - toOklch(template[token]).l) < 0.02, token);
  }
});

test("deriveFromBrand refuses a bad color", () => {
  assert.throws(() => deriveFromBrand(template, "green"));
});

test("a light brand color is refused with a passing #rrggbb suggestion", () => {
  assert.ok(failingPairs(deriveFromBrand(template, "#9fc5ff")).length > 0);
  const suggestion = nearestPassing(template, "brand", "#9fc5ff");
  assert.ok(suggestion !== null && /^#[0-9a-f]{6}$/.test(suggestion));
  assert.deepEqual(failingPairs(deriveFromBrand(template, suggestion)), []);
  const was = toOklch("#9fc5ff");
  const now = toOklch(suggestion);
  assert.ok(Math.abs(now.h - was.h) < 6, "same hue");
  assert.ok(now.l < was.l, "darker");
  assert.ok(was.l - now.l < 0.4, "nearest, not far");
});

test("a color that already passes is its own nearest", () => {
  assert.equal(nearestPassing(template, "brand", "#1F6B3A"), "#1f6b3a");
  assert.equal(nearestPassing(template, "accent", "#9a3412"), "#9a3412");
});

test("a light accent color gets a darker passing suggestion", () => {
  const suggestion = nearestPassing(template, "accent", "#f4a261");
  assert.ok(suggestion !== null);
  assert.deepEqual(failingPairs({ ...template, rust: suggestion }), []);
  assert.ok(toOklch(suggestion).l < toOklch("#f4a261").l);
});

test("a value that is not a color has no suggestion", () => {
  assert.equal(nearestPassing(template, "brand", "not a color"), null);
  assert.equal(nearestPassing(template, "accent", "#fff"), null);
});

test("no suggestion when no shade of the hue can pass, for either role", () => {
  const impossible: Palette = { ...template, silver: "#202020", white: "#ffffff" };
  assert.equal(nearestPassing(impossible, "accent", "#9a3412"), null);
  assert.equal(nearestPassing(impossible, "brand", "#1e4fa3"), null);
});
