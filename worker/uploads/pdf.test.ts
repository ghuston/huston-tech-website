import assert from "node:assert/strict";
import test from "node:test";
import { checkPdf } from "./pdf.ts";

const pdf = (body: string, tail = "\n%%EOF\n") => new TextEncoder().encode(`%PDF-1.7\n${body}${tail}`);
const MAX = 10_000_000;

test("a plain PDF passes and its pages are counted", () => {
  const bytes = pdf("1 0 obj << /Type /Pages /Count 2 >> endobj 2 0 obj << /Type /Page >> endobj 3 0 obj << /Type/Page >> endobj");
  assert.deepEqual(checkPdf(bytes, MAX), { ok: true, pages: 2 });
});

test("page count is at least one", () => {
  assert.deepEqual(checkPdf(pdf("1 0 obj << /Type /Catalog >> endobj"), MAX), { ok: true, pages: 1 });
});

test("damaged: no header, no end marker, EOF too far from the end", () => {
  assert.deepEqual(checkPdf(new TextEncoder().encode("hello\n%%EOF"), MAX), { ok: false, reason: "damaged" });
  assert.deepEqual(checkPdf(pdf("body", "\n"), MAX), { ok: false, reason: "damaged" });
  assert.deepEqual(checkPdf(pdf("body", `\n%%EOF${" ".repeat(1100)}`), MAX), { ok: false, reason: "damaged" });
});

test("too big", () => {
  assert.deepEqual(checkPdf(pdf("x".repeat(100)), 50), { ok: false, reason: "too_big" });
});

test("every active name is refused", () => {
  for (const name of ["JavaScript", "JS", "Launch", "EmbeddedFile", "EmbeddedFiles", "RichMedia", "XFA", "AA", "SubmitForm", "ImportData"]) {
    assert.deepEqual(checkPdf(pdf(`<< /S /${name} >>`), MAX), { ok: false, reason: "active" }, name);
  }
});

test("a NUL after the name ends it, so /JS followed by NUL is refused", () => {
  assert.deepEqual(checkPdf(pdf("<< /S /JS\u0000(alert(1)) >>"), MAX), { ok: false, reason: "active" });
});

test("the newer active names are refused", () => {
  for (const name of ["GoToR", "GoToE", "Rendition", "Movie", "Sound"]) {
    assert.deepEqual(checkPdf(pdf(`<< /S /${name} >>`), MAX), { ok: false, reason: "active" }, name);
  }
});

test("a #-escaped name is decoded before the check", () => {
  assert.deepEqual(checkPdf(pdf("<< /S /J#61vaScript >>"), MAX), { ok: false, reason: "active" });
  assert.deepEqual(checkPdf(pdf("<< /#4aS (x) >>"), MAX), { ok: false, reason: "active" });
});

test("names are matched whole: /JSFoo and /AAPL are fine", () => {
  assert.deepEqual(checkPdf(pdf("<< /JSFoo 1 /AAPL 2 /Launcher 3 >>"), MAX), { ok: true, pages: 1 });
});
