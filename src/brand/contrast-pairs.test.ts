import assert from "node:assert/strict";
import { test } from "node:test";
import brand from "../content/brand.json" with { type: "json" };
import { CONTRAST_PAIRS, COLOR_TOKENS, failingPairs, type Palette } from "./contrast-pairs.ts";

const template = brand.colors as Palette;

test("the 13 tokens are the keys of brand.json", () => {
  assert.deepEqual([...COLOR_TOKENS].sort(), Object.keys(template).sort());
});

test("the template palette passes every pair", () => {
  assert.deepEqual(failingPairs(template), []);
});

test("every pair names a real place and a known token and minimum", () => {
  for (const pair of CONTRAST_PAIRS) {
    assert.ok(COLOR_TOKENS.includes(pair.fg) && COLOR_TOKENS.includes(pair.bg));
    assert.ok(pair.min === 4.5 || pair.min === 3);
    assert.ok(pair.where.length > 10, pair.where);
  }
});

test("failingPairs reports the pair, its ratio and its minimum", () => {
  const light: Palette = { ...template, green: "#9fc5ff" };
  const failures = failingPairs(light);
  const onSilver = failures.find((f) => f.fg === "green" && f.bg === "silver" && f.min === 4.5);
  assert.ok(onSilver);
  assert.ok(onSilver.ratio < 2);
  assert.match(onSilver.where, /eyebrow/);
  assert.ok(failures.every((f) => f.fg === "green" || f.bg === "green"));
});

test("a palette with light ink fails the text pairs", () => {
  const failures = failingPairs({ ...template, ink: "#bbbbbb" });
  assert.ok(failures.some((f) => f.fg === "ink" && f.bg === "silver"));
});
