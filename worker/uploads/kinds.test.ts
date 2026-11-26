import assert from "node:assert/strict";
import test from "node:test";
import { detectKind } from "./kinds.ts";

const bytes = (...values: (number | string)[]): Uint8Array => Uint8Array.from(values.flatMap((v) => (typeof v === "number" ? [v] : [...v].map((c) => c.charCodeAt(0)))));
const ftyp = (brand: string) => bytes(0, 0, 0, 24, "ftyp", brand, 0, 0, 0, 0, "isom");

test("detects the accepted kinds by their first bytes", () => {
  assert.deepEqual(detectKind(bytes(0xff, 0xd8, 0xff, 0xe0)), { kind: "jpeg" });
  assert.deepEqual(detectKind(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0)), { kind: "png" });
  assert.deepEqual(detectKind(bytes("RIFF", 4, 0, 0, 0, "WEBP")), { kind: "webp" });
  assert.deepEqual(detectKind(bytes("%PDF-1.7\n")), { kind: "pdf" });
});

test("HEIC brands are photos", () => {
  for (const brand of ["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"]) assert.deepEqual(detectKind(ftyp(brand)), { kind: "heic" }, brand);
});

test("video files are refused", () => {
  for (const brand of ["isom", "iso2", "mp41", "mp42", "avc1", "qt  ", "M4V ", "3gp4", "3gp5"]) assert.deepEqual(detectKind(ftyp(brand)), { refused: "video" }, brand);
  assert.deepEqual(detectKind(bytes(0x1a, 0x45, 0xdf, 0xa3, 1, 2)), { refused: "video" });
  assert.deepEqual(detectKind(bytes("RIFF", 4, 0, 0, 0, "AVI ", "LIST")), { refused: "video" });
});

test("GIF, markup and everything else are refused", () => {
  assert.deepEqual(detectKind(bytes("GIF89a", 1, 0)), { refused: "gif" });
  assert.deepEqual(detectKind(bytes("GIF87a", 1, 0)), { refused: "gif" });
  assert.deepEqual(detectKind(bytes("<svg xmlns='http://www.w3.org/2000/svg'/>")), { refused: "code" });
  assert.deepEqual(detectKind(bytes(0xef, 0xbb, 0xbf, "\n  <html>")), { refused: "code" });
  assert.deepEqual(detectKind(bytes("<?xml version='1.0'?>")), { refused: "code" });
  assert.deepEqual(detectKind(ftyp("avif")), { refused: "unsupported" });
  assert.deepEqual(detectKind(ftyp("avis")), { refused: "unsupported" });
  assert.deepEqual(detectKind(bytes("hello")), { refused: "unsupported" });
  assert.deepEqual(detectKind(new Uint8Array(0)), { refused: "unsupported" });
});
