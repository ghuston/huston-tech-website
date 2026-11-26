import assert from "node:assert/strict";
import { test } from "node:test";
import type { Context } from "../blocks/validate.ts";
import seed from "../content/business.json" with { type: "json" };
import { formatHours, SOCIAL_NETWORKS, telHref, validateBusiness, type BusinessData, type Hours } from "./business.ts";

const ctx: Context = { repo: { imageExists: () => true, fileExists: () => true }, pages: null };
const open = { opens: "09:00", closes: "17:00" };
const week: Hours = {
  monday: open,
  tuesday: open,
  wednesday: open,
  thursday: open,
  friday: { opens: "09:00", closes: "15:00" },
  saturday: "closed",
  sunday: "closed",
};
const good: BusinessData = {
  name: "Ridgeline Inspections",
  phone: "555 0142",
  email: "hello@ridgeline.example",
  address: ["12 Main Street", "Springfield"],
  hours: week,
  hoursNote: "Closed on public holidays.",
  social: [{ network: "instagram", url: "https://www.instagram.com/ridgeline" }],
};

test("the shipped business.json passes (placeholders allowed)", () => {
  assert.deepEqual(validateBusiness(seed, ctx), []);
});

test("a full good file passes", () => {
  assert.deepEqual(validateBusiness(good, ctx), []);
});

test("not an object, unknown keys and missing keys are named", () => {
  assert.match(validateBusiness([], ctx)[0] ?? "", /must be an object/);
  assert.ok(validateBusiness({ ...good, fax: "1" }, ctx).some((m) => /"fax" is not a business detail/.test(m)));
  const withoutPhone = Object.fromEntries(Object.entries(good).filter(([key]) => key !== "phone"));
  assert.ok(validateBusiness(withoutPhone, ctx).some((m) => /"phone" is required/.test(m)));
});

test("phone: digits and separators only, 7 to 20 characters, or empty or a placeholder", () => {
  for (const ok of ["", "555 0142", "+1 (555) 014-2000", "[[Phone number]]"]) assert.deepEqual(validateBusiness({ ...good, phone: ok }, ctx), [], ok);
  for (const bad of ["call me", "555", "5550142 ext 5", "1".repeat(21), "<b>5550142</b>"]) {
    assert.ok(validateBusiness({ ...good, phone: bad }, ctx).some((m) => /"phone"/.test(m)), bad);
  }
});

test("email: one address, empty or a placeholder", () => {
  for (const ok of ["", "[[Email]]", "a@b.co"]) assert.deepEqual(validateBusiness({ ...good, email: ok }, ctx), [], ok);
  assert.ok(validateBusiness({ ...good, email: "not an email" }, ctx).some((m) => /"email"/.test(m)));
});

test("name, address and note use the plain-text rules and limits", () => {
  assert.ok(validateBusiness({ ...good, name: "<b>Acme</b>" }, ctx).some((m) => /HTML tag/.test(m)));
  assert.ok(validateBusiness({ ...good, name: "" }, ctx).some((m) => /"name"/.test(m)));
  assert.ok(validateBusiness({ ...good, name: "x".repeat(81) }, ctx).some((m) => /at most 80/.test(m)));
  assert.ok(validateBusiness({ ...good, address: ["a", "b", "c", "d", "e"] }, ctx).some((m) => /at most 4/.test(m)));
  assert.ok(validateBusiness({ ...good, hoursNote: "x".repeat(121) }, ctx).some((m) => /at most 120/.test(m)));
});

test("an Instagram URL on instagram.com passes and one on evil.com fails", () => {
  assert.deepEqual(validateBusiness({ ...good, social: [{ network: "instagram", url: "https://instagram.com/ridgeline" }] }, ctx), []);
  const bad = validateBusiness({ ...good, social: [{ network: "instagram", url: "https://evil.com/instagram.com" }] }, ctx);
  assert.ok(bad.some((m) => /Instagram address/.test(m)), bad.join("|"));
  assert.ok(validateBusiness({ ...good, social: [{ network: "instagram", url: "https://instagram.com.evil.com/x" }] }, ctx).length > 0);
  assert.ok(validateBusiness({ ...good, social: [{ network: "instagram", url: "https://notinstagram.com/x" }] }, ctx).length > 0);
});

test("social: https only, known networks only, at most 8", () => {
  assert.ok(validateBusiness({ ...good, social: [{ network: "instagram", url: "http://instagram.com/x" }] }, ctx).length > 0);
  assert.ok(validateBusiness({ ...good, social: [{ network: "myspace", url: "https://myspace.com/x" }] }, ctx).length > 0);
  assert.ok(validateBusiness({ ...good, social: [{ network: "instagram", url: "javascript:alert(1)" }] }, ctx).length > 0);
  const nine = Array.from({ length: 9 }, () => ({ network: "x", url: "https://x.com/a" }));
  assert.ok(validateBusiness({ ...good, social: nine }, ctx).some((m) => /at most 8/.test(m)));
  assert.equal(SOCIAL_NETWORKS.length, 8);
});

test("hours: null is fine; each day needs opens and closes in HH:MM, or closed", () => {
  assert.deepEqual(validateBusiness({ ...good, hours: null }, ctx), []);
  assert.ok(validateBusiness({ ...good, hours: { ...week, monday: "open" } }, ctx).some((m) => /monday/.test(m)));
  assert.ok(validateBusiness({ ...good, hours: { ...week, monday: { opens: "9:00", closes: "17:00" } } }, ctx).some((m) => /HH:MM/.test(m)));
  assert.ok(validateBusiness({ ...good, hours: { ...week, monday: { opens: "17:00", closes: "09:00" } } }, ctx).some((m) => /closes .* before it opens/.test(m)));
  const six = Object.fromEntries(Object.entries(week).filter(([day]) => day !== "sunday"));
  assert.ok(validateBusiness({ ...good, hours: six }, ctx).some((m) => /needs sunday/.test(m)));
  assert.ok(validateBusiness({ ...good, hours: { ...week, funday: "closed" } }, ctx).some((m) => /not a day/.test(m)));
});

test("formatHours groups Mon to Thu 9 to 5, Fri 9 to 3, Sat and Sun closed", () => {
  assert.deepEqual(formatHours(week), [
    { days: "Monday to Thursday", time: "9 am to 5 pm" },
    { days: "Friday", time: "9 am to 3 pm" },
    { days: "Saturday and Sunday", time: "closed" },
  ]);
});

test("formatHours: minutes, noon, midnight, split runs and none", () => {
  const split: Hours = { ...week, monday: { opens: "09:30", closes: "12:00" }, tuesday: open, wednesday: { opens: "09:30", closes: "12:00" } };
  assert.deepEqual(formatHours(split).slice(0, 3), [
    { days: "Monday", time: "9:30 am to 12 pm" },
    { days: "Tuesday", time: "9 am to 5 pm" },
    { days: "Wednesday", time: "9:30 am to 12 pm" },
  ]);
  assert.equal(formatHours({ ...week, monday: { opens: "00:00", closes: "23:45" } })[0]?.time, "12 am to 11:45 pm");
  const all: Hours = { monday: open, tuesday: open, wednesday: open, thursday: open, friday: open, saturday: open, sunday: open };
  assert.deepEqual(formatHours(all), [{ days: "Monday to Sunday", time: "9 am to 5 pm" }]);
  assert.deepEqual(formatHours(null), []);
});

test("telHref strips separators and keeps a leading +", () => {
  assert.equal(telHref("555 0142"), "tel:5550142");
  assert.equal(telHref("+1 (555) 014-2000"), "tel:+15550142000");
  assert.equal(telHref(""), null);
  assert.equal(telHref("[[Phone number]]"), null);
  assert.equal(telHref("call us"), null);
});
