import assert from "node:assert/strict";
import { test } from "node:test";
import seed from "../content/brand.json" with { type: "json" };
import { deriveFromBrand } from "../brand/derive.ts";
import { failingPairs, type Palette } from "../brand/contrast-pairs.ts";
import type { Repo } from "../blocks/validate.ts";
import { validateBrand } from "./brand.ts";

const repo: Repo = { imageExists: (src) => src === "/images/uploads/k3x9q2mz.webp", fileExists: () => true };
const template = seed.colors as Palette;
const logo = { src: "/images/uploads/k3x9q2mz.webp", alt: "Ridgeline Inspections: a blue mountain ridge above the name", width: 480, height: 160 };

test("the shipped brand.json passes", () => {
  assert.deepEqual(validateBrand(seed, repo), []);
});

test("a light brand color is refused in plain words with a suggestion that passes", () => {
  const messages = validateBrand({ ...seed, colors: { ...template, green: "#9fc5ff" } }, repo);
  assert.ok(messages.length > 0);
  const first = messages.find((m) => /eyebrow text/.test(m));
  assert.ok(first, messages.join("\n"));
  assert.match(first, /the brand color #9fc5ff is not strong enough for eyebrow text/);
  assert.match(first, /reaches 1\.\d to 1 and needs 4\.5 to 1/);
  const suggestion = /The nearest brand color that works is (#[0-9a-f]{6})\./.exec(first)?.[1];
  assert.ok(suggestion, first);
  assert.deepEqual(failingPairs(deriveFromBrand(template, suggestion)), []);
  assert.deepEqual(validateBrand({ ...seed, colors: deriveFromBrand(template, suggestion) }, repo), []);
});

test("the ratio is never rounded up to the minimum", () => {
  // #767676 on white is 4.54 (passes); #777777 is 4.48 and must read 4.4, not 4.5.
  const messages = validateBrand({ ...seed, colors: { ...template, rust: "#777777" } }, repo);
  assert.ok(messages.some((m) => /accent color #777777/.test(m) && /reaches 4\.\d to 1 and needs 4\.5 to 1/.test(m) && !/reaches 4\.5/.test(m)), messages.join("\n"));
});

test("a failing accent color names the accent color and its nearest passing color", () => {
  const messages = validateBrand({ ...seed, colors: { ...template, rust: "#f4a261" } }, repo);
  const one = messages.find((m) => /the accent color #f4a261/.test(m));
  assert.ok(one, messages.join("\n"));
  const suggestion = /nearest accent color that works is (#[0-9a-f]{6})/.exec(one)?.[1];
  assert.ok(suggestion);
  assert.deepEqual(failingPairs({ ...template, rust: suggestion }), []);
});

test("a failing neutral is explained without a color suggestion", () => {
  const messages = validateBrand({ ...seed, colors: { ...template, ink: "#bbbbbb" } }, repo);
  assert.ok(messages.some((m) => /text and background colors that Huston Logic sets/.test(m)));
});

test("when no shade can work the message says so", () => {
  const messages = validateBrand({ ...seed, colors: { ...template, silver: "#202020", white: "#ffffff", green: "#9fc5ff" } }, repo);
  assert.ok(messages.some((m) => /No shade of that color works/.test(m)));
});

test("colors must be #rrggbb, complete and known", () => {
  assert.ok(validateBrand({ ...seed, colors: { ...template, green: "blue" } }, repo).some((m) => /"green" is "blue"; write it as #rrggbb/.test(m)));
  assert.ok(validateBrand({ ...seed, colors: { ...template, green: "#fff" } }, repo).some((m) => /#rrggbb/.test(m)));
  assert.ok(validateBrand({ ...seed, colors: { ...template, pink: "#ff00ff" } }, repo).some((m) => /"pink" is not a color/.test(m)));
  const missing = Object.fromEntries(Object.entries(template).filter(([key]) => key !== "rust"));
  assert.ok(validateBrand({ ...seed, colors: missing }, repo).some((m) => /"rust" is missing/.test(m)));
});

test("fonts must be curated ids for their role", () => {
  assert.deepEqual(validateBrand({ ...seed, fonts: { display: "fraunces", body: "lora", accent: "playfair-display" } }, repo), []);
  const bad = validateBrand({ ...seed, fonts: { display: "comic-sans", body: "inter", accent: "outfit" } }, repo);
  assert.ok(bad.some((m) => /display font "comic-sans" is not one this site offers/.test(m)));
  assert.ok(bad.some((m) => /accent font "outfit"/.test(m)));
  assert.ok(validateBrand({ ...seed, fonts: { display: "outfit", body: "inter" } }, repo).some((m) => /accent font undefined/.test(m)));
});

test("logo: null or an uploaded webp with alt text and a header-friendly size", () => {
  assert.deepEqual(validateBrand({ ...seed, logo }, repo), []);
  assert.ok(validateBrand({ ...seed, logo: { ...logo, src: "/images/photo.webp" } }, repo).some((m) => /upload inbox/.test(m)));
  assert.ok(validateBrand({ ...seed, logo: { ...logo, src: "/brand/logo.svg" } }, repo).some((m) => /upload inbox/.test(m)));
  assert.ok(validateBrand({ ...seed, logo: { ...logo, src: "/images/uploads/zzzzzzzz.webp" } }, repo).some((m) => /not a file in public\/images/.test(m)));
  assert.ok(validateBrand({ ...seed, logo: { ...logo, alt: "logo" } }, repo).some((m) => /alt text/.test(m)));
  assert.ok(validateBrand({ ...seed, logo: { ...logo, alt: "" } }, repo).length > 0);
});

test("logo size: at least 160 by 80, and between square and 6 to 1", () => {
  const small = validateBrand({ ...seed, logo: { ...logo, width: 150, height: 75 } }, repo);
  assert.ok(small.some((m) => /at least 160 wide and 80 tall/.test(m)));
  assert.ok(validateBrand({ ...seed, logo: { ...logo, width: 640, height: 80 } }, repo).some((m) => /six times wider/.test(m)));
  assert.deepEqual(validateBrand({ ...seed, logo: { ...logo, width: 480, height: 80 } }, repo), []);
  assert.ok(validateBrand({ ...seed, logo: { ...logo, width: 160, height: 200 } }, repo).some((m) => /between square and six times/.test(m)));
  assert.deepEqual(validateBrand({ ...seed, logo: { ...logo, width: 200, height: 200 } }, repo), []);
  assert.ok(validateBrand({ ...seed, logo: { ...logo, width: "480", height: 160 } }, repo).some((m) => /whole numbers/.test(m)));
});

test("unknown keys, missing keys and non-objects", () => {
  assert.ok(validateBrand({ ...seed, theme: "dark" }, repo).some((m) => /"theme" is not a brand setting/.test(m)));
  const noLogo = Object.fromEntries(Object.entries(seed).filter(([key]) => key !== "logo"));
  assert.ok(validateBrand(noLogo, repo).some((m) => /"logo" is required/.test(m)));
  assert.ok(validateBrand({ ...seed, logo: { ...logo, extra: 1 } }, repo).some((m) => /"extra"/.test(m)));
  assert.match(validateBrand("x", repo)[0] ?? "", /must be an object/);
});
