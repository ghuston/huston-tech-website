import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { indexableRoutes, noindexRoutes } from "../../src/lib/routes";
import { KNOWN_ISSUES } from "./known-issues";

// WCAG 2.0, 2.1 and 2.2 levels A and AA (axe tags are not cumulative), plus axe's best-practice rules
// (one <h1>, landmarks, heading order), which AGENTS.md already requires.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const NOT_FOUND_PATH = "/this-page-does-not-exist";
// Rendered differently in the browser (PartnerAwareHeading), so it is scanned as its own page.
const PARTNER_VARIANT = "/contact?topic=partner";

const pages = [...indexableRoutes, ...noindexRoutes, PARTNER_VARIANT, NOT_FOUND_PATH];

type Violation = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"][number];

function isKnown(rule: string, target: string): boolean {
  return KNOWN_ISSUES.some((k) => k.rule === rule && k.selector === target);
}

// The mobile "Book a free call" bar only mounts after the page has scrolled, so scroll to the bottom
// (and let two frames pass so React commits it) before scanning, or the bar would never be checked.
async function scrollToBottom(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        window.scrollTo(0, document.documentElement.scrollHeight);
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

async function scan(page: Page, { scroll = true } = {}) {
  if (scroll) await scrollToBottom(page);
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const matched = new Set<number>();
  const violations: Violation[] = [];
  for (const violation of results.violations) {
    const nodes = violation.nodes.filter((node) => {
      const target = node.target.join(" ");
      const index = KNOWN_ISSUES.findIndex((k) => k.rule === violation.id && k.selector === target);
      if (index >= 0) matched.add(index);
      return !isKnown(violation.id, target);
    });
    if (nodes.length > 0) violations.push({ ...violation, nodes });
  }
  return { violations, matched, needsReview: results.incomplete.length };
}

function describeViolations(violations: Violation[]): string {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    ${n.target.join(" ")}\n      ${n.html.slice(0, 120)}`)
        .join("\n");
      return `${v.id} (${v.impact}): ${v.help}\n  ${v.helpUrl}\n${nodes}`;
    })
    .join("\n\n");
}

async function expectNoViolations(page: Page, label: string, options?: { scroll?: boolean }) {
  const { violations, needsReview } = await scan(page, options);
  if (needsReview > 0) console.log(`${label}: ${needsReview} rule(s) need manual review (not failures)`);
  expect(violations, `Accessibility violations on ${label}:\n\n${describeViolations(violations)}\n`).toEqual([]);
}

for (const path of pages) {
  test(`${path} has no accessibility violations`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status(), `Unexpected HTTP status for ${path}`).toBe(path === NOT_FOUND_PATH ? 404 : 200);
    await expectNoViolations(page, path);
  });
}

test("/services has no violations with every FAQ answer open", async ({ page }) => {
  await page.goto("/services", { waitUntil: "networkidle" });
  const summaries = page.locator("details > summary");
  const count = await summaries.count();
  expect(count, "Expected FAQ <details> on /services").toBeGreaterThan(0);
  for (let i = 0; i < count; i++) await summaries.nth(i).click();
  await expect(page.locator("details[open]")).toHaveCount(count);
  await expectNoViolations(page, "/services (all FAQs open)");
});

test("the open mobile menu has no violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The menu button only exists at phone width.");
  await page.goto("/", { waitUntil: "networkidle" });
  const button = page.locator("header button[aria-expanded]");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expectNoViolations(page, "/ (mobile menu open)", { scroll: false });
});

test("known issues are still needed", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Checked once, at desktop width.");
  test.skip(KNOWN_ISSUES.length === 0, "No known issues recorded.");
  const matched = new Set<number>();
  for (const path of pages) {
    await page.goto(path, { waitUntil: "networkidle" });
    (await scan(page)).matched.forEach((i) => matched.add(i));
  }
  const stale = KNOWN_ISSUES.filter((_, i) => !matched.has(i)).map((k) => `${k.rule} on ${k.selector}`);
  expect(stale, "These entries in tests/a11y/known-issues.ts no longer match anything. Delete them.").toEqual([]);
});

test("every built page is in src/lib/routes.ts", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Checked once, at desktop width.");
  const outDir = join(process.cwd(), "out");
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "_next") continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".html")) found.push(full);
    }
  };
  walk(outDir);
  const builtRoutes = found
    .map((file) => relative(outDir, file).split(sep).join("/"))
    .filter((file) => file !== "404.html" && file !== "_not-found.html")
    .map((file) => "/" + file.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, ""))
    .map((route) => (route === "/" ? route : route.replace(/\/$/, "")));
  const listed = [...indexableRoutes, ...noindexRoutes];
  expect(
    builtRoutes.filter((route) => !listed.includes(route)).sort(),
    "These built pages are not in src/lib/routes.ts, so they would never be scanned. Add them there.",
  ).toEqual([]);
});
