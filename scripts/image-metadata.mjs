// Removes hidden data (camera make and model, GPS location, capture time, captions, editing history, thumbnails, comments)
// from jpg, png and webp files, without decoding or re-encoding the picture. Plain Node, no dependencies: the picture data
// is copied byte for byte and only the metadata segments or chunks are left out. Used by scripts/strip-image-metadata.mjs
// (`npm run strip:images`, which fixes files) and scripts/check-change-scope.mjs (which refuses a change that still has
// such data). Explanation: docs/CHANGE-SCOPE.md.
//
// How it decides what to keep. A file is read as a list of segments (JPEG), chunks (PNG) or chunks (WebP). Only an
// ALLOW-LIST of kinds is kept, and each kept kind must have exactly the size and structure its format defines, so a segment
// cannot be kept because of its name and then carry text in its payload. Everything else is dropped (unknown kinds) or the
// file is refused as damaged (a known kind with the wrong shape, where dropping it would break the picture).
//
// Kept on purpose, because dropping it changes how the picture looks:
//   - the colour profile (JPEG ICC_PROFILE and Adobe segments, PNG iCCP, WebP ICCP);
//   - a rotation flag. Phone photos are stored sideways with a flag saying "turn me". Without the flag they show on
//     their side, and fixing that needs the picture re-encoded. So when a JPEG says it is rotated, one EXIF block holding
//     only that flag (big-endian, 32 bytes of data) is kept. It names no camera, place or time.
//
// What it cannot see (documented in docs/CHANGE-SCOPE.md, "Known limits"): text hidden inside the compressed picture data
// itself, and the free-text fields inside a colour profile. Neither is something a camera or an editor writes by accident;
// finding them would mean decoding the picture.
import { inflateSync } from "node:zlib";

const MARKER_SOI = 0xd8;
const MARKER_EOI = 0xd9;
const MARKER_SOS = 0xda;

/** Thrown for a file that is not what its extension says or is cut short. The message is meant for a person. */
const damaged = (kind, why) => new Error(`not a valid ${kind}: ${why}`);

const startsWithText = (bytes, text) => bytes.length >= text.length && bytes.toString("latin1", 0, text.length) === text;

// ---- JPEG --------------------------------------------------------------------------------------------------------

const XMP_PREFIXES = ["http://ns.adobe.com/xap/1.0/\0", "http://ns.adobe.com/xmp/extension/\0"];

/** The rotation flag (2 to 8) from the TIFF block inside an EXIF segment, or undefined. Upright (1) and unreadable count as none. */
function readOrientation(tiff) {
  if (tiff.length < 8) return undefined;
  const little = tiff.toString("latin1", 0, 2) === "II";
  if (!little && tiff.toString("latin1", 0, 2) !== "MM") return undefined;
  const u16 = (at) => (little ? tiff.readUInt16LE(at) : tiff.readUInt16BE(at));
  const u32 = (at) => (little ? tiff.readUInt32LE(at) : tiff.readUInt32BE(at));
  if (u16(2) !== 42) return undefined;
  const ifd = u32(4);
  if (ifd + 2 > tiff.length) return undefined;
  const count = u16(ifd);
  for (let n = 0; n < count; n += 1) {
    const at = ifd + 2 + n * 12;
    if (at + 12 > tiff.length) return undefined;
    if (u16(at) === 0x0112 && u16(at + 2) === 3 && u32(at + 4) === 1) {
      const value = u16(at + 8);
      return value >= 2 && value <= 8 ? value : undefined;
    }
  }
  return undefined;
}

const segment = (marker, payload) => {
  const header = Buffer.from([0xff, marker, 0, 0]);
  header.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([header, payload]);
};

/** The only EXIF block a stripped photo keeps: a big-endian TIFF with one entry, the rotation flag. */
function rotationOnlyPayload(orientation) {
  const tiff = Buffer.alloc(32); // "Exif\0\0" (6) + TIFF header (8) + entry count (2) + one entry (12) + next-directory pointer (4)
  tiff.write("Exif\0\0MM\0*", 0, "latin1");
  tiff.writeUInt32BE(8, 10); // offset of the first (and only) directory
  tiff.writeUInt16BE(1, 14); // one entry
  tiff.writeUInt16BE(0x0112, 16); // tag: orientation
  tiff.writeUInt16BE(3, 18); // type: short
  tiff.writeUInt32BE(1, 20); // count
  tiff.writeUInt16BE(orientation, 24);
  return tiff;
}

const SOF_MARKERS = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
const SEGMENT_NAMES = { 0xc4: "Huffman table", 0xcc: "arithmetic coding", 0xda: "scan header", 0xdb: "quantisation table", 0xdc: "line count", 0xdd: "restart interval", 0xdf: "expand" };

/** True when the payload of a picture-structure segment has exactly the shape its format defines. */
function wellFormed(marker, p) {
  if (SOF_MARKERS.has(marker)) return p.length >= 6 && p.length === 6 + 3 * p[5];
  switch (marker) {
    case 0xc4: {
      let at = 0;
      while (at < p.length) {
        if (at + 17 > p.length) return false;
        let symbols = 0;
        for (let n = 1; n <= 16; n += 1) symbols += p[at + n];
        at += 17 + symbols;
      }
      return p.length > 0 && at === p.length;
    }
    case 0xdb: {
      let at = 0;
      while (at < p.length) at += 1 + (p[at] >> 4 ? 128 : 64);
      return p.length > 0 && at === p.length;
    }
    case 0xcc:
      return p.length > 0 && p.length % 2 === 0;
    case 0xda:
      return p.length >= 4 && p.length === 4 + 2 * p[0];
    case 0xdc:
    case 0xdd:
      return p.length === 2;
    case 0xdf:
      return p.length === 1;
    default:
      return false;
  }
}

/**
 * What to do with one JPEG segment: { keep: Buffer } to write these bytes instead, or { label } to drop it and say what it was.
 * `state.rotationKept` makes sure at most one rotation-only EXIF block is written.
 */
function judgeJpegSegment(marker, payload, whole, state) {
  if (marker === 0xe0) {
    if (!startsWithText(payload, "JFIF\0") || payload.length < 14) return { label: "unknown APP0 data" };
    if (payload.length === 14 && payload[12] === 0 && payload[13] === 0) return { keep: whole };
    const plain = Buffer.from(payload.subarray(0, 14));
    plain[12] = 0;
    plain[13] = 0;
    return { keep: segment(marker, plain), label: "embedded thumbnail picture" };
  }
  if (marker === 0xe1) {
    if (startsWithText(payload, "Exif\0\0")) {
      const orientation = state.rotationKept ? undefined : readOrientation(payload.subarray(6));
      if (orientation === undefined) return { label: "EXIF (camera and location data)" };
      state.rotationKept = true;
      const rotation = segment(marker, rotationOnlyPayload(orientation));
      return whole.equals(rotation) ? { keep: whole } : { keep: rotation, label: "EXIF (camera and location data; only the rotation flag is kept)" };
    }
    return { label: XMP_PREFIXES.some((prefix) => startsWithText(payload, prefix)) ? "XMP (editing history, author, location)" : "unknown APP1 data" };
  }
  if (marker === 0xe2) return startsWithText(payload, "ICC_PROFILE\0") ? { keep: whole } : { label: "unknown APP2 data (such as a second embedded picture)" };
  if (marker === 0xee) return startsWithText(payload, "Adobe") && payload.length === 12 ? { keep: whole } : { label: "unknown APP14 data" };
  if (marker === 0xed) return { label: "IPTC/Photoshop data (captions, credits, location)" };
  if (marker === 0xfe) return { label: "comment" };
  if (marker >= 0xe3 && marker <= 0xef) return { label: `unknown APP${marker - 0xe0} data` };
  if (SOF_MARKERS.has(marker) || Object.hasOwn(SEGMENT_NAMES, marker)) {
    if (wellFormed(marker, payload)) return { keep: whole };
    throw damaged("JPEG", `a ${SEGMENT_NAMES[marker] ?? "frame header"} segment has unexpected extra data or the wrong size`);
  }
  // Reserved markers, JPG0-JPG13, extensions and anything else: nothing a picture needs.
  return { label: `unknown data segment (marker 0x${marker.toString(16)})` };
}

function stripJpeg(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== MARKER_SOI) throw damaged("JPEG", "it does not start with the JPEG marker");
  const out = [buf.subarray(0, 2)];
  const removed = [];
  const state = { rotationKept: false };
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) throw damaged("JPEG", `expected a marker at byte ${i}, so the file is damaged`);
    while (buf[i + 1] === 0xff) i += 1; // fill bytes before a marker
    const marker = buf[i + 1];
    if (marker === undefined) throw damaged("JPEG", "it is cut short in the middle of a marker");
    if (marker === MARKER_EOI) {
      out.push(buf.subarray(i, i + 2));
      if (i + 2 < buf.length) removed.push("data after the end of the picture");
      return finish(buf, out, removed);
    }
    if (marker === 0x01 || marker === MARKER_SOI || (marker >= 0xd0 && marker <= 0xd7)) {
      out.push(buf.subarray(i, i + 2));
      i += 2;
      continue;
    }
    if (i + 4 > buf.length) throw damaged("JPEG", "it is cut short in the middle of a segment header");
    const length = buf.readUInt16BE(i + 2);
    if (length < 2 || i + 2 + length > buf.length) throw damaged("JPEG", "a segment runs past the end of the file (truncated or damaged)");
    const whole = buf.subarray(i, i + 2 + length);
    const verdict = judgeJpegSegment(marker, whole.subarray(4), whole, state);
    if (verdict.label) removed.push(verdict.label);
    if (verdict.keep) out.push(verdict.keep);
    i += 2 + length;
    if (marker === MARKER_SOS) {
      // Entropy-coded data: copy it until the next real marker. FF00 is a stuffed byte and FFD0-FFD7 are restart markers.
      let j = i;
      while (j < buf.length) {
        if (buf[j] === 0xff) {
          const next = buf[j + 1];
          if (next === undefined) throw damaged("JPEG", "it is cut short inside the picture data");
          if (next === 0x00 || (next >= 0xd0 && next <= 0xd7)) {
            j += 2;
            continue;
          }
          if (next === 0xff) {
            j += 1;
            continue;
          }
          break;
        }
        j += 1;
      }
      if (j >= buf.length) throw damaged("JPEG", "there is no end-of-image marker, so the file is cut short");
      out.push(buf.subarray(i, j));
      i = j;
    }
  }
  throw damaged("JPEG", "there is no end-of-image marker, so the file is cut short");
}

// ---- PNG ---------------------------------------------------------------------------------------------------------

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** Ancillary chunks that only describe how to draw the picture, and the exact data sizes each may have. */
const PNG_SIZES = { gAMA: [4], cHRM: [32], sRGB: [1], sBIT: [1, 2, 3, 4], pHYs: [9], bKGD: [1, 2, 6], acTL: [8], fcTL: [26], cICP: [4], mDCV: [24], cLLI: [8] };
const PNG_CRITICAL = new Set(["IHDR", "PLTE", "IDAT", "IEND"]);

function pngLabel(type, data) {
  if (type === "tEXt" || type === "zTXt") return "text notes";
  if (type === "iTXt") return startsWithText(data, "XML:com.adobe.xmp") ? "XMP (editing history, author, location)" : "text notes";
  if (type === "eXIf") return "EXIF (camera and location data)";
  if (type === "tIME") return "last-changed timestamp";
  if (type === "sPLT") return "suggested palette (sPLT)";
  return `unknown private chunk ${type}`;
}

/** True when `data` is exactly one complete zlib stream, with nothing after it. */
function isWholeZlibStream(data) {
  try {
    return inflateSync(data, { info: true }).engine.bytesWritten === data.length;
  } catch {
    return false;
  }
}

/** Throws unless a kept chunk has exactly the shape its format defines. */
function checkPngChunk(type, data) {
  const unexpected = () => damaged("PNG", `a ${type} chunk has an unexpected size or content`);
  if (type === "IHDR") {
    if (data.length !== 13) throw unexpected();
  } else if (type === "PLTE") {
    if (data.length < 3 || data.length > 768 || data.length % 3 !== 0) throw unexpected();
  } else if (type === "IEND") {
    if (data.length !== 0) throw damaged("PNG", "the IEND chunk has data in it");
  } else if (Object.hasOwn(PNG_SIZES, type)) {
    if (!PNG_SIZES[type].includes(data.length)) throw unexpected();
  } else if (type === "tRNS") {
    if (data.length > 256) throw unexpected();
  } else if (type === "hIST") {
    if (data.length % 2 !== 0 || data.length > 512) throw unexpected();
  } else if (type === "fdAT") {
    if (data.length < 4) throw unexpected();
  } else if (type === "iCCP") {
    const end = data.indexOf(0);
    const name = end > 0 ? data.toString("latin1", 0, end) : "";
    if (end < 1 || end > 79 || !/^[\x20-\x7e\xa1-\xff]+$/.test(name) || data[end + 1] !== 0 || !isWholeZlibStream(data.subarray(end + 2))) {
      throw damaged("PNG", "the iCCP colour profile chunk is not valid (a name, then one complete compressed profile)");
    }
  }
}

function stripPng(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw damaged("PNG", "it does not start with the PNG signature");
  const out = [buf.subarray(0, 8)];
  const removed = [];
  const idat = [];
  let i = 8;
  let first = true;
  while (i < buf.length) {
    if (i + 12 > buf.length) throw damaged("PNG", "a chunk is cut short (truncated or damaged)");
    const length = buf.readUInt32BE(i);
    if (i + 12 + length > buf.length) throw damaged("PNG", "a chunk runs past the end of the file (truncated or damaged)");
    const type = buf.toString("latin1", i + 4, i + 8);
    const whole = buf.subarray(i, i + 12 + length);
    const data = whole.subarray(8, 8 + length);
    if (first && type !== "IHDR") throw damaged("PNG", "the first chunk is not IHDR");
    first = false;
    const critical = (buf[i + 4] & 0x20) === 0;
    if (critical && !PNG_CRITICAL.has(type)) throw damaged("PNG", `it has a critical chunk (${type}) that this tool does not know, so it cannot tell what it holds`);
    const known = critical || Object.hasOwn(PNG_SIZES, type) || ["tRNS", "hIST", "fdAT", "iCCP"].includes(type);
    if (known) {
      checkPngChunk(type, data);
      out.push(whole);
      if (type === "IDAT") idat.push(data);
    } else {
      removed.push(pngLabel(type, data));
    }
    i += 12 + length;
    if (type === "IEND") {
      if (!isWholeZlibStream(Buffer.concat(idat))) throw damaged("PNG", "the picture data (IDAT) is not one complete compressed stream (extra bytes or damage)");
      if (i < buf.length) removed.push("data after the end of the picture");
      return finish(buf, out, removed);
    }
  }
  throw damaged("PNG", "there is no IEND chunk, so the file is cut short");
}

// ---- WebP --------------------------------------------------------------------------------------------------------

const WEBP_PICTURE = new Set(["VP8 ", "VP8L", "ALPH"]);

const uint32le = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};

/** Reads RIFF chunks between `start` and `end`: [{ id, data }]. Throws if one runs past `end`. */
function readRiffChunks(buf, start, end) {
  const chunks = [];
  let i = start;
  while (i < end) {
    if (i + 8 > end) throw damaged("WebP", "a chunk is cut short (truncated or damaged)");
    const size = buf.readUInt32LE(i + 4);
    if (i + 8 + size > end) throw damaged("WebP", "a chunk runs past the end of the file (truncated or damaged)");
    chunks.push({ id: buf.toString("latin1", i, i + 4), data: buf.subarray(i + 8, i + 8 + size) });
    i += 8 + size + (size % 2);
  }
  return chunks;
}

function stripWebp(buf) {
  if (buf.length < 12 || buf.toString("latin1", 0, 4) !== "RIFF" || buf.toString("latin1", 8, 12) !== "WEBP") throw damaged("WebP", "it is not a RIFF/WEBP file");
  const total = buf.readUInt32LE(4) + 8;
  if (total > buf.length || total < 12) throw damaged("WebP", "the file is shorter than it says (truncated or damaged)");
  const kept = [];
  const removed = [];
  let clear = 0;
  for (const chunk of readRiffChunks(buf, 12, total)) {
    const { id, data } = chunk;
    if (id === "EXIF") {
      removed.push("EXIF (camera and location data)");
      clear |= 0x08;
    } else if (id === "XMP ") {
      removed.push("XMP (editing history, author, location)");
      clear |= 0x04;
    } else if (id === "VP8X") {
      if (data.length !== 10) throw damaged("WebP", "the VP8X header has an unexpected size");
      kept.push({ id, data: Buffer.from(data) });
    } else if (id === "ANIM") {
      if (data.length !== 6) throw damaged("WebP", "the ANIM chunk has an unexpected size");
      kept.push({ id, data });
    } else if (id === "ANMF") {
      if (data.length < 16 || readRiffChunks(data, 16, data.length).some((nested) => !WEBP_PICTURE.has(nested.id))) {
        throw damaged("WebP", "an animation frame (ANMF) holds something unexpected");
      }
      kept.push({ id, data });
    } else if (id === "ICCP" || WEBP_PICTURE.has(id)) {
      kept.push({ id, data });
    } else {
      removed.push(`unknown chunk ${JSON.stringify(id)}`);
    }
  }
  const header = kept.find((c) => c.id === "VP8X");
  if (header) {
    const before = Buffer.from(header.data);
    header.data[0] &= ~(clear | 0xc1); // the flags for removed chunks and the reserved bits
    header.data.fill(0, 1, 4); // the reserved bytes
    if (header.data[0] !== before[0] && !clear) removed.push("unused header bits");
    else if (!header.data.subarray(1, 4).equals(before.subarray(1, 4))) removed.push("unused header bytes");
  }
  if (total < buf.length) removed.push("data after the end of the picture");
  if (removed.length === 0) return { bytes: buf, removed };
  const body = Buffer.concat([Buffer.from("WEBP"), ...kept.flatMap((c) => [Buffer.from(c.id, "latin1"), uint32le(c.data.length), c.data, c.data.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)])]);
  return { bytes: Buffer.concat([Buffer.from("RIFF"), uint32le(body.length), body]), removed };
}

// ---- public API --------------------------------------------------------------------------------------------------

/** When nothing was removed the file is returned as it came in, so a clean file is never rewritten. */
function finish(original, parts, removed) {
  return { bytes: removed.length === 0 ? original : Buffer.concat(parts), removed };
}

const STRIPPERS = { ".jpg": stripJpeg, ".jpeg": stripJpeg, ".png": stripPng, ".webp": stripWebp };

/**
 * Returns { bytes, removed }: the file without hidden data, and a plain-English name for each thing taken out (empty when
 * the file was already clean, in which case `bytes` is the input). Throws an Error whose message a person can read when the
 * file is damaged or its extension is not jpg, jpeg, png or webp.
 */
export function stripMetadata(bytes, extension) {
  const key = String(extension).toLowerCase();
  if (!Object.hasOwn(STRIPPERS, key)) throw new Error(`${extension || "a file with no extension"} is not a jpg, png or webp image`);
  return STRIPPERS[key](bytes);
}

/** Like stripMetadata but never throws and never returns bytes: { removed } or { error }. For checks that only need to know. */
export function inspectMetadata(bytes, extension) {
  try {
    return { removed: stripMetadata(bytes, extension).removed };
  } catch (error) {
    return { error: error.message };
  }
}
