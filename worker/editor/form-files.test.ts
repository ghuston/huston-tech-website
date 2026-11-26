import assert from "node:assert/strict";
import { test } from "node:test";
import { formFilesFor, type Snapshot } from "./site-reader.ts";

const snapshot = { forms: new Map<string, unknown>(), formBroken: [] } as unknown as Snapshot;

test("a form file is written with name first, then status, then the rest in their order", () => {
  const form = { status: "live", fields: [{ id: "email", type: "email", label: "Email" }], name: "Quote request", button: "Send", thanks: "Thanks." };
  const [file] = formFilesFor(snapshot, new Map([["quote", form]]), ["quote"]);
  assert.ok(file);
  assert.deepEqual(Object.keys(JSON.parse(file.content) as object), ["name", "status", "fields", "button", "thanks"]);
});
