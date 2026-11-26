/** The PDF check; the byte scan is src/lib/pdf-scan.ts, shared with the scope check (scripts/pdf-check.mjs). */
import { pdfActiveName, pdfHeaderOk, pdfPageCount, pdfTailOk } from "../../src/lib/pdf-scan.ts";

export type PdfCheck = { ok: true; pages: number } | { ok: false; reason: "damaged" | "active" | "too_big" };

export function checkPdf(bytes: Uint8Array, maxBytes: number): PdfCheck {
  if (bytes.length > maxBytes) return { ok: false, reason: "too_big" };
  if (!pdfHeaderOk(bytes) || !pdfTailOk(bytes)) return { ok: false, reason: "damaged" };
  if (pdfActiveName(bytes) !== null) return { ok: false, reason: "active" };
  return { ok: true, pages: pdfPageCount(bytes) };
}
