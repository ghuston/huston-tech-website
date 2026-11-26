import assert from "node:assert/strict";
import test from "node:test";
import { convertPhoto } from "./convert.ts";
import { createFakeImages, imagesError } from "./fake-images.ts";
import { isCleanWebp } from "./webp-clean.ts";

const input = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]);
const KB = 1024;

test("the first attempt is used when it fits, with a 480 px JPEG preview", async () => {
  const fake = createFakeImages({ webpSizes: [100 * KB] });
  const result = await convertPhoto(fake.images, input);
  assert.ok(result.ok);
  assert.equal(result.web.length, 100 * KB);
  assert.equal(result.width, 1600);
  assert.equal(result.height, 1200);
  assert.deepEqual(fake.calls, [
    { width: 1600, height: 1600, fit: "scale-down", format: "image/webp", quality: 82 },
    { width: 480, height: 480, fit: "scale-down", format: "image/jpeg", quality: 70 },
  ]);
  assert.equal(result.preview[0], 0xff);
});

test("the ladder picks the second attempt when the first is too big", async () => {
  const fake = createFakeImages({ webpSizes: [460 * KB, 300 * KB] });
  const result = await convertPhoto(fake.images, input);
  assert.ok(result.ok);
  assert.equal(result.web.length, 300 * KB);
  assert.equal(fake.calls[1].quality, 75);
  assert.equal(fake.calls[1].width, 1600);
});

test("smaller photos keep their size; later rungs report the smaller size", async () => {
  const small = await convertPhoto(createFakeImages({ info: { format: "image/png", width: 800, height: 600 } }).images, input);
  assert.ok(small.ok);
  assert.deepEqual([small.width, small.height], [800, 600]);
  const ladder = await convertPhoto(createFakeImages({ webpSizes: [500 * KB, 500 * KB, 200 * KB] }).images, input);
  assert.ok(ladder.ok);
  assert.deepEqual([ladder.width, ladder.height], [1280, 960]);
});

test("every rung too big is too_detailed", async () => {
  const fake = createFakeImages({ webpSizes: [500 * KB] });
  assert.deepEqual(await convertPhoto(fake.images, input), { ok: false, reason: "too_detailed" });
  assert.deepEqual(fake.calls.map((call) => [call.width, call.quality]), [[1600, 82], [1600, 75], [1280, 72], [1280, 60]]);
});

test("EXIF and XMP in the binding's output are removed", async () => {
  const result = await convertPhoto(createFakeImages({ exif: true, webpSizes: [50 * KB] }).images, input);
  assert.ok(result.ok);
  assert.equal(isCleanWebp(result.web), true);
  assert.doesNotMatch(new TextDecoder("latin1").decode(result.web), /EXIF|GPS-SECRET/);
});

test("svg and binding errors are not_image; error 9422 is quota", async () => {
  assert.deepEqual(await convertPhoto(createFakeImages({ info: { format: "image/svg+xml", width: 1, height: 1 } }).images, input), { ok: false, reason: "not_image" });
  assert.deepEqual(await convertPhoto(createFakeImages({ infoError: imagesError(9412) }).images, input), { ok: false, reason: "not_image" });
  assert.deepEqual(await convertPhoto(createFakeImages({ outputError: imagesError(9422) }).images, input), { ok: false, reason: "quota" });
  assert.deepEqual(await convertPhoto(createFakeImages({ infoError: new Error("ERROR 9422: limit") }).images, input), { ok: false, reason: "quota" });
});

test("a WebP the binding returns broken is damaged", async () => {
  const fake = createFakeImages({ webpSizes: [100 * KB] });
  const broken = {
    ...fake.images,
    input: () => ({
      transform: () => ({ output: async () => ({ image: () => new Blob([new Uint8Array(20)]).stream() }) }),
    }),
  } as unknown as ImagesBinding;
  assert.deepEqual(await convertPhoto(broken, input), { ok: false, reason: "damaged" });
});
