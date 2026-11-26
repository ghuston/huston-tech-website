// Lighthouse CI config (run with `npm run test:lighthouse`, after `npm run build`). LHCI reads .cjs, not .mjs or .ts.
// It audits the exported site in ./out, served by scripts/preview.mjs so the headers in public/_headers (CSP) apply.

// LHCI config files must be CommonJS. Node >= 22.18 loads the TypeScript route list natively; keep src/lib/routes.ts
// free of imports and TypeScript-only syntax so this keeps working.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { auditRoutes } = require("./src/lib/routes.ts");

const origin = "http://localhost:4822";

module.exports = {
  ci: {
    collect: {
      // The audited pages only (the pages, and the newest post and blog page 2 once there is a blog): a noindex page, the /blocks showcase included, cannot pass the SEO "is crawlable" audit and the 404 page returns an error status.
      url: auditRoutes.map((route) => origin + route),
      numberOfRuns: 3,
      startServerCommand: "npm run preview",
      // preview.mjs prints "Previewing ./out at ..."; the default pattern ("listen|ready") would never match.
      startServerReadyPattern: "Previewing",
      startServerReadyTimeout: 20000,
      settings: {
        // Default preset is mobile. --no-sandbox: Chrome's sandbox can fail on CI runners (see the LHCI troubleshooting
        // guide); the runner is an ephemeral VM that only loads this site from localhost.
        chromeFlags: "--no-sandbox",
      },
    },
    assert: {
      // median of the 3 runs; LHCI's default ("optimistic") would pass if any single run passed.
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.95, aggregationMethod: "median" }],
        "categories:best-practices": ["error", { minScore: 0.9, aggregationMethod: "median" }],
        "categories:seo": ["error", { minScore: 0.95, aggregationMethod: "median" }],
        "categories:performance": ["error", { minScore: 0.9, aggregationMethod: "median" }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
