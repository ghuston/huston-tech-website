import assert from "node:assert/strict";
import test from "node:test";
import { makeWebp } from "./fake-images.ts";
import { cleanWebp, isCleanWebp } from "./webp-clean.ts";

const text = (bytes: Uint8Array) => new TextDecoder("latin1").decode(bytes);

test("a plain WebP is already clean and comes back unchanged", () => {
  const plain = makeWebp({ size: 1000 });
  assert.equal(isCleanWebp(plain), true);
  assert.deepEqual(cleanWebp(plain), plain);
});

test("EXIF and XMP are removed and their flags cleared", () => {
  const dirty = makeWebp({ size: 1000, exif: true, xmp: true });
  assert.equal(isCleanWebp(dirty), false);
  assert.match(text(dirty), /GPS-SECRET/);
  const cleaned = cleanWebp(dirty);
  assert.ok(cleaned);
  assert.doesNotMatch(text(cleaned), /EXIF|XMP |GPS-SECRET|author/);
  assert.equal(text(cleaned.subarray(12, 16)), "VP8X");
  assert.equal(cleaned[20] & 0x0c, 0);
  assert.equal(isCleanWebp(cleaned), true);
  assert.equal(new DataView(cleaned.buffer, cleaned.byteOffset).getUint32(4, true), cleaned.length - 8);
});

test("unknown chunks are dropped, odd sizes padded, trailing data cut", () => {
  const base = makeWebp({ size: 200 });
  const unknown = Uint8Array.from([...[..."JUNK"].map((c) => c.charCodeAt(0)), 3, 0, 0, 0, 1, 2, 3, 0]);
  const withJunk = new Uint8Array(base.length + unknown.length + 5);
  withJunk.set(base);
  withJunk.set(unknown, base.length);
  new DataView(withJunk.buffer).setUint32(4, base.length - 8 + unknown.length, true);
  withJunk.set([9, 9, 9, 9, 9], base.length + unknown.length);
  const cleaned = cleanWebp(withJunk);
  assert.ok(cleaned);
  assert.deepEqual(cleaned, base);
});

test("damaged files give null", () => {
  assert.equal(cleanWebp(new Uint8Array(5)), null);
  assert.equal(cleanWebp(Uint8Array.from([..."RIFF....WAVE"].map((c) => c.charCodeAt(0)))), null);
  const good = makeWebp({ size: 300 });
  assert.equal(cleanWebp(good.subarray(0, good.length - 40)), null);
  const badSize = Uint8Array.from(good);
  new DataView(badSize.buffer).setUint32(16, 99999, true);
  assert.equal(cleanWebp(badSize), null);
});
