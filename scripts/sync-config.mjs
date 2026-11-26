// Generates the files that cannot import TypeScript:
//   from site.config.ts: wrangler.jsonc, public/_headers;
//   from src/content/brand.json: the palette src/app/palette.css and the fonts module src/lib/fonts.ts;
//   from src/content/forms/*.json: the registry the Worker bundles, src/forms/registry.generated.ts.
// `node scripts/sync-config.mjs` writes them; `--check` regenerates in memory and exits 1 with a diff if a committed
// file differs. It never writes anywhere else (never .claude/ or .github/).
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { brandFiles, configProblems, driftedFiles, extraHeaderText, wranglerText } from "./config-rules.mjs";

const root = new URL("..", import.meta.url).pathname;
const { siteConfig: c } = await import(pathToFileURL(join(root, "site.config.ts")).href);

// The video sites the video blocks may embed (the single allowlist in src/blocks/embeds.ts).
const { embedOrigins } = await import(pathToFileURL(join(root, "src/blocks/embeds.ts")).href);

const { registrySource, REGISTRY_PATH } = await import(pathToFileURL(join(root, "src/forms/registry.ts")).href);

const unique = (list) => [...new Set(list)];

// The checks on site.config.ts and the secret names (by destination, docs/SECRETS.md) live in config-rules.mjs.
const problems = configProblems(c);
if (problems.length > 0) {
  console.error(`\nConfig check failed: site.config.ts has ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("");
  process.exit(1);
}

const wrangler = () => wranglerText(c);

function headers() {
  const insights = c.analytics.cloudflareWebAnalytics;
  const script = unique([
    "'self'",
    "'unsafe-inline'",
    "https://challenges.cloudflare.com",
    ...(insights ? ["https://static.cloudflareinsights.com"] : []),
    ...c.csp.extraScriptSrc,
  ]);
  const connect = unique(["'self'", ...(insights ? ["https://cloudflareinsights.com"] : []), ...c.csp.extraConnectSrc]);
  const frame = unique(["https://challenges.cloudflare.com", ...embedOrigins, ...c.csp.extraFrameSrc]);
  const autoplay = `autoplay=(${embedOrigins.map((origin) => `"${origin}"`).join(" ")})`;
  const csp = [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connect.join(" ")}`,
    `frame-src ${frame.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  return `# Cloudflare response headers (Pages and Workers static assets).
# https://developers.cloudflare.com/pages/configuration/headers/
# https://developers.cloudflare.com/workers/static-assets/headers/
# Next.js static export emits inline bootstrap scripts, so script-src needs 'unsafe-inline'.
# Tighten (hashes or nonces) if the hosting setup ever allows it. Update frame-src/script-src/connect-src
# when a scheduler or form provider is added.
# https://challenges.cloudflare.com (script-src, frame-src): Cloudflare Turnstile on the contact form.
# https://static.cloudflareinsights.com (script-src) and https://cloudflareinsights.com (connect-src): Cloudflare Web Analytics.
# ${embedOrigins.join(", ")} (frame-src, and autoplay in Permissions-Policy): the video and audio blocks
# swap in a player from these sites when a visitor presses play; the list is embedOrigins in src/blocks/embeds.ts.
# The form posts to the same-origin Worker (/api/contact), so form-action stays 'self'.
# These headers apply to static files only; the Worker sets its own headers on /api/* responses.

/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), ${autoplay}, camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains

# PDFs in public/files/ always download and never run on the site's origin (docs/CHANGE-SCOPE.md, "PDF rules").
/files/*
  Content-Disposition: attachment
  Content-Security-Policy: sandbox
  X-Content-Type-Options: nosniff

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
${extraHeaderText(c.extraHeaderBlocks)}
# Keep Cloudflare preview/production *.pages.dev URLs out of search results.
https://:project.pages.dev/*
  X-Robots-Tag: noindex

# Same for *.workers.dev worker and preview URLs.
https://:version.:subdomain.workers.dev/*
  X-Robots-Tag: noindex
`;
}

let brand;
try {
  brand = JSON.parse(readFileSync(join(root, "src/content/brand.json"), "utf8"));
} catch (error) {
  console.error(`\nConfig check failed: src/content/brand.json cannot be read: ${error.message}\n`);
  process.exit(1);
}
let fromBrand;
try {
  fromBrand = brandFiles(brand, { preloadAccent: c.preloadAccentFont === true });
} catch (error) {
  console.error(`\nConfig check failed: src/content/brand.json: ${error.message}\n`);
  process.exit(1);
}

// One registry entry per form file, archived forms included (the Worker refuses them by status).
const formsDir = join(root, "src/content/forms");
const formIds = existsSync(formsDir) ? readdirSync(formsDir).filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -".json".length)) : [];

const generated = {
  "wrangler.jsonc": wrangler(),
  "public/_headers": headers(),
  ...fromBrand,
  [REGISTRY_PATH]: registrySource(formIds),
};

if (process.argv.includes("--check")) {
  const drifted = driftedFiles(generated, (path) => (existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : null));
  if (drifted.length > 0) {
    console.error(`\nConfig check failed: ${drifted.length} generated file(s) differ from site.config.ts, src/content/brand.json or src/content/forms/\n`);
    console.error(drifted.join("\n\n"));
    console.error("\nRun `npm run sync:config` and commit the result.\n");
    process.exit(1);
  }
  console.log("Config check passed: generated files match site.config.ts, src/content/brand.json and src/content/forms/.");
} else {
  for (const [path, content] of Object.entries(generated)) {
    const file = join(root, path);
    if (!existsSync(file) || readFileSync(file, "utf8") !== content) {
      writeFileSync(file, content);
      console.log(`wrote ${path}`);
    } else {
      console.log(`unchanged ${path}`);
    }
  }
}
