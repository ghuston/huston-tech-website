import assert from "node:assert/strict";
import { test } from "node:test";
import { deflateSync } from "node:zlib";
import { comparePngs, decodePng } from "./compare-screenshots.mjs";

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, body) => {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, "latin1");
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, tail]);
};

/** Encodes pixels (array of [r, g, b, a?] rows-major) with the given filter type per row. */
function encode(width, height, pixels, { channels = 3, filters = [] } = {}) {
  const stride = width * channels;
  const rows = [];
  const prev = Buffer.alloc(stride);
  let previous = prev;
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.from(pixels.slice(y * width, (y + 1) * width).flatMap((p) => p.slice(0, channels)));
    const filter = filters[y] ?? 0;
    const out = Buffer.alloc(stride + 1);
    out[0] = filter;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? row[x - channels] : 0;
      const up = previous[x];
      const upLeft = x >= channels ? previous[x - channels] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const [pa, pb, pc] = [Math.abs(p - left), Math.abs(p - up), Math.abs(p - upLeft)];
        predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      }
      out[x + 1] = (row[x] - predictor) & 255;
    }
    rows.push(out);
    previous = row;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = channels === 4 ? 6 : 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(Buffer.concat(rows))), chunk("IEND", Buffer.alloc(0))]);
}

const gradient = (w, h) => Array.from({ length: w * h }, (_, i) => [(i * 7) % 256, (i * 13) % 256, (i * 29) % 256, 255]);

test("decodes RGB with all five filter types", () => {
  const pixels = gradient(5, 5);
  const png = decodePng(encode(5, 5, pixels, { filters: [0, 1, 2, 3, 4] }));
  assert.equal(png.width, 5);
  assert.equal(png.height, 5);
  assert.deepEqual([...png.data], pixels.flat());
});

test("decodes RGBA", () => {
  const pixels = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]];
  const png = decodePng(encode(2, 2, pixels, { channels: 4, filters: [4, 1] }));
  assert.deepEqual([...png.data], pixels.flat());
});

test("refuses things that are not 8-bit RGB or RGBA PNGs", () => {
  assert.throws(() => decodePng(Buffer.from("hello world")), /not a PNG/);
});

test("identical images", () => {
  const a = decodePng(encode(4, 3, gradient(4, 3)));
  const b = decodePng(encode(4, 3, gradient(4, 3), { filters: [1, 2, 4] }));
  assert.deepEqual(comparePngs(a, b), { identical: true, changedPixels: 0, maxDelta: 0, box: null });
});

test("one pixel different", () => {
  const pixels = gradient(4, 3);
  const changed = pixels.map((p) => [...p]);
  changed[6] = [0, 0, 0, 255];
  const result = comparePngs(decodePng(encode(4, 3, pixels)), decodePng(encode(4, 3, changed)));
  assert.equal(result.identical, false);
  assert.equal(result.changedPixels, 1);
  assert.deepEqual(result.box, { x: 2, y: 1, width: 1, height: 1 });
});

test("bounding box covers every changed pixel", () => {
  const pixels = gradient(6, 6);
  const changed = pixels.map((p) => [...p]);
  changed[7] = [1, 1, 1, 255];
  changed[28] = [2, 2, 2, 255];
  const result = comparePngs(decodePng(encode(6, 6, pixels)), decodePng(encode(6, 6, changed)));
  assert.equal(result.changedPixels, 2);
  assert.deepEqual(result.box, { x: 1, y: 1, width: 4, height: 4 });
});

test("the largest channel difference is reported, and a tolerance is opt-in", () => {
  const pixels = gradient(4, 3);
  const noisy = pixels.map((p) => [...p]);
  noisy[5] = [noisy[5][0] + 2, noisy[5][1], noisy[5][2], noisy[5][3]];
  const a = decodePng(encode(4, 3, pixels));
  const b = decodePng(encode(4, 3, noisy));
  const exact = comparePngs(a, b);
  assert.equal(exact.identical, false, "exact by default");
  assert.equal(exact.maxDelta, 2);
  const within = comparePngs(a, b, 2);
  assert.equal(within.identical, true);
  assert.equal(within.maxDelta, 2);
  assert.equal(comparePngs(a, b, 1).identical, false);
});

test("different sizes are not identical and say so", () => {
  const result = comparePngs(decodePng(encode(4, 3, gradient(4, 3))), decodePng(encode(4, 4, gradient(4, 4))));
  assert.equal(result.identical, false);
  assert.match(result.note, /4 x 3 before, 4 x 4 after/);
});
