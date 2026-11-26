// Tests for scripts/pdf-check.mjs: the byte checks for a PDF added under public/files/.
import assert from "node:assert/strict";
import { test } from "node:test";
import { rules } from "./change-scope-rules.mjs";
import { pdfNames, pdfProblem } from "./pdf-check.mjs";
import { PDF_ACTIVE_NAMES, pdfActiveName, pdfHeaderOk, pdfPageCount, pdfTailOk } from "../src/lib/pdf-scan.ts";

// The template's Worker upload check (worker/uploads/pdf.ts) is not in this site yet. This is the same decision from the
// same shared scan, so the agreement test below keeps its meaning. A later step swaps it for the Worker's own import.
function checkPdf(bytes, maxBytes) {
  if (bytes.length > maxBytes) return { ok: false, reason: "too_big" };
  if (!pdfHeaderOk(bytes) || !pdfTailOk(bytes)) return { ok: false, reason: "damaged" };
  if (pdfActiveName(bytes) !== null) return { ok: false, reason: "active" };
  return { ok: true, pages: pdfPageCount(bytes) };
}

/** A tiny well-formed PDF, with `extra` placed inside the catalog dictionary. */
const pdf =(extra = "") =>
  Buffer.from(`%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R ${extra}>>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`, "latin1");

test("a plain PDF passes", () => {
  assert.equal(pdfProblem(pdf(), rules), null);
});

test("it must start with %PDF-", () => {
  assert.match(pdfProblem(Buffer.from("<html>hi</html>\n%%EOF"), rules), /not really a PDF/);
  assert.match(pdfProblem(Buffer.from(" %PDF-1.4\n%%EOF"), rules), /not really a PDF/);
  assert.match(pdfProblem(Buffer.alloc(0), rules), /not really a PDF/);
});

test("%%EOF must be within the last 1024 bytes", () => {
  const nearEnd = Buffer.concat([pdf(), Buffer.alloc(1000, 0x20)]);
  assert.equal(pdfProblem(nearEnd, rules), null);
  const tooFar = Buffer.concat([pdf(), Buffer.alloc(2000, 0x20)]);
  assert.match(pdfProblem(tooFar, rules), /cut off/);
  assert.match(pdfProblem(Buffer.from("%PDF-1.4\n1 0 obj\n"), rules), /cut off/);
});

test("it may not be over the size limit, and exactly the limit is fine", () => {
  const padded = (size) => Buffer.concat([pdf().subarray(0, 9), Buffer.alloc(size - pdf().length, 0x20), pdf().subarray(9)]);
  assert.match(pdfProblem(padded(rules.maxPdfBytes + 1), { ...rules }), /over the 10 MB limit/);
  const small = { ...rules, maxPdfBytes: 5000 };
  assert.equal(pdfProblem(padded(5000), small), null);
  assert.match(pdfProblem(padded(5001), small), /over the/);
});

test("every active name is refused, and the message names the fix", () => {
  for (const name of rules.pdfActiveNames) {
    const problem = pdfProblem(pdf(`/${name} 5 0 R `), rules);
    assert.match(problem, new RegExp(`/${name}\\b`), name);
    assert.match(problem, /Save it again as a plain PDF \(Print, then Save as PDF\)/);
  }
});

test("#xx escapes are decoded, so a disguised name still counts", () => {
  assert.match(pdfProblem(pdf("/J#61vaScript 5 0 R "), rules), /\/JavaScript/);
  assert.match(pdfProblem(pdf("/#4A#53 5 0 R "), rules), /\/JS/);
  assert.match(pdfProblem(pdf("/Embedded#46ile << >> "), rules), /\/EmbeddedFile/);
});

test("names are matched whole: /JSFoo is not /JS, /AAPL is not /AA, /Launcher is not /Launch", () => {
  assert.equal(pdfProblem(pdf("/JSFoo 1 /AAPL 2 /Launcher 3 /EmbeddedFilesX 4 "), rules), null);
});

test("a name followed straight by a delimiter still counts", () => {
  assert.match(pdfProblem(pdf("/S/JavaScript/JS(alert(1)) "), rules), /\/JavaScript, \/JS/);
  assert.match(pdfProblem(pdf("<</AA<</O 1 0 R>>>> "), rules), /\/AA/);
});

test("pdfNames decodes escapes and splits on delimiters", () => {
  assert.deepEqual([...pdfNames(Buffer.from("/A#42C/Foo<</Bar[/Baz]"))].sort(), ["ABC", "Bar", "Baz", "Foo"]);
});

test("the rules file's active names equal the shared scan's list", () => {
  assert.deepEqual([...rules.pdfActiveNames], [...PDF_ACTIVE_NAMES]);
});

test("the Worker check and the script check give the same verdict on the same bytes", () => {
  const fixtures = {
    "NUL after /JS": ["/S /JS\u0000(alert(1)) ", true],
    "NUL after /JavaScript": ["/JavaScript\u0000<< >> ", true],
    "vertical tab after /JS is part of the name": ["/JS\u000b(x) ", false],
    "#-escaped": ["/J#61vaScript 1 0 R ", true],
    "/JSFoo": ["/JSFoo 1 /AAPL 2 ", false],
    GoToR: ["<< /S /GoToR /F (x) >> ", true],
    GoToE: ["/S/GoToE ", true],
    Rendition: ["/Rendition 1 0 R ", true],
    Movie: ["/Movie << >> ", true],
    Sound: ["/Sound << >> ", true],
    clean: ["/Type /Page ", false],
  };
  for (const [label, [extra, active]] of Object.entries(fixtures)) {
    const bytes = pdf(extra);
    const script = pdfProblem(bytes, rules) !== null;
    const worker = checkPdf(bytes, 10_000_000);
    assert.equal(script, active, `script: ${label}`);
    assert.equal(!worker.ok && worker.reason === "active", active, `worker: ${label}`);
  }
});

test("pdfPageCount takes /Type, optional PDF white space, then the whole name /Page", () => {
  const body = (s) => Buffer.from(`%PDF-1.4\n${s}\n%%EOF`, "latin1");
  assert.equal(pdfPageCount(body("/Type/Page /Type /Page /Type\u0000/Page /Type /Pages /Type /PageX /Type /Page(")), 4);
  assert.equal(pdfPageCount(body("nothing")), 1);
});
