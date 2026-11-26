import assert from "node:assert/strict";
import { test } from "node:test";
import type { Context, PageIndex } from "../blocks/validate.ts";
import seed from "../content/notice.json" with { type: "json" };
import { noticeShows, todayIn, validateNotice } from "./notice.ts";

const pages: PageIndex = new Map([["/contact", { status: "live", anchors: new Set<string>() }]]);
const ctx: Context = { repo: { imageExists: () => true, fileExists: () => true }, pages };

test("the shipped notice.json passes and shows nothing", () => {
  assert.deepEqual(validateNotice(seed, ctx), []);
  assert.equal(noticeShows({ text: seed.text, endsOn: seed.endsOn }, "2026-01-01"), false);
});

test("a notice with text, a link and an end date passes", () => {
  const notice = { text: "We are closed December 24 to 26.", link: { label: "Contact us", href: "/contact" }, endsOn: "2026-12-26" };
  assert.deepEqual(validateNotice(notice, ctx), []);
});

test("text: at most 120 characters, plain text only", () => {
  assert.ok(validateNotice({ text: "x".repeat(121), endsOn: null }, ctx).some((m) => /at most 120/.test(m)));
  assert.ok(validateNotice({ text: "<b>Closed</b>", endsOn: null }, ctx).some((m) => /HTML tag/.test(m)));
  assert.deepEqual(validateNotice({ text: "x".repeat(120), endsOn: null }, ctx), []);
});

test("link: label and href follow the link rules; a link needs text", () => {
  assert.ok(validateNotice({ text: "Hi", link: { label: "More", href: "javascript:alert(1)" }, endsOn: null }, ctx).length > 0);
  assert.ok(validateNotice({ text: "Hi", link: { label: "More", href: "/nowhere" }, endsOn: null }, ctx).some((m) => /not a page on this site/.test(m)));
  assert.ok(validateNotice({ text: "", link: { label: "More", href: "/contact" }, endsOn: null }, ctx).some((m) => /no notice text/.test(m)));
});

test("endsOn: a real date or null, and required", () => {
  for (const bad of ["2026-02-30", "26-12-26", "tomorrow", 5, ""]) {
    assert.ok(validateNotice({ text: "Hi", endsOn: bad }, ctx).some((m) => /endsOn/.test(m)), String(bad));
  }
  assert.ok(validateNotice({ text: "Hi" }, ctx).some((m) => /"endsOn" is required/.test(m)));
});

test("unknown keys and non-objects are refused", () => {
  assert.ok(validateNotice({ text: "", endsOn: null, banner: true }, ctx).some((m) => /"banner"/.test(m)));
  assert.match(validateNotice(null, ctx)[0] ?? "", /must be an object/);
});

test("noticeShows is true on endsOn and false the day after", () => {
  const notice = { text: "Closed", endsOn: "2026-12-26" };
  assert.equal(noticeShows(notice, "2026-12-25"), true);
  assert.equal(noticeShows(notice, "2026-12-26"), true);
  assert.equal(noticeShows(notice, "2026-12-27"), false);
  assert.equal(noticeShows({ text: "Closed", endsOn: null }, "2099-01-01"), true);
  assert.equal(noticeShows({ text: "  ", endsOn: null }, "2026-01-01"), false);
});

test("todayIn is the date in the business's time zone", () => {
  assert.equal(todayIn("America/Chicago", new Date("2026-12-27T03:00:00Z")), "2026-12-26");
  assert.equal(todayIn("UTC", new Date("2026-12-27T03:00:00Z")), "2026-12-27");
  assert.equal(todayIn("Pacific/Auckland", new Date("2026-12-26T12:30:00Z")), "2026-12-27");
  assert.throws(() => todayIn("Not/AZone", new Date()));
});
