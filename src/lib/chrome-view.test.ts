import assert from "node:assert/strict";
import { test } from "node:test";
import type { BusinessData } from "../settings/business.ts";
import type { NoticeData } from "../settings/notice.ts";
import { businessDetailsView, contactLines, logoImage, noticeToShow, socialLinks } from "./chrome-view.ts";

const business: BusinessData = {
  name: "Maple Dental",
  phone: "+1 (555) 014-2000",
  email: "front@maple.test",
  address: ["12 Main Street", "", "Springfield"],
  hours: {
    monday: { opens: "09:00", closes: "17:00" },
    tuesday: { opens: "09:00", closes: "17:00" },
    wednesday: { opens: "09:00", closes: "17:00" },
    thursday: { opens: "09:00", closes: "17:00" },
    friday: { opens: "09:00", closes: "15:00" },
    saturday: "closed",
    sunday: "closed",
  },
  hoursNote: " Closed on public holidays ",
  social: [
    { network: "linkedin", url: "https://www.linkedin.com/company/maple" },
    { network: "x", url: "https://x.com/maple" },
  ],
};

test("logoImage: null without a logo; scaled to 40 px in the header and 36 px in the footer, with explicit size", () => {
  assert.equal(logoImage(null, "header"), null);
  const logo = { src: "/images/uploads/k3x9q2mz.webp", alt: "Maple Dental", width: 400, height: 160 };
  assert.deepEqual(logoImage(logo, "header"), { src: logo.src, alt: "Maple Dental", width: 100, height: 40 });
  assert.deepEqual(logoImage(logo, "footer"), { src: logo.src, alt: "Maple Dental", width: 90, height: 36 });
});

test("the footer's phone, email and socials come from business.json", () => {
  const lines = contactLines(business);
  assert.deepEqual(lines.phone, { text: "+1 (555) 014-2000", href: "tel:+15550142000" });
  assert.deepEqual(lines.email, { text: "front@maple.test", href: "mailto:front@maple.test" });
  assert.deepEqual(socialLinks(business), [
    { label: "LinkedIn", url: "https://www.linkedin.com/company/maple" },
    { label: "X", url: "https://x.com/maple" },
  ]);
});

test("empty lines are left out and a placeholder shows its text with no link", () => {
  assert.deepEqual(contactLines({ ...business, phone: "", email: "" }), { phone: null, email: null });
  const lines = contactLines({ ...business, phone: "[[Phone number]]", email: "[[Public email]]" });
  assert.deepEqual(lines.phone, { text: "[[Phone number]]", href: null });
  assert.deepEqual(lines.email, { text: "[[Public email]]", href: null });
  assert.deepEqual(socialLinks({ ...business, social: [] }), []);
});

test("business details: empty address lines dropped, hours grouped, note trimmed", () => {
  const view = businessDetailsView(business);
  assert.deepEqual(view.address, ["12 Main Street", "Springfield"]);
  assert.deepEqual(view.hours, [
    { days: "Monday to Thursday", time: "9 am to 5 pm" },
    { days: "Friday", time: "9 am to 3 pm" },
    { days: "Saturday and Sunday", time: "closed" },
  ]);
  assert.equal(view.hoursNote, "Closed on public holidays");
  assert.equal(view.contact.length, 2);
  const bare = businessDetailsView({ ...business, address: [], phone: "", email: "", hours: null, hoursNote: undefined });
  assert.deepEqual(bare, { address: [], contact: [], hours: [], hoursNote: null });
});

test("the notice shows only while it has text and its last day has not passed in the site's time zone", () => {
  const notice: NoticeData = { text: "Closed 24 to 26 December", endsOn: "2026-12-26" };
  assert.equal(noticeToShow(notice, "UTC", new Date("2026-12-20T12:00:00Z")), notice);
  assert.equal(noticeToShow(notice, "UTC", new Date("2026-12-26T23:30:00Z")), notice);
  assert.equal(noticeToShow(notice, "UTC", new Date("2026-12-27T00:30:00Z")), null);
  // 02:00 UTC on the 27th is still the 26th in Chicago.
  assert.equal(noticeToShow(notice, "America/Chicago", new Date("2026-12-27T02:00:00Z")), notice);
  assert.equal(noticeToShow({ text: "", endsOn: null }, "UTC", new Date()), null);
  assert.equal(noticeToShow({ text: "Always on", endsOn: null }, "UTC", new Date("2030-01-01T00:00:00Z"))?.text, "Always on");
});
