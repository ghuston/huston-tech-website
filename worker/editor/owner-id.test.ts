import assert from "node:assert/strict";
import { test } from "node:test";
import { ownerKey } from "./owner-id.ts";

test("ownerKey is 16 hex characters and ignores case and surrounding spaces", async () => {
  const key = await ownerKey("Owner@Example.com ");
  assert.match(key, /^[0-9a-f]{16}$/);
  assert.equal(key, await ownerKey("owner@example.com"));
});

test("ownerKey differs for different emails", async () => {
  assert.notEqual(await ownerKey("a@example.com"), await ownerKey("b@example.com"));
});
