// Tiny static server for the exported site in ./out (mimics Cloudflare Pages clean URLs + 404.html).
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const outDir = new URL("../out", import.meta.url).pathname;
const port = Number(process.env.PORT ?? 4822);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

// Apply the site-wide `/*` block of _headers so CSP problems show up locally, not only on Cloudflare.
function loadGlobalHeaders() {
  const file = join(outDir, "_headers");
  if (!existsSync(file)) return {};
  const headers = {};
  let inGlobalBlock = false;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (line.startsWith("#") || line.trim() === "") continue;
    if (!line.startsWith(" ")) {
      inGlobalBlock = line.trim() === "/*";
      continue;
    }
    if (!inGlobalBlock) continue;
    const idx = line.indexOf(":");
    headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return headers;
}

const globalHeaders = loadGlobalHeaders();

function resolveFile(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidates = [safe, `${safe}.html`, join(safe, "index.html")];
  for (const c of candidates) {
    const full = join(outDir, c);
    if (full.startsWith(outDir) && existsSync(full) && statSync(full).isFile()) return full;
  }
  return null;
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  const file = resolveFile(pathname);
  const status = file ? 200 : 404;
  const target = file ?? join(outDir, "404.html");
  if (!existsSync(target)) {
    res.writeHead(500).end("Run `npm run build` first.");
    return;
  }
  res.writeHead(status, { ...globalHeaders, "content-type": types[extname(target)] ?? "application/octet-stream" });
  res.end(readFileSync(target));
}).listen(port, () => console.log(`Previewing ./out at http://localhost:${port}`));
