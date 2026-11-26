import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_UPLOADS } from "../config.ts";
import { FakeKv } from "../editor/test-support.ts";
import { createFakeImages, imagesError, type FakeImagesOptions } from "./fake-images.ts";
import { createFakeR2 } from "./fake-r2.ts";
import { cleanLabel, cleanName } from "./names.ts";
import { pageValueFor, pdfSlug, uploadRepoPath } from "./paths.ts";
import { createUploadStore } from "./store.ts";
import type { UploadRecord, UploadsConfig } from "./types.ts";

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const pdfBytes = (body = "<< /Type /Page >>") => new TextEncoder().encode(`%PDF-1.4\n${body}\n%%EOF\n`);
const KB = 1024;

function setup(options: { config?: Partial<UploadsConfig>; images?: FakeImagesOptions; start?: string } = {}) {
  const r2 = createFakeR2();
  const fake = createFakeImages({ webpSizes: [100 * KB], ...options.images });
  const kv = new FakeKv();
  const clock = { at: new Date(options.start ?? "2026-01-01T12:00:00.000Z") };
  let counter = 0;
  const store = createUploadStore({
    bucket: r2.bucket,
    images: fake.images,
    kv: kv.asNamespace(),
    config: { ...DEFAULT_UPLOADS, enabled: true, bucket: "x-uploads", ...options.config },
    now: () => clock.at,
    randomId: () => `id${String((counter += 1)).padStart(6, "0")}`,
  });
  return { store, r2, fake, kv, clock };
}

const refused = (result: { ok: boolean; message?: string }): string => {
  assert.equal(result.ok, false);
  return (result as { message: string }).message;
};

test("a photo is converted, stored with metadata and previewed", async () => {
  const { store, r2 } = setup();
  const result = await store.add(JPEG, "IMG_0042 Team at the counter.HEIC");
  assert.ok(result.ok);
  const { upload } = result;
  assert.equal(upload.id, "id000001");
  assert.equal(upload.name, "IMG_0042 Team at the counter");
  assert.equal(upload.kind, "photo");
  assert.equal(upload.bytes, 100 * KB);
  assert.deepEqual([upload.width, upload.height], [1600, 1200]);
  assert.equal(upload.uploadedAt, "2026-01-01T12:00:00.000Z");
  assert.equal(upload.expiresAt, "2026-01-31T12:00:00.000Z");
  assert.match(upload.sha256, /^[0-9a-f]{64}$/);
  assert.deepEqual([...r2.objects.keys()].sort(), ["inbox/id000001/file", "inbox/id000001/preview"]);
  assert.deepEqual(await store.get("id000001"), upload);
  assert.equal((await store.file("id000001"))?.length, 100 * KB);
  assert.equal((await store.preview("id000001"))?.[0], 0xff);
});

test("a photo's stored WebP never carries EXIF", async () => {
  const { store } = setup({ images: { exif: true, webpSizes: [50 * KB] } });
  const result = await store.add(JPEG, "a.jpg");
  assert.ok(result.ok);
  const stored = await store.file(result.upload.id);
  assert.ok(stored);
  assert.doesNotMatch(new TextDecoder("latin1").decode(stored), /EXIF|GPS-SECRET/);
});

test("a PDF is stored as uploaded with its page count", async () => {
  const { store, r2 } = setup();
  const bytes = pdfBytes("<< /Type /Page >> << /Type /Page >>");
  const result = await store.add(bytes, "Price sheet.pdf");
  assert.ok(result.ok);
  assert.equal(result.upload.kind, "pdf");
  assert.equal(result.upload.name, "Price sheet");
  assert.equal(result.upload.pages, 2);
  assert.equal(result.upload.width, undefined);
  assert.deepEqual([...r2.objects.keys()], ["inbox/id000001/file"]);
  assert.deepEqual(await store.file("id000001"), bytes);
  assert.equal(await store.preview("id000001"), null);
});

test("the ladder picks the second attempt through the store", async () => {
  const { store, fake } = setup({ images: { webpSizes: [460 * KB, 300 * KB] } });
  const result = await store.add(JPEG, "a.jpg");
  assert.ok(result.ok);
  assert.equal(result.upload.bytes, 300 * KB);
  assert.equal(fake.calls[1].quality, 75);
});

test("refuses video, GIF, SVG, AVIF and other types with the spec's words", async () => {
  const { store } = setup();
  const ftyp = (brand: string) => Uint8Array.from([0, 0, 0, 24, ...[..."ftyp" + brand + "\0\0\0\0isom"].map((c) => c.charCodeAt(0))]);
  assert.match(refused(await store.add(ftyp("mp42"), "clip.mov")), /^Videos can't be uploaded here\. Put the video on YouTube or Vimeo/);
  assert.match(refused(await store.add(Uint8Array.from([..."GIF89a\x01\x00"].map((c) => c.charCodeAt(0))), "a.gif")), /^Moving pictures can't be uploaded/);
  assert.match(refused(await store.add(new TextEncoder().encode("<svg/>"), "a.svg")), /^This file can carry code/);
  assert.equal(refused(await store.add(ftyp("avif"), "a.avif")), "Only photos (JPEG, PNG, WebP or iPhone HEIC) and PDFs can be uploaded.");
  assert.equal(refused(await store.add(new TextEncoder().encode("hello"), "a.txt")), "Only photos (JPEG, PNG, WebP or iPhone HEIC) and PDFs can be uploaded.");
});

test("a type turned off in `types` is refused", async () => {
  const { store } = setup({ config: { types: ["jpeg", "png", "webp", "heic"] } });
  assert.match(refused(await store.add(pdfBytes(), "a.pdf")), /^Only photos/);
});

test("too big photo and too big PDF name their sizes", async () => {
  const { store } = setup();
  const huge = new Uint8Array(21_500_000);
  huge.set([0xff, 0xd8, 0xff]);
  assert.equal(refused(await store.add(huge, "a.jpg")), "This photo is 21.5 MB; the most this site takes is 20 MB.");
  const bigPdf = new Uint8Array(10_400_000);
  bigPdf.set(new TextEncoder().encode("%PDF-1.4"));
  assert.equal(refused(await store.add(bigPdf, "a.pdf")), "This PDF is 10.4 MB; the most this site takes is 10 MB.");
});

test("a damaged PDF, a PDF with active content and a photo the binding rejects", async () => {
  const { store } = setup();
  assert.equal(refused(await store.add(new TextEncoder().encode("%PDF-1.4 cut off"), "a.pdf")), "This file looks damaged, so it can't be used. Try exporting it again.");
  assert.match(refused(await store.add(pdfBytes("<< /S /J#61vaScript /JS (x) >>"), "a.pdf")), /^This PDF holds a script/);
  const broken = setup({ images: { infoError: imagesError(9412) } }).store;
  assert.match(refused(await broken.add(JPEG, "a.jpg")), /^This file looks damaged/);
});

test("quota and too-detailed photos", async () => {
  const quota = setup({ images: { outputError: imagesError(9422) } }).store;
  assert.equal(
    refused(await quota.add(JPEG, "a.jpg")),
    "Photos can't be prepared right now, because this month's photo allowance is used up. PDFs still work. Huston Logic has been told.",
  );
  const detailed = setup({ images: { webpSizes: [900 * KB] } }).store;
  assert.equal(refused(await detailed.add(JPEG, "a.jpg")), "This photo is too detailed to make small enough for a fast page. Try a different photo.");
});

test("inbox full counts the file and the preview", async () => {
  const { store } = setup({ config: { maxTotalBytes: 150 * KB } });
  assert.ok((await store.add(JPEG, "a.jpg")).ok);
  assert.equal(refused(await store.add(JPEG, "b.jpg")), "Your uploads are full (0.2 MB). Remove some you no longer need, then try again.");
  assert.equal((await store.list()).length, 1);
});

test("the daily cap is per day and per site", async () => {
  const { store, kv, clock } = setup({ config: { maxPerDay: 2 } });
  assert.ok((await store.add(pdfBytes(), "a.pdf")).ok);
  assert.ok((await store.add(pdfBytes(), "b.pdf")).ok);
  assert.equal(refused(await store.add(pdfBytes(), "c.pdf")), "You've uploaded 2 files today, the daily limit. Try again tomorrow.");
  assert.equal(kv.store.get("uploads:2026-01-01")?.value, "2");
  assert.equal(kv.ttlOf("uploads:2026-01-01"), 2 * 24 * 60 * 60);
  clock.at = new Date("2026-01-02T00:00:01.000Z");
  assert.ok((await store.add(pdfBytes(), "c.pdf")).ok);
});

test("a refused file does not count against the day", async () => {
  const { store, kv } = setup();
  await store.add(new TextEncoder().encode("hello"), "a.txt");
  assert.equal(kv.store.has("uploads:2026-01-01"), false);
});

test("an attempt that reaches the conversion or the PDF check counts, accepted or not", async () => {
  const detailed = setup({ images: { webpSizes: [900 * KB] }, config: { maxPerDay: 3 } });
  assert.match(refused(await detailed.store.add(JPEG, "a.jpg")), /too detailed/);
  assert.equal(detailed.kv.store.get("uploads:2026-01-01")?.value, "1");
  assert.match(refused(await detailed.store.add(new TextEncoder().encode("%PDF-1.4 cut off"), "a.pdf")), /damaged/);
  assert.match(refused(await detailed.store.add(pdfBytes("<< /JS (x) >>"), "b.pdf")), /holds a script/);
  assert.equal(detailed.kv.store.get("uploads:2026-01-01")?.value, "3");
  assert.match(refused(await detailed.store.add(pdfBytes(), "c.pdf")), /daily limit/);
  const full = setup({ config: { maxTotalBytes: 10 * KB } });
  assert.match(refused(await full.store.add(JPEG, "a.jpg")), /full/);
  assert.equal(full.kv.store.get("uploads:2026-01-01")?.value, "1");
});

test("the inbox is scanned once per add; swept bytes are subtracted, not re-scanned", async () => {
  const { store, r2, clock } = setup({ config: { maxTotalBytes: 250 * KB } });
  await store.add(JPEG, "a.jpg");
  clock.at = new Date("2026-03-01T00:00:00.000Z");
  const original = r2.bucket.list.bind(r2.bucket);
  let lists = 0;
  (r2.bucket as unknown as { list: unknown }).list = (...args: Parameters<typeof original>) => {
    lists += 1;
    return original(...args);
  };
  assert.ok((await store.add(JPEG, "b.jpg")).ok);
  assert.equal(lists, 1);
});

test("an id collision is retried with a new id", async () => {
  const r2 = createFakeR2();
  const kv = new FakeKv();
  const store = createUploadStore({ bucket: r2.bucket, images: createFakeImages().images, kv: kv.asNamespace(), config: { ...DEFAULT_UPLOADS, enabled: true, bucket: "x" }, now: () => new Date("2026-01-01T00:00:00Z") });
  const original = r2.bucket.head.bind(r2.bucket);
  const probed: string[] = [];
  (r2.bucket as unknown as { head: unknown }).head = async (key: string) => {
    probed.push(key);
    return probed.length <= 2 ? ({ key, size: 1, customMetadata: {} } as unknown as R2Object) : original(key);
  };
  const result = await store.add(pdfBytes(), "a.pdf");
  assert.ok(result.ok);
  assert.equal(probed.length, 3, "two collisions, then a free id");
  assert.equal(new Set(probed).size, 3, "each retry tries a new id");
  assert.deepEqual([...r2.objects.keys()], [`inbox/${result.upload.id}/file`]);
});

test("rename of a file that disappeared while it was read is refused and does not bring it back", async () => {
  const { store, r2 } = setup();
  const added = await store.add(pdfBytes(), "a.pdf");
  assert.ok(added.ok);
  const originalGet = r2.bucket.get.bind(r2.bucket);
  (r2.bucket as unknown as { get: unknown }).get = async (key: string) => {
    const object = await originalGet(key);
    r2.objects.delete(key);
    return object;
  };
  assert.match(refused(await store.rename(added.upload.id, "New name")), /isn't in your uploads/);
  assert.equal(r2.objects.size, 0);
});

test("a failed save leaves nothing behind and says so", async () => {
  const { store, r2 } = setup();
  r2.failPutOn.match = "/file";
  assert.match(refused(await store.add(JPEG, "a.jpg")), /^This file couldn't be saved/);
  assert.equal(r2.objects.size, 0);
});

test("list is newest first and hides expired uploads, which a sweep deletes", async () => {
  const { store, r2, clock } = setup({ config: { expireDays: 30 } });
  await store.add(pdfBytes(), "old.pdf");
  clock.at = new Date("2026-01-20T12:00:00.000Z");
  await store.add(pdfBytes(), "middle.pdf");
  clock.at = new Date("2026-01-25T12:00:00.000Z");
  await store.add(pdfBytes(), "new.pdf");
  assert.deepEqual((await store.list()).map((u) => u.name), ["new", "middle", "old"]);
  clock.at = new Date("2026-01-31T12:00:01.000Z");
  assert.equal(await store.get("id000001"), null);
  assert.equal(await store.file("id000001"), null);
  assert.deepEqual((await store.list()).map((u) => u.name), ["new", "middle"]);
  assert.equal(r2.objects.has("inbox/id000001/file"), false);
});

test("sweep deletes at most 20 expired uploads a call", async () => {
  const { store, r2, clock } = setup({ config: { maxPerDay: 100 } });
  for (let i = 0; i < 25; i += 1) await store.add(pdfBytes(), `f${i}.pdf`);
  clock.at = new Date("2026-03-01T00:00:00.000Z");
  assert.equal(await store.sweep(), 20);
  assert.equal(r2.objects.size, 5);
  assert.equal(await store.sweep(), 5);
  assert.equal(await store.sweep(), 0);
});

test("expired uploads do not count against the inbox total", async () => {
  const { store, clock } = setup({ config: { maxTotalBytes: 250 * KB } });
  await store.add(JPEG, "a.jpg");
  clock.at = new Date("2026-03-01T00:00:00.000Z");
  assert.ok((await store.add(JPEG, "b.jpg")).ok);
});

test("rename cleans the name, keeps the bytes and the other facts", async () => {
  const { store } = setup();
  const added = await store.add(JPEG, "a.jpg");
  assert.ok(added.ok);
  const renamed = await store.rename(added.upload.id, "  Front  [[door]]\n\tof the shop.v2 ");
  assert.ok(renamed.ok);
  assert.equal(renamed.upload.name, "Front door of the shop.v2");
  assert.deepEqual({ ...renamed.upload, name: "" }, { ...added.upload, name: "" });
  assert.equal((await store.get(added.upload.id))?.name, "Front door of the shop.v2");
  assert.equal((await store.file(added.upload.id))?.length, 100 * KB);
  assert.equal((await store.rename(added.upload.id, "   "))?.ok && (await store.get(added.upload.id))?.name, "Photo");
  assert.equal(refused(await store.rename("zzzzzzzz", "x")), "That upload isn't in your uploads (it may have been removed or have expired).");
});

test("names with accents and symbols survive storage", async () => {
  const { store } = setup();
  const added = await store.add(pdfBytes(), "Menú café & thé 100%.pdf");
  assert.ok(added.ok);
  assert.equal((await store.get(added.upload.id))?.name, "Menú café & thé 100%");
});

test("remove deletes both objects and reports whether it existed", async () => {
  const { store, r2 } = setup();
  const added = await store.add(JPEG, "a.jpg");
  assert.ok(added.ok);
  assert.equal(await store.remove(added.upload.id), true);
  assert.equal(r2.objects.size, 0);
  assert.equal(await store.remove(added.upload.id), false);
  assert.equal(await store.remove("../etc"), false);
  assert.deepEqual(await store.list(), []);
});

test("random ids are 8 lowercase letters or digits", async () => {
  const r2 = createFakeR2();
  const store = createUploadStore({
    bucket: r2.bucket,
    images: createFakeImages().images,
    kv: new FakeKv().asNamespace(),
    config: DEFAULT_UPLOADS,
    now: () => new Date("2026-01-01T00:00:00Z"),
  });
  const result = await store.add(pdfBytes(), "a.pdf");
  assert.ok(result.ok);
  assert.match(result.upload.id, /^[a-z0-9]{8}$/);
});

test("logs never hold names or bytes", async () => {
  const lines: string[] = [];
  const original = console.log;
  console.log = (line: unknown) => void lines.push(String(line));
  try {
    const { store } = setup();
    await store.add(JPEG, "Secret Name.jpg");
    await store.add(new TextEncoder().encode("<svg/>"), "Other Secret.svg");
  } finally {
    console.log = original;
  }
  assert.ok(lines.length > 0);
  assert.ok(lines.every((line) => !/Secret/.test(line)));
});

test("cleanName and cleanLabel", () => {
  assert.equal(cleanName("C:\\Users\\me\\IMG 1.JPG", "photo"), "IMG 1");
  assert.equal(cleanName(".jpg", "photo"), "Photo");
  assert.equal(cleanName("", "pdf"), "Document");
  assert.equal(cleanName("a".repeat(120) + ".png", "photo").length, 80);
  assert.equal(cleanName("[[placeholder]]\u0000x.pdf", "pdf"), "placeholder x");
  assert.equal(cleanLabel("Price list 2.5", "pdf"), "Price list 2.5");
});

test("repo paths and page values", () => {
  const base: UploadRecord = { id: "k3x9q2mz", name: "Price sheet", kind: "pdf", bytes: 1, uploadedAt: "", expiresAt: "", sha256: "" };
  assert.equal(uploadRepoPath(base), "public/files/price-sheet-k3x9q2mz.pdf");
  assert.equal(uploadRepoPath({ ...base, name: "Home at 12 Oak Street", kind: "photo" }), "public/images/uploads/k3x9q2mz.webp");
  assert.equal(pageValueFor("public/files/price-sheet-k3x9q2mz.pdf"), "/files/price-sheet-k3x9q2mz.pdf");
  assert.equal(pageValueFor("public/images/uploads/k3x9q2mz.webp"), "/images/uploads/k3x9q2mz.webp");
  assert.equal(pdfSlug("!!!"), "document");
  assert.equal(pdfSlug("Café -- Menu  (2026)"), "cafe-menu-2026");
  assert.equal(pdfSlug("a".repeat(39) + " b c"), "a".repeat(39));
  assert.equal(pdfSlug("x".repeat(60)).length, 40);
});
