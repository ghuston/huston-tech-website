// Tests for the form's Turnstile error split (src/lib/turnstile-errors.ts). It lives here because `npm run test:worker`
// runs worker/*.test.ts. A hostname missing from the widget (110200) once showed visitors "try again" when no retry
// could work; setup errors must read as our failure.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isTurnstileConfigError } from "../src/lib/turnstile-errors.ts";

describe("isTurnstileConfigError", () => {
  test("site setup errors are ours", () => {
    for (const code of ["110100", "110110", "110200", "110420", "110430"]) {
      assert.equal(isTurnstileConfigError(code), true, code);
    }
  });

  test("challenge, timeout and browser errors stay the visitor's", () => {
    for (const code of ["300010", "300030", "600010", "110500", "110510", "110600", "110620", "200500", "", "1102"]) {
      assert.equal(isTurnstileConfigError(code), false, code);
    }
  });

  test("a missing or non-string code is not a setup error", () => {
    for (const code of [undefined, null, 110200, {}]) {
      assert.equal(isTurnstileConfigError(code), false, String(code));
    }
  });
});
