import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

// The accessibility check scans the exported site in ./out, served by scripts/preview.mjs
// (clean URLs, 404.html and the site-wide headers from public/_headers, including the CSP).
if (!existsSync("out/index.html")) {
  throw new Error("No build found. Run `npm run build` before `npm run test:a11y`.");
}

const baseURL = "http://localhost:4822";

export default defineConfig({
  testDir: "tests/a11y",
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  globalTimeout: 5 * 60 * 1000,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    // Animations end in the static design under reduced motion, so scans never catch a half-faded colour.
    reducedMotion: "reduce",
  },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1280, height: 720 } } },
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 375, height: 812 }, hasTouch: true } },
  ],
  webServer: {
    command: "npm run preview",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stderr: "pipe",
  },
});
