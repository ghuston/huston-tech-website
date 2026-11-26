// The byte checks for a PDF a client change adds under public/files/ (scripts/check-change-scope.mjs). Pure: bytes in, one
// plain message or null out. The Worker's upload check (worker/uploads/pdf.ts) uses the same scan, src/lib/pdf-scan.ts.
// Names inside compressed object streams are not seen; the /files/* headers (public/_headers) are the layer for that.
import { pdfHeaderOk, pdfNames, pdfTailOk } from "../src/lib/pdf-scan.ts";

export { pdfNames };

/** Why this PDF cannot go on the site, or null. `rules` carries maxPdfBytes and pdfActiveNames (change-scope-rules.mjs). */
export function pdfProblem(bytes, rules) {
  if (bytes.length > rules.maxPdfBytes) {
    return `${(bytes.length / 1e6).toFixed(1)} MB is over the ${Math.round(rules.maxPdfBytes / 1e6)} MB limit. Save a smaller PDF (for example, export it again at a lower image quality)`;
  }
  if (!pdfHeaderOk(bytes)) return "the file's contents are not really a PDF (renamed file?). Save it as a PDF and add that";
  if (!pdfTailOk(bytes)) return "the PDF looks cut off (it has no end marker). Save it again as a PDF and add that";
  const names = pdfNames(bytes);
  const found = rules.pdfActiveNames.filter((name) => names.has(name));
  if (found.length > 0) {
    return `it holds a script, a form action or an attached file (${found.map((n) => `/${n}`).join(", ")}), which a website can't safely offer. Save it again as a plain PDF (Print, then Save as PDF)`;
  }
  return null;
}
