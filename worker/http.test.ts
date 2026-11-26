import assert from "node:assert/strict";
import { test } from "node:test";
import { BASE_HEADERS, jsonResponse, plainText } from "./http.ts";

test("plainText carries the base headers and a text content type", async () => {
  const response = plainText(404, "Not found.\n");
  assert.equal(response.status, 404);
  assert.equal(await response.text(), "Not found.\n");
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  for (const [name, value] of Object.entries(BASE_HEADERS)) assert.equal(response.headers.get(name), value, name);
});

test("jsonResponse serialises the body, and extra headers win", async () => {
  const response = jsonResponse(429, { error: "slow" }, { "retry-after": "60", "referrer-policy": "no-referrer" });
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "slow" });
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(response.headers.get("retry-after"), "60");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("cache-control"), "no-store");
});
