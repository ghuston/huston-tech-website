import assert from "node:assert/strict";
import { test } from "node:test";
import { JPEG, makeUploadsEditor, pdfBytes } from "./uploads-test-support.ts";
import { hasUploadRef, resolveUploads } from "./uploads.ts";

const DAY = 86_400_000;

async function setup() {
  const t = makeUploadsEditor();
  const photo = await t.store.add(JPEG, "Team at the counter.jpg");
  const pdf = await t.store.add(pdfBytes(), "Price sheet.pdf");
  assert.ok(photo.ok && pdf.ok);
  return { t, photo: photo.upload, pdf: pdf.upload };
}

const pageWith = (blocks: unknown[]) => new Map<string, unknown>([["/about", { path: "/about", title: "About", blocks }]]);
const resolve = (t: Awaited<ReturnType<typeof setup>>["t"], pages: Map<string, unknown>) => resolveUploads(pages, ["/about"], t.store, t.now.value);

test("a photo in an image src becomes its repo page value, and its name is kept for the alt check", async () => {
  const { t, photo } = await setup();
  const result = await resolve(t, pageWith([{ type: "photo-text", content: { image: { src: `upload:${photo.id}`, alt: "Two people" } } }]));
  assert.ok(result.ok);
  const block = (result.after.get("/about") as { blocks: { content: { image: { src: string } } }[] }).blocks[0];
  assert.equal(block.content.image.src, `/images/uploads/${photo.id}.webp`);
  assert.deepEqual([...result.names], [[`/images/uploads/${photo.id}.webp`, "Team at the counter"]]);
  assert.deepEqual(result.uploads.map((u) => [u.id, u.kind, u.path, u.name, u.sha256, u.width, u.height, u.bytes]), [
    [photo.id, "photo", `public/images/uploads/${photo.id}.webp`, "Team at the counter", photo.sha256, 1600, 1200, photo.bytes],
  ]);
});

test("a PDF in any href, including a button's, becomes /files/<slug>-<id>.pdf", async () => {
  const { t, pdf } = await setup();
  const result = await resolve(t, pageWith([{ type: "closing-cta", content: { action: { label: "Price sheet", href: `upload:${pdf.id}` } } }, { type: "x", content: { link: { href: `upload:${pdf.id}` } } }]));
  assert.ok(result.ok);
  assert.equal(JSON.stringify(result.after.get("/about")).split(`/files/price-sheet-${pdf.id}.pdf`).length, 3);
  assert.equal(result.uploads.length, 1, "one upload used twice is listed once");
  assert.equal(result.names.size, 0);
});

test("the input pages are not changed", async () => {
  const { t, photo } = await setup();
  const pages = pageWith([{ type: "photo-text", content: { image: { src: `upload:${photo.id}`, alt: "x" } } }]);
  await resolve(t, pages);
  assert.match(JSON.stringify(pages.get("/about")), /upload:/);
});

test("a PDF in a photo's place and a photo in a link are refused in plain words", async () => {
  const { t, photo, pdf } = await setup();
  const asPhoto = await resolve(t, pageWith([{ content: { image: { src: `upload:${pdf.id}`, alt: "x" } } }]));
  assert.deepEqual(asPhoto, { ok: false, problems: [`Page /about: upload ${pdf.id} is a PDF; a PDF goes in a link, not in a photo's place.`] });
  const asLink = await resolve(t, pageWith([{ content: { action: { label: "x", href: `upload:${photo.id}` } } }]));
  assert.deepEqual(asLink, { ok: false, problems: [`Page /about: upload ${photo.id} is a photo; a photo goes in a photo's place, not in a link.`] });
});

test("an unknown id and an expired upload are both 'no upload', said once each", async () => {
  const { t, photo } = await setup();
  const unknown = await resolve(t, pageWith([{ content: { a: { src: "upload:zzzzzzzz" }, b: { src: "upload:zzzzzzzz" } } }]));
  assert.deepEqual(unknown, { ok: false, problems: ["There is no upload zzzzzzzz. Use list_uploads to see what the owner uploaded."] });
  t.now.value = new Date(t.now.value.getTime() + 31 * DAY);
  const expired = await resolve(t, pageWith([{ content: { image: { src: `upload:${photo.id}`, alt: "x" } } }]));
  assert.deepEqual(expired, { ok: false, problems: [`There is no upload ${photo.id}. Use list_uploads to see what the owner uploaded.`] });
});

test("an upload with under 3 days left is refused with the days it has", async () => {
  const { t, photo } = await setup();
  t.now.value = new Date(t.now.value.getTime() + 27.5 * DAY);
  const result = await resolve(t, pageWith([{ content: { image: { src: `upload:${photo.id}`, alt: "x" } } }]));
  assert.equal(result.ok, false);
  assert.match((result as { problems: string[] }).problems[0], new RegExp(`^Upload ${photo.id}: This upload leaves your inbox in 3 days; upload it again so it can wait for the owner's yes\\.$`));
});

test("exactly 3 days left is allowed", async () => {
  const { t, photo } = await setup();
  t.now.value = new Date(t.now.value.getTime() + 27 * DAY);
  assert.equal((await resolve(t, pageWith([{ content: { image: { src: `upload:${photo.id}`, alt: "x" } } }]))).ok, true);
});

test("upload: text outside an image src or a link href is left alone", async () => {
  const { t, photo } = await setup();
  const result = await resolve(t, pageWith([{ content: { heading: `upload:${photo.id}` } }]));
  assert.ok(result.ok);
  assert.equal(result.uploads.length, 0);
});

test("hasUploadRef finds a reference anywhere in the operations", () => {
  assert.equal(hasUploadRef([{ op: "set", value: { src: "upload:abcd1234" } }]), true);
  assert.equal(hasUploadRef([{ op: "set", value: "upload:abc" }]), false);
});
