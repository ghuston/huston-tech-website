import type { FileKind } from "./types.ts";

export type Refusal = "video" | "gif" | "code" | "unsupported";

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"]);
const VIDEO_BRANDS = new Set(["isom", "iso2", "mp41", "mp42", "avc1", "qt  ", "M4V ", "3gp4", "3gp5"]);

const ascii = (bytes: Uint8Array, start: number, length: number): string => {
  let out = "";
  for (let i = start; i < start + length && i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]);
  return out;
};

const startsWith = (bytes: Uint8Array, signature: number[]): boolean => signature.every((value, index) => bytes[index] === value);

/** Text that begins (after an optional byte-order mark and whitespace) with `<`: SVG, HTML, XML. */
function looksLikeMarkup(bytes: Uint8Array): boolean {
  let i = 0;
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) i = 3;
  while (i < bytes.length && i < 1024 && (bytes[i] === 0x20 || bytes[i] === 0x09 || bytes[i] === 0x0a || bytes[i] === 0x0d)) i += 1;
  return bytes[i] === 0x3c;
}

/** Judges a file by its first bytes only, never by its name or the browser's type. AVIF and unknown brands are "unsupported". */
export function detectKind(bytes: Uint8Array): { kind: FileKind } | { refused: Refusal } {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { kind: "jpeg" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: "png" };
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF") {
    const form = ascii(bytes, 8, 4);
    if (form === "WEBP") return { kind: "webp" };
    if (form === "AVI ") return { refused: "video" };
  }
  if (ascii(bytes, 0, 5) === "%PDF-") return { kind: "pdf" };
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return { refused: "gif" };
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return { refused: "video" };
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (HEIC_BRANDS.has(brand)) return { kind: "heic" };
    if (VIDEO_BRANDS.has(brand)) return { refused: "video" };
    return { refused: "unsupported" };
  }
  if (looksLikeMarkup(bytes)) return { refused: "code" };
  return { refused: "unsupported" };
}
