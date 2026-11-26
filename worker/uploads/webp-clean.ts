/**
 * Removes hidden data from a WebP. Keeps exactly the chunk kinds scripts/image-metadata.mjs keeps (the source of truth;
 * scripts/webp-clean-agreement.test.mjs proves the two agree): VP8 , VP8L, VP8X, ALPH, ICCP, ANIM, ANMF. Drops EXIF, XMP and
 * every unknown chunk, clears their flags and the reserved bits in VP8X, and rewrites the RIFF size. null means damaged.
 */

const PICTURE = new Set(["VP8 ", "VP8L", "ALPH"]);

interface Chunk {
  id: string;
  data: Uint8Array;
}

const ascii = (bytes: Uint8Array, start: number): string => String.fromCharCode(bytes[start], bytes[start + 1], bytes[start + 2], bytes[start + 3]);

const readU32 = (bytes: Uint8Array, at: number): number => (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0;

/** The chunks between `start` and `end`, or null when one is cut short or runs past `end`. */
function readChunks(bytes: Uint8Array, start: number, end: number): Chunk[] | null {
  const chunks: Chunk[] = [];
  let i = start;
  while (i < end) {
    if (i + 8 > end) return null;
    const size = readU32(bytes, i + 4);
    if (i + 8 + size > end) return null;
    chunks.push({ id: ascii(bytes, i), data: bytes.subarray(i + 8, i + 8 + size) });
    i += 8 + size + (size % 2);
  }
  return chunks;
}

function writeChunk(id: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(8 + data.length + (data.length % 2));
  for (let i = 0; i < 4; i += 1) out[i] = id.charCodeAt(i);
  new DataView(out.buffer).setUint32(4, data.length, true);
  out.set(data, 8);
  return out;
}

export function cleanWebp(bytes: Uint8Array): Uint8Array | null {
  if (bytes.length < 12 || ascii(bytes, 0) !== "RIFF" || ascii(bytes, 8) !== "WEBP") return null;
  const total = readU32(bytes, 4) + 8;
  if (total > bytes.length || total < 12) return null;
  const chunks = readChunks(bytes, 12, total);
  if (!chunks) return null;
  const kept: Chunk[] = [];
  let clear = 0;
  for (const { id, data } of chunks) {
    if (id === "EXIF") clear |= 0x08;
    else if (id === "XMP ") clear |= 0x04;
    else if (id === "VP8X") {
      if (data.length !== 10) return null;
      kept.push({ id, data: Uint8Array.from(data) });
    } else if (id === "ANIM") {
      if (data.length !== 6) return null;
      kept.push({ id, data });
    } else if (id === "ANMF") {
      if (data.length < 16) return null;
      const nested = readChunks(data, 16, data.length);
      if (!nested || nested.some((chunk) => !PICTURE.has(chunk.id))) return null;
      kept.push({ id, data });
    } else if (id === "ICCP" || PICTURE.has(id)) kept.push({ id, data });
  }
  const header = kept.find((chunk) => chunk.id === "VP8X");
  if (header) {
    header.data[0] &= ~(clear | 0xc1);
    header.data.fill(0, 1, 4);
  }
  const parts = kept.map((chunk) => writeChunk(chunk.id, chunk.data));
  const bodyLength = 4 + parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(8 + bodyLength);
  out.set([0x52, 0x49, 0x46, 0x46]);
  new DataView(out.buffer).setUint32(4, bodyLength, true);
  out.set([0x57, 0x45, 0x42, 0x50], 8);
  let at = 12;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

/** True when cleaning would change nothing. */
export function isCleanWebp(bytes: Uint8Array): boolean {
  const cleaned = cleanWebp(bytes);
  return cleaned !== null && cleaned.length === bytes.length && cleaned.every((value, index) => value === bytes[index]);
}
