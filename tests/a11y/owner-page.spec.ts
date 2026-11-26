import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { siteConfig } from "../../site.config";
import { renderConfirm, renderConsent, renderMessage, renderOwnerHome, renderRemoveConfirm, type PageBase, type UploadsSection } from "../../worker/editor/owner-page";

// Same tag set as site.a11y.spec.ts.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const base: PageBase = { siteName: "Example Co", siteUrl: "https://example.test", email: "owner@example.test", theme: siteConfig.editor.pageColors };
const proposal = {
  id: "p1",
  summary: "Update the opening hours",
  createdAt: "2026-01-01T12:00:00.000Z",
  changeList: "Page /about\n- Changes the heading to: Open Monday to Friday\n- Adds a block: a call to action with a very long unbroken value https://example.test/some/very/long/address/that/keeps/going/and/going",
  previewLink: "https://change-owner-p1-example.acct.workers.dev",
  uploads: [],
};

const limits = { photoBytes: 20_000_000, pdfBytes: 10_000_000, expireDays: 30 };
const uploadItems: UploadsSection["items"] = [
  { id: "up000003", name: "Price sheet with a very long name that keeps going and going without any breaks at all", kind: "pdf", bytes: 240_000, pages: 3, uploadedAt: "2026-01-01T11:00:00.000Z", expiresAt: "2026-01-31T11:00:00.000Z", onSite: false },
  { id: "up000002", name: "Shop front", kind: "photo", bytes: 180_000, width: 1600, height: 1200, uploadedAt: "2026-01-01T10:00:00.000Z", expiresAt: "2026-01-31T10:00:00.000Z", onSite: true },
  { id: "up000001", name: "Team at the counter", kind: "photo", bytes: 150_000, width: 1200, height: 1600, uploadedAt: "2026-01-01T09:00:00.000Z", expiresAt: "2026-01-02T09:00:00.000Z", onSite: false },
];
const uploads: UploadsSection = { items: uploadItems, limits, now: "2026-01-01T12:00:00.000Z" };

const states: Record<string, string> = {
  "home with items": renderOwnerHome({
    ...base,
    proposals: [proposal, { ...proposal, id: "p2", summary: "Add a new service" }],
    changes: [
      { change: 14, title: "Update the opening hours", state: "live", publishedAt: "2026-01-01T10:00:00.000Z", liveAt: "2026-01-01T10:05:00.000Z" },
      { change: 13, title: "Fix a typo", state: "stuck", publishedAt: "2026-01-01T09:00:00.000Z", failedChecks: ["check"] },
      { change: 12, title: "Rejected idea", state: "stopped", publishedAt: "2025-12-30T09:00:00.000Z" },
    ],
  }),
  "home with uploads": renderOwnerHome({ ...base, proposals: [proposal], changes: [], uploads }),
  "home with upload results": renderOwnerHome({
    ...base,
    proposals: [],
    changes: [],
    uploads: { ...uploads, results: [{ name: "Shop front.jpg", ok: true, message: "Added \"Shop front\"." }, { name: "Holiday.mp4", ok: false, message: "Videos can't be uploaded here. Put the video on YouTube or Vimeo, then ask your AI app to add it with its link." }] },
  }),
  "home with no uploads": renderOwnerHome({ ...base, proposals: [], changes: [], uploads: { items: [], limits, now: uploads.now } }),
  "home uploads unavailable": renderOwnerHome({ ...base, proposals: [], changes: [], uploads: { items: null, limits, now: uploads.now } }),
  "confirm with uploads": renderConfirm({ ...base, proposal: { ...proposal, uploads: [{ id: "up000002", name: "Shop front", kind: "photo" }, { id: "up000003", name: "Price sheet", kind: "pdf" }] } }),
  "remove confirm": renderRemoveConfirm({ ...base, upload: uploadItems[1] }),
  "home empty": renderOwnerHome({ ...base, proposals: [], changes: [] }),
  "home unavailable": renderOwnerHome({ ...base, proposals: null, changes: null }),
  confirm: renderConfirm({ ...base, proposal }),
  consent: renderConsent({ ...base, handle: "h", clientName: "Claude", redirectHost: "claude.ai", redirectIsLoopback: false }),
  "consent loopback": renderConsent({ ...base, handle: "h", clientName: "A local app", clientDomain: "app.example.test", redirectHost: "127.0.0.1", redirectIsLoopback: true }),
  message: renderMessage({ ...base, title: "Published", body: "Change 15 was opened.\nIt is not live yet." }),
};

const sizes = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const [state, html] of Object.entries(states)) {
  for (const size of sizes) {
    test(`owner page, ${state}, ${size.name}: no axe violations and no sideways scroll`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.setContent(html);
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(fits).toBe(true);
    });
  }
}
