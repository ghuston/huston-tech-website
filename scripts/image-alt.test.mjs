// Tests for scripts/image-alt.mjs: every image added or changed by a client change must be used somewhere with real alt
// text written next to it. Source files are plain strings: no git, no disk, no network.
//   node --test scripts/image-alt.test.mjs   (or `npm run test:scripts`)
import assert from "node:assert/strict";
import { test } from "node:test";
import { imageAltCheck } from "./image-alt.mjs";

const URL_A = "/images/team/sam.jpg";
const source = (path, content) => ({ path, content });
const check = (...sources) => imageAltCheck(URL_A, sources);
const content = (body) => source("src/content/about.ts", body);

test("an object with src and alt passes, and the alt text is reported", () => {
  const result = check(content(`export const hero = { src: "${URL_A}", alt: "Sam holding a mug at the front desk", width: 800 };\n`));
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.alts, ["Sam holding a mug at the front desk"]);
});

test("the key that holds the path can have any name, and the alt can be a template without placeholders", () => {
  assert.deepEqual(check(content(`export const x = { photo: "${URL_A}", "alt": \`Sam at the desk\` };\n`)).problems, []);
  assert.deepEqual(check(content(`export const x = { image: '${URL_A}', alt: 'Sam' + ' at the desk' };\n`)).problems.length, 0);
});

test("a JSX element with src and alt passes (img, Image and a component), including expression forms", () => {
  const page = (jsx) => source("src/app/(site)/about/page.tsx", `export default function P() { return (<div>${jsx}</div>); }\n`);
  assert.deepEqual(check(page(`<img src="${URL_A}" alt="Sam at the desk" />`)).problems, []);
  assert.deepEqual(check(page(`<Image src="${URL_A}" alt="Sam at the desk" width={800} height={600} />`)).problems, []);
  assert.deepEqual(check(page(`<Photo alt="Sam at the desk" src={"${URL_A}"} />`)).problems, []);
  assert.deepEqual(check(page(`<img src={\`${URL_A}\`} alt={"Sam at the desk"} />`)).problems, []);
});

test("every reference must have alt text: one good and one bad reference fails", () => {
  const result = check(
    content(`export const a = { src: "${URL_A}", alt: "Sam at the desk" };\n`),
    source("src/content/home.ts", `export const b = { src: "${URL_A}" };\n`),
  );
  assert.equal(result.problems.length, 1);
  assert.match(result.problems[0], /src\/content\/home\.ts/);
  assert.match(result.problems[0], /alt/);
});

test("an object without alt, a JSX element without alt and a bare string all fail", () => {
  assert.equal(check(content(`export const x = { src: "${URL_A}", width: 800 };\n`)).problems.length, 1);
  assert.equal(check(source("src/app/(site)/a/page.tsx", `export default () => <img src="${URL_A}" />;\n`)).problems.length, 1);
  const bare = check(content(`export const heroPhoto = "${URL_A}";\n`));
  assert.equal(bare.problems.length, 1);
  assert.match(bare.problems[0], /used on its own/);
  assert.match(bare.problems[0], /src: "\.\.\.", alt: /, "the message shows how to fix it");
});

test("empty, blank, generic, file-name and placeholder alt text all fail", () => {
  for (const alt of ["", "   ", "image", "Photo.", "PICTURE", "alt text", "sam.jpg", "team/sam.jpg", "[[alt]]", "TBD"]) {
    const result = check(content(`export const x = { src: "${URL_A}", alt: ${JSON.stringify(alt)} };\n`));
    assert.equal(result.problems.length, 1, `alt=${JSON.stringify(alt)}`);
  }
  assert.equal(check(source("src/app/(site)/a/page.tsx", `export default () => <img src="${URL_A}" alt="" />;\n`)).problems.length, 1);
});

test("alt text that is not written out as plain text next to the image fails, because it cannot be checked", () => {
  assert.equal(check(content(`const t = "x";\nexport const x = { src: "${URL_A}", alt: t };\n`)).problems.length, 1);
  assert.equal(check(content(`export const x = { src: "${URL_A}", alt: \`Sam \${1}\` };\n`)).problems.length, 1);
  assert.equal(check(source("src/app/(site)/a/page.tsx", `export default () => <img src="${URL_A}" alt={copy.alt} />;\n`)).problems.length, 1);
  assert.equal(check(source("src/app/(site)/a/page.tsx", `export default () => <img {...props} src="${URL_A}" />;\n`)).problems.length, 1);
});

test("an image that nothing uses fails: there is nowhere to put its alt text", () => {
  const result = check();
  assert.equal(result.problems.length, 1);
  assert.match(result.problems[0], /not used/);
  assert.deepEqual(check(content('export const x = { src: "/images/other.jpg", alt: "other" };\n')).problems.length, 1);
});

test("only the exact path counts: a longer path or a comment is not a use of this image", () => {
  const result = check(content(`// ${URL_A}\nexport const x = { src: "${URL_A}.bak", alt: "x" };\nexport const y = { src: "${URL_A}", alt: "Sam at the desk" };\n`));
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.alts, ["Sam at the desk"]);
});

test("a file that does not parse cleanly is still read, and a bad alt in it is still found", () => {
  const result = check(content(`export const x = { src: "${URL_A}", alt: "" \n`));
  assert.equal(result.problems.length, 1);
});

// ---- the reviewer's findings: alt text that passes without meaning anything --------------------------------------

test("meaningless alt text of every kind fails: punctuation, one letter, entities, invisible characters, camera names, generic words", () => {
  for (const alt of ["-", "...", "x", "ab", "&nbsp;", "&#32;", "&#x20;", "​", "﻿", "IMG_1234", "DSC00123", "img 7", "Photos", "a photo", "The picture", "Image of", "photo of", "Pictures of"]) {
    const result = check(content(`export const x = { src: "${URL_A}", alt: ${JSON.stringify(alt)} };\n`));
    assert.equal(result.problems.length, 1, `alt=${JSON.stringify(alt)}`);
  }
});

test("short but real alt text passes", () => {
  for (const alt of ["Sam", "Our team", "Dog on a sofa", "Me at 40", "The shop front on Main Street"]) {
    assert.deepEqual(check(content(`export const x = { src: "${URL_A}", alt: ${JSON.stringify(alt)} };\n`)).problems, [], alt);
  }
});

test("an object that spreads another object after alt could replace it, so it fails", () => {
  const result = check(content(`const o = { alt: "" };\nexport const x = { src: "${URL_A}", alt: "Sam at the desk", ...o };\n`));
  assert.equal(result.problems.length, 1);
  assert.match(result.problems[0], /spread/);
});

test("alt text on an element hidden from screen readers does not count", () => {
  const page = (attrs) => source("src/app/(site)/a/page.tsx", `export default () => <img src="${URL_A}" alt="Sam at the desk" ${attrs} />;\n`);
  for (const attrs of ['aria-hidden="true"', "aria-hidden", "aria-hidden={true}", 'role="presentation"', 'role="none"']) {
    assert.equal(check(page(attrs)).problems.length, 1, attrs);
  }
  for (const attrs of ['aria-hidden="false"', "aria-hidden={false}", 'role="img"']) assert.deepEqual(check(page(attrs)).problems, [], attrs);
});

test("a choice between two images in src still finds the alt text", () => {
  const page = source("src/app/(site)/a/page.tsx", `export default ({ wide }) => <img src={wide ? "${URL_A}" : "/images/other.jpg"} alt="Sam at the desk" />;\n`);
  assert.deepEqual(check(page).problems, []);
});

// ---- page files (JSON) --------------------------------------------------------------------------------------------

const pageJson = (image) => source("src/content/pages/about.json", JSON.stringify({ path: "/about", blocks: [{ type: "video", content: { poster: image } }] }, null, 2));

test("a page file that uses the image with good alt text passes, and the alt text is reported", () => {
  const result = check(pageJson({ src: URL_A, alt: "Sam holding a mug at the front desk" }));
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.alts, ["Sam holding a mug at the front desk"]);
});

test("a page file that uses the image with generic, empty or missing alt text fails and names the file", () => {
  for (const image of [{ src: URL_A, alt: "photo" }, { src: URL_A, alt: "" }, { src: URL_A, alt: "[[alt]]" }, { src: URL_A }]) {
    const result = check(pageJson(image));
    assert.equal(result.problems.length, 1, JSON.stringify(image));
    assert.match(result.problems[0], /src\/content\/pages\/about\.json/);
  }
});

test("in a page file the alt text must sit next to the image, and the image must be used somewhere", () => {
  const bare = check(source("src/content/pages/about.json", JSON.stringify({ posters: [URL_A] })));
  assert.match(bare.problems[0], /used on its own/);
  assert.match(check(source("src/content/pages/about.json", JSON.stringify({ poster: URL_A }))).problems[0], /no alt/);
  assert.match(check(source("src/content/pages/about.json", JSON.stringify({ poster: { src: "/images/other.jpg", alt: "other things" } }))).problems[0], /not used/);
});

test("a page file and a content module can both use the image; one bad use fails the image", () => {
  const result = check(pageJson({ src: URL_A, alt: "Sam at the desk" }), content(`export const x = { src: "${URL_A}", alt: "image" };\n`));
  assert.equal(result.problems.length, 1);
  assert.match(result.problems[0], /src\/content\/about\.ts/);
  assert.deepEqual(result.alts, ["Sam at the desk"]);
});
