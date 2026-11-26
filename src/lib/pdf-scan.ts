// The one PDF byte scan, shared by the Worker's upload check (worker/uploads/pdf.ts) and the CI scope check
// (scripts/pdf-check.mjs). No imports. It reads bytes directly (no TextDecoder). Names inside compressed object streams
// are not seen; the /files/* headers (public/_headers) are the layer for that.
// scripts/change-scope-rules.mjs keeps a copy of PDF_ACTIVE_NAMES (it must stay import-free); a test keeps them equal.

export const PDF_ACTIVE_NAMES: readonly string[] = [
  "JavaScript",
  "JS",
  "Launch",
  "EmbeddedFile",
  "EmbeddedFiles",
  "RichMedia",
  "XFA",
  "AA",
  "SubmitForm",
  "ImportData",
  "GoToR",
  "GoToE",
  "Rendition",
  "Movie",
  "Sound",
];

const SLASH = 0x2f;
const HASH = 0x23;

/** PDF white space is exactly NUL, TAB, LF, FF, CR and SPACE. */
function isWhite(b: number): boolean {
  return b === 0 || b === 9 || b === 10 || b === 12 || b === 13 || b === 32;
}

/** The PDF delimiters: ( ) < > [ ] { } / % */
function isDelimiter(b: number): boolean {
  return b === 0x28 || b === 0x29 || b === 0x3c || b === 0x3e || b === 0x5b || b === 0x5d || b === 0x7b || b === 0x7d || b === SLASH || b === 0x25;
}

function hexValue(b: number): number {
  if (b >= 0x30 && b <= 0x39) return b - 0x30;
  if (b >= 0x41 && b <= 0x46) return b - 0x41 + 10;
  if (b >= 0x61 && b <= 0x66) return b - 0x61 + 10;
  return -1;
}

/** Reads the name whose slash is at `slash`; returns it with #xx decoded and the index just after it. */
function readName(bytes: Uint8Array, slash: number): { name: string; end: number } {
  let name = "";
  let i = slash + 1;
  while (i < bytes.length && !isWhite(bytes[i]) && !isDelimiter(bytes[i])) {
    const b = bytes[i];
    if (b === HASH && i + 2 < bytes.length && hexValue(bytes[i + 1]) >= 0 && hexValue(bytes[i + 2]) >= 0) {
      name += String.fromCharCode(hexValue(bytes[i + 1]) * 16 + hexValue(bytes[i + 2]));
      i += 3;
    } else {
      name += String.fromCharCode(b);
      i += 1;
    }
  }
  return { name, end: i };
}

/** Every name in order, each with the index of its first byte. */
function scanNames(bytes: Uint8Array): { name: string; start: number; end: number }[] {
  const found: { name: string; start: number; end: number }[] = [];
  let i = 0;
  while (i < bytes.length) {
    if (bytes[i] === SLASH) {
      const { name, end } = readName(bytes, i);
      found.push({ name, start: i, end });
      i = Math.max(end, i + 1);
    } else {
      i += 1;
    }
  }
  return found;
}

/** The PDF names in the bytes, with `#xx` escapes decoded (so /J#61vaScript is JavaScript). */
export function pdfNames(bytes: Uint8Array): Set<string> {
  return new Set(scanNames(bytes).map((n) => n.name));
}

/** The first active name the PDF holds, or null. */
export function pdfActiveName(bytes: Uint8Array): string | null {
  const names = pdfNames(bytes);
  for (const name of PDF_ACTIVE_NAMES) if (names.has(name)) return name;
  return null;
}

/** Pages: `/Type`, optional white space, then the whole name `/Page`. At least 1. */
export function pdfPageCount(bytes: Uint8Array): number {
  let pages = 0;
  for (const n of scanNames(bytes)) {
    if (n.name !== "Type") continue;
    let i = n.end;
    while (i < bytes.length && isWhite(bytes[i])) i += 1;
    if (bytes[i] === SLASH && readName(bytes, i).name === "Page") pages += 1;
  }
  return Math.max(1, pages);
}

/** The file starts with "%PDF-". */
export function pdfHeaderOk(bytes: Uint8Array): boolean {
  const head = [0x25, 0x50, 0x44, 0x46, 0x2d];
  return bytes.length >= head.length && head.every((b, i) => bytes[i] === b);
}

/** "%%EOF" appears within the last 1024 bytes. */
export function pdfTailOk(bytes: Uint8Array): boolean {
  const marker = [0x25, 0x25, 0x45, 0x4f, 0x46];
  for (let i = Math.max(0, bytes.length - 1024); i + marker.length <= bytes.length; i += 1) {
    if (marker.every((b, k) => bytes[i + k] === b)) return true;
  }
  return false;
}
