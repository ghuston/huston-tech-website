// Test support only (nothing here ships or runs on the site): builds small, structurally valid JPEG, PNG and WebP files,
// with and without hidden metadata, so the tests never need a real photo. The "oracle" readers at the bottom parse a
// file independently of scripts/image-metadata.mjs, so a test can check the structure of what that script produced.
import { crc32, deflateSync } from "node:zlib";

/** Text planted in the hidden metadata. A test that finds one of these in an output file has found a leak. */
export const SECRET = {
  make: "SecretCam 9000",
  gps: "GPSLAT-SECRET",
  xmp: "SECRET-XMP",
  iptc: "SECRET-IPTC",
  comment: "SECRET-COMMENT",
  trailer: "SECRET-TRAILER",
  thumbnail: "SECRET-THUMB",
  exifChunk: "SECRET-EXIF-CHUNK",
};

const EMPTY = Buffer.alloc(0);
const u16 = (n) => Buffer.from([n >> 8, n & 0xff]);

// ---- JPEG --------------------------------------------------------------------------------------------------------

/** One JPEG marker segment: FF <marker> <2-byte length including itself> <payload>. */
export const jpegSegment = (marker, payload) => Buffer.concat([Buffer.from([0xff, marker]), u16(payload.length + 2), payload]);

/** A real little- or big-endian TIFF block as found inside an EXIF segment: camera make, orientation, a GPS pointer. */
export function exifPayload({ orientation = 6, bigEndian = false, make = SECRET.make, gps = true } = {}) {
  const w16 = (n) => {
    const b = Buffer.alloc(2);
    if (bigEndian) b.writeUInt16BE(n);
    else b.writeUInt16LE(n);
    return b;
  };
  const w32 = (n) => {
    const b = Buffer.alloc(4);
    if (bigEndian) b.writeUInt32BE(n);
    else b.writeUInt32LE(n);
    return b;
  };
  const entry = (tag, type, count, value) => Buffer.concat([w16(tag), w16(type), w32(count), value]);
  const makeBytes = Buffer.from(`${make}\0`);
  const gpsBytes = Buffer.from(`${SECRET.gps}\0`);
  const entryCount = 1 + (orientation ? 1 : 0) + (gps ? 1 : 0);
  const dataStart = 8 + 2 + entryCount * 12 + 4;
  const entries = [entry(0x010f, 2, makeBytes.length, w32(dataStart))];
  if (orientation) entries.push(entry(0x0112, 3, 1, Buffer.concat([w16(orientation), Buffer.alloc(2)])));
  if (gps) entries.push(entry(0x8825, 4, 1, w32(dataStart + makeBytes.length)));
  return Buffer.concat([Buffer.from(bigEndian ? "MM\0*" : "II*\0"), w32(8), w16(entryCount), ...entries, w32(0), makeBytes, gpsBytes]);
}

export const app0Jfif = () => jpegSegment(0xe0, Buffer.concat([Buffer.from("JFIF\0"), Buffer.from([1, 1, 0, 0, 1, 0, 1, 0, 0])]));
/** A JFIF header that carries a 2 x 2 thumbnail (12 bytes of RGB) after the usual 14 bytes. */
export const app0JfifWithThumbnail = () =>
  jpegSegment(0xe0, Buffer.concat([Buffer.from("JFIF\0"), Buffer.from([1, 1, 0, 0, 1, 0, 1, 2, 2]), Buffer.from(SECRET.thumbnail.padEnd(12, "."))]));
export const app1Exif = (options) => jpegSegment(0xe1, Buffer.concat([Buffer.from("Exif\0\0"), exifPayload(options)]));
export const app1Xmp = () => jpegSegment(0xe1, Buffer.from(`http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>${SECRET.xmp}</x:xmpmeta>`));
export const app2Icc = () => jpegSegment(0xe2, Buffer.from("ICC_PROFILE\0\x01\x01FAKE-COLOUR-PROFILE"));
export const app2Mpf = () => jpegSegment(0xe2, Buffer.from("MPF\0multi-picture-data"));
export const app5Other = () => jpegSegment(0xe5, Buffer.from("vendor-private-data"));
export const app13Iptc = () => jpegSegment(0xed, Buffer.from(`Photoshop 3.0\0${SECRET.iptc}`));
/** A real Adobe marker: "Adobe", version (2), two flag words (4), colour transform (1) = 12 bytes. */
export const app14Adobe = () => jpegSegment(0xee, Buffer.concat([Buffer.from("Adobe"), Buffer.from([0, 100, 0, 0, 0, 0, 1])]));
export const comment = () => jpegSegment(0xfe, Buffer.from(SECRET.comment));

export const SCAN_ONE = Buffer.from([0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56]); // includes a stuffed FF00 and a restart marker
export const SCAN_TWO = Buffer.from([0x78, 0xff, 0x00, 0x9a]);
const SOS_HEADER = Buffer.from([1, 1, 0, 0, 63, 0]);
/** A well-formed Huffman table segment: class/id byte, 16 code counts (one code of length 1), one symbol. */
export const DHT_SEGMENT = jpegSegment(0xc4, Buffer.concat([Buffer.from([0x00, 1]), Buffer.alloc(15), Buffer.from([0x05])]));
const SOF0 = jpegSegment(0xc0, Buffer.from([8, 0, 1, 0, 1, 1, 1, 0x11, 0]));

/** SOI, JFIF header, the given segments, a frame header, one (or two) scans, EOI, then optional trailing bytes. */
export function jpeg(segments = [], { twoScans = false, trailing = EMPTY, noJfif = false } = {}) {
  const parts = [Buffer.from([0xff, 0xd8]), ...(noJfif ? [] : [app0Jfif()]), ...segments, SOF0, jpegSegment(0xda, SOS_HEADER), SCAN_ONE];
  if (twoScans) parts.push(DHT_SEGMENT, jpegSegment(0xda, SOS_HEADER), SCAN_TWO);
  parts.push(Buffer.from([0xff, 0xd9]), trailing);
  return Buffer.concat(parts);
}

/** Lists the marker segments before the first scan: [{ marker, payload }]. Independent of the code under test. */
export function listJpegSegments(buf) {
  const out = [];
  let i = 2;
  while (i < buf.length) {
    const marker = buf[i + 1];
    if (buf[i] !== 0xff) throw new Error(`oracle: expected a marker at ${i}`);
    const length = buf.readUInt16BE(i + 2);
    out.push({ marker, payload: buf.subarray(i + 4, i + 2 + length) });
    i += 2 + length;
    if (marker === 0xda) break;
  }
  return out;
}

// ---- PNG ---------------------------------------------------------------------------------------------------------

export const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function pngChunk(type, data = EMPTY) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

export const pngText = (keyword, text) => pngChunk("tEXt", Buffer.from(`${keyword}\0${text}`));
export const pngXmp = () => pngChunk("iTXt", Buffer.from(`XML:com.adobe.xmp\0\0\0\0\0<x:xmpmeta>${SECRET.xmp}</x:xmpmeta>`));
export const pngExif = () => pngChunk("eXIf", Buffer.concat([exifPayload()]));

/** Signature, IHDR (1 x 1), the given chunks, IDAT, IEND, then optional trailing bytes. */
export function png(extraChunks = [], { trailing = EMPTY } = {}) {
  const ihdr = pngChunk("IHDR", Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 0, 0, 0, 0]));
  const idat = pngChunk("IDAT", deflateSync(Buffer.from([0, 0])));
  return Buffer.concat([PNG_SIGNATURE, ihdr, ...extraChunks, idat, pngChunk("IEND"), trailing]);
}

/** Lists the chunks: [{ type, data, crcOk }]. Independent of the code under test. */
export function listPngChunks(buf) {
  const out = [];
  let i = 8;
  while (i < buf.length) {
    const length = buf.readUInt32BE(i);
    const type = buf.toString("latin1", i + 4, i + 8);
    const data = buf.subarray(i + 8, i + 8 + length);
    const crcOk = buf.readUInt32BE(i + 8 + length) === crc32(buf.subarray(i + 4, i + 8 + length));
    out.push({ type, data, crcOk });
    i += 12 + length;
  }
  return out;
}

// ---- WebP --------------------------------------------------------------------------------------------------------

const le32 = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};
export const riffChunk = (id, data) => Buffer.concat([Buffer.from(id, "latin1"), le32(data.length), data, data.length % 2 ? Buffer.alloc(1) : EMPTY]);
const IMAGE_DATA = Buffer.from("odd-sized-image-data!"); // 21 bytes: forces a padding byte

/** An extended WebP (VP8X) with optional hidden EXIF and XMP chunks, an optional colour profile and optional trailing bytes. */
export function webp({ exif = false, xmp = false, icc = false, trailing = EMPTY, extra = [], reserved = false } = {}) {
  const flags = (icc ? 0x20 : 0) | (exif ? 0x08 : 0) | (xmp ? 0x04 : 0) | (reserved ? 0xc1 : 0);
  const unused = reserved ? Buffer.from("GPS") : Buffer.alloc(3);
  const chunks = [riffChunk("VP8X", Buffer.concat([Buffer.from([flags]), unused, Buffer.alloc(6)]))];
  if (icc) chunks.push(riffChunk("ICCP", Buffer.from("FAKE-COLOUR-PROFILE")));
  chunks.push(riffChunk("VP8L", IMAGE_DATA), ...extra);
  if (exif) chunks.push(riffChunk("EXIF", Buffer.from(`Exif\0\0${SECRET.exifChunk}`)));
  if (xmp) chunks.push(riffChunk("XMP ", Buffer.from(`<x:xmpmeta>${SECRET.xmp}</x:xmpmeta>`)));
  const body = Buffer.concat([Buffer.from("WEBP"), ...chunks]);
  return Buffer.concat([Buffer.from("RIFF"), le32(body.length), body, trailing]);
}

/** A plain (non-extended) lossy WebP: it has no place to hold metadata. */
export function webpSimple() {
  const body = Buffer.concat([Buffer.from("WEBP"), riffChunk("VP8 ", IMAGE_DATA)]);
  return Buffer.concat([Buffer.from("RIFF"), le32(body.length), body]);
}

/** Lists the chunks after "WEBP": [{ id, data }]. Also returns the declared RIFF size. Independent of the code under test. */
export function listRiffChunks(buf) {
  const out = [];
  let i = 12;
  const riffSize = buf.readUInt32LE(4);
  while (i + 8 <= riffSize + 8) {
    const size = buf.readUInt32LE(i + 4);
    out.push({ id: buf.toString("latin1", i, i + 4), data: buf.subarray(i + 8, i + 8 + size) });
    i += 8 + size + (size % 2);
  }
  return { riffSize, chunks: out, end: i };
}
