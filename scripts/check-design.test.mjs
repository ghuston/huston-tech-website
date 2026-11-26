import assert from "node:assert/strict";
import { test } from "node:test";
import { cssMotionProblems, designProblems, keyframePropProblems, motionDeclarationProblems } from "./design-rules.mjs";
import { siteKeyframeProps } from "../src/site-blocks/design.ts";

const tsx = (classes) => `export const A = () => <div className="${classes}" />;\n`;
const bad = (classes) => designProblems("src/x.tsx", tsx(classes));

for (const [name, source, expected] of [
  ["hex color", `const c = "#1e4fa3";`, "#1e4fa3"],
  ["rgb color", `const c = "rgb(1, 2, 3)";`, "rgb("],
  ["oklch color", `const c = "oklch(0.5 0.1 200)";`, "oklch("],
  ["style prop", `export const A = () => <div style={{ color: "red" }} />;`, "style="],
]) {
  test(`fails ${name}`, () => {
    const problems = designProblems("src/x.tsx", `${source}\n`);
    assert.equal(problems.length, 1, problems.join("\n"));
    assert.match(problems[0], new RegExp(`^src/x\\.tsx:1: .*\\(${expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)$`));
  });
}

for (const cls of ["text-[17px]", "text-lg", "text-sm", "text-2xl", "bg-red-500", "text-slate-900", "bg-black", "font-sans", "font-mono", "font-[Georgia]", "duration-300", "delay-150", "ease-in", "ease-linear", "animate-spin", "rounded-lg", "rounded-[12px]", "shadow-md", "w-[300px]", "max-w-[60ch]", "-ml-[650px]", "min-[900px]:flex", "[mask-type:alpha]", "[--x:12px]", "supports-[display:grid]:grid"]) {
  test(`fails ${cls}`, () => {
    const problems = bad(cls);
    assert.equal(problems.length, 1, problems.join("\n"));
    assert.ok(problems[0].endsWith(`(${cls})`), problems[0]);
    assert.match(problems[0], /^src\/x\.tsx:1: /);
  });
}

for (const cls of ["grid-cols-[5fr_7fr]", "grid-rows-[auto_1fr]", "aria-[invalid=true]:border-rust", "data-[open=true]:block", "[&::-webkit-details-marker]:hidden", "[--hl-u-color:var(--hl-silver)]", "bg-ink/40", "text-body", "text-list", "rounded-card", "shadow-lift", "duration-feedback", "ease-site", "animate-none", "font-ui", "md:py-24", "split:flex", "pt-4.5", "text-green", "bg-green-deep", "text-white", "-mt-1.75", "outline-offset-3"]) {
  test(`allows ${cls}`, () => {
    assert.deepEqual(bad(cls), []);
  });
}

test("ignores href anchors and comment lines", () => {
  assert.deepEqual(designProblems("src/x.tsx", `<a href="#abc123">x</a>\n// text-lg #fff\n/* rgb(1,2,3) */\n`), []);
});

test("reports the line of the problem", () => {
  const problems = designProblems("src/x.tsx", `a\nb\n<div className="text-lg" />\n`);
  assert.match(problems[0], /^src\/x\.tsx:3: /);
});

test("fails section padding, with and without a prefix", () => {
  for (const cls of ["py-16", "md:py-24", "pt-8", "pb-4"]) {
    const problems = designProblems("src/blocks/x.tsx", `<section className="relative ${cls}">\n`);
    assert.equal(problems.length, 1, `${cls}: ${problems.join("\n")}`);
    assert.match(problems[0], /padding on a block's section/);
  }
  assert.deepEqual(designProblems("src/blocks/x.tsx", `<section className="relative px-4">\n<div className="py-16" />\n`), []);
  assert.deepEqual(designProblems("src/components/hl/x.tsx", `<section className="py-16">\n`), []);
});

const tokensCss = `:root { --d: 150ms; }\n@theme static { --duration-feedback: 150ms; --default-transition-duration: var(--duration-feedback); }\n`;
const reduced = `@media (prefers-reduced-motion: reduce) { *, *::before { animation: none !important; transition: none !important; } }\n`;

test("css: token definitions and var() times pass", () => {
  const css = `${tokensCss}.a { transition: opacity var(--duration-feedback) var(--ease-site), visibility 0s linear var(--duration-feedback); }\n${reduced}`;
  assert.deepEqual(cssMotionProblems(css), []);
});

test("css: literal times in transitions and animations fail", () => {
  for (const decl of ["transition: opacity 150ms ease", "transition-duration: 0.5s", "animation: a 2s linear", "animation-duration: 300ms"]) {
    const problems = cssMotionProblems(`.a { ${decl}; }\n${reduced}`);
    assert.equal(problems.length, 1, `${decl}: ${problems.join("\n")}`);
    assert.match(problems[0], /literal time/);
  }
});

test("css: keyframes may animate only opacity, transform and friends", () => {
  const ok = `@keyframes hl-enter { from { opacity: 0; translate: 0 var(--d); } to { opacity: 1; scale: 1; rotate: 0; clip-path: inset(0); transform: none; } }\n${reduced}`;
  assert.deepEqual(cssMotionProblems(ok), []);
  const problems = cssMotionProblems(`@keyframes grow { from { width: 0; } to { width: 100%; margin-left: 4px; } }\n${reduced}`);
  assert.equal(problems.length, 2);
  assert.match(problems.join("\n"), /grow animate width/);
});

test("css: the reduced-motion block must exist and switch both off", () => {
  assert.match(cssMotionProblems(".a { color: red; }").join("\n"), /reduced-motion/);
  assert.match(cssMotionProblems("@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }").join("\n"), /reduced-motion/);
});

test("motion declarations: none needs a real reason", () => {
  const registry = [
    { type: "hero", motion: { entrance: "none", reason: "short" } },
    { type: "faq", motion: { entrance: "none", reason: "The first block is the page's first paint." } },
    { type: "prose", motion: { entrance: "default" } },
  ];
  const problems = motionDeclarationProblems(registry, "");
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^hero: .*20 characters/);
});

test("motion declarations: a signature must name keyframes in the css", () => {
  const registry = [{ type: "video", motion: { entrance: "default", signature: { keyframes: "pulse", reason: "x" } } }];
  assert.match(motionDeclarationProblems(registry, "@keyframes other { }").join("\n"), /hl-signature-pulse/);
  assert.deepEqual(motionDeclarationProblems(registry, "@keyframes hl-signature-pulse { from { opacity: 0; } }"), []);
});

const dash = `@keyframes hl-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }\n${reduced}`;

test("css: the site's approved keyframe property (stroke-dashoffset) passes, and only because the site lists it", () => {
  assert.deepEqual(cssMotionProblems(dash), []);
  const without = cssMotionProblems(dash, []);
  assert.equal(without.length, 1);
  assert.match(without[0], /hl-draw animate stroke-dashoffset/);
});

test("css: a site keyframe property needs a reason of 20+ characters, in the check and in the css rule", () => {
  const short = [{ prop: "stroke-dashoffset", reason: "line draws" }];
  assert.equal(keyframePropProblems(short).length, 1);
  assert.match(keyframePropProblems(short)[0], /stroke-dashoffset.*reason of at least 20/);
  assert.match(cssMotionProblems(dash, short).join("\n"), /animate stroke-dashoffset/);
  const good = [{ prop: "stroke-dashoffset", reason: "line draws repaint and never change layout" }];
  assert.deepEqual(keyframePropProblems(good), []);
  assert.deepEqual(cssMotionProblems(dash, good), []);
  assert.deepEqual(keyframePropProblems([{ prop: "", reason: "x".repeat(30) }]).length, 1);
});

test("the site's shipped keyframe properties all carry a real reason", () => {
  assert.deepEqual(keyframePropProblems(siteKeyframeProps), []);
  assert.ok(siteKeyframeProps.some((entry) => entry.prop === "stroke-dashoffset"));
});
