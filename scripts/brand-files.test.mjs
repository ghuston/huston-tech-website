// Tests for the files generated from src/content/brand.json: `npm run check:config` fails when src/app/palette.css or
// src/lib/fonts.ts differ from it (scripts/config-rules.mjs: brandFiles, driftedFiles).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { GENERATED_BRAND_FILES } from "../src/brand/generated.ts";
import { brandFiles, driftedFiles } from "./config-rules.mjs";
import { rules } from "./change-scope-rules.mjs";
import { siteConfig } from "../site.config.ts";

const brand = JSON.parse(readFileSync(new URL("../src/content/brand.json", import.meta.url), "utf8"));
// This site preloads the accent font (site.config.ts preloadAccentFont), so its fonts.ts is generated with that option.
const options = { preloadAccent: siteConfig.preloadAccentFont === true };
const read = (files) => (path) => files[path] ?? null;

describe("generated brand files", () => {
  test("the generator, the scope rules and the Worker name the same two files", () => {
    assert.deepEqual(Object.keys(brandFiles(brand, options)).sort(), [...GENERATED_BRAND_FILES].sort());
    assert.deepEqual([...rules.generatedFiles].sort(), [...GENERATED_BRAND_FILES].sort());
  });

  test("fonts.ts says it is generated", () => {
    assert.match(readFileSync(new URL("../src/lib/fonts.ts", import.meta.url), "utf8"), /^\/\/ Generated from src\/content\/brand\.json by `npm run sync:config`; do not edit by hand\.\n/);
  });

  test("the committed palette.css and fonts.ts match brand.json", () => {
    const generated = brandFiles(brand, options);
    const committed = Object.fromEntries(Object.keys(generated).map((path) => [path, readFileSync(new URL(`../${path}`, import.meta.url), "utf8")]));
    assert.deepEqual(driftedFiles(generated, read(committed)), []);
  });

  test("a palette.css that differs from brand.json is reported with the differing line", () => {
    const generated = brandFiles(brand, options);
    const stale = { ...generated, "src/app/palette.css": generated["src/app/palette.css"].replace(brand.colors.green, "#000000") };
    const drift = driftedFiles(generated, read(stale));
    assert.equal(drift.length, 1);
    assert.match(drift[0], /src\/app\/palette\.css/);
    assert.match(drift[0], /--hl-green: #000000/);
  });

  test("a fonts.ts that differs from brand.json is reported", () => {
    const generated = brandFiles(brand, options);
    const other = brandFiles({ ...brand, fonts: { ...brand.fonts, display: "fraunces", body: "work-sans" } }, options);
    const drift = driftedFiles(generated, read({ ...generated, "src/lib/fonts.ts": other["src/lib/fonts.ts"] }));
    assert.equal(drift.length, 1);
    assert.match(drift[0], /src\/lib\/fonts\.ts/);
  });

  test("a missing generated file counts as drift", () => {
    assert.equal(driftedFiles(brandFiles(brand, options), () => null).length, 2);
  });

  test("the accent font is preloaded only when site.config.ts says so", () => {
    assert.match(brandFiles(brand, { preloadAccent: true })["src/lib/fonts.ts"], /variable: "--font-newsreader",\n  display: "swap",\n  preload: true,/);
    assert.match(brandFiles(brand)["src/lib/fonts.ts"], /variable: "--font-newsreader",\n  display: "swap",\n  preload: false,/);
    assert.equal(siteConfig.preloadAccentFont, true);
  });

  test("a font that is not curated and a color that is not #rrggbb are refused", () => {
    assert.throws(() => brandFiles({ ...brand, fonts: { ...brand.fonts, body: "comic-sans" } }), /not an allowed body font/);
    assert.throws(() => brandFiles({ ...brand, colors: { ...brand.colors, green: "blue" } }), /#rrggbb/);
  });
});
