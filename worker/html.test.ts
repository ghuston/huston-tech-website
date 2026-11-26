import assert from "node:assert/strict";
import { test } from "node:test";
import { escapeHtml } from "./html.ts";

test("escapeHtml covers & < > \" '", () => {
  assert.equal(escapeHtml(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
});

test("escapeHtml leaves plain text alone and escapes ampersands first", () => {
  assert.equal(escapeHtml("Open Monday to Friday"), "Open Monday to Friday");
  assert.equal(escapeHtml("&lt;"), "&amp;lt;");
});
