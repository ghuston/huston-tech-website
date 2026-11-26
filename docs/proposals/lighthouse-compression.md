# Proposal: compress files in the Lighthouse test server, the way Cloudflare does

Status: approved by Grant on 2026-11-25 and applied (`docs/PROCESS.md` rule 17). No threshold or assertion changed.
The rest of this file is the record of why.

## The problem

The `lighthouse` CI job audits the built site through `scripts/preview.mjs`. That server sends every file uncompressed.
Cloudflare, which serves the live site, compresses HTML, CSS and JavaScript (brotli or gzip). Lighthouse simulates a slow
phone, and when a page's largest element on the first screen is a **photo**, the simulation charges the photo for every
file that started downloading before it appeared: on this site about 500 KB of scripts and 226 KB of fonts. Uncompressed,
that pushes the photo's paint to about 6 seconds and the performance score to 77 to 79, under the required 90.

Pages whose first screen is led by text are not affected (their paint only counts the files that block rendering), which
is why every page passed until now.

Which pages this hits: a blog post with a lead photo (`/blog/<slug>`, audited as the newest live post), and any page where
a `photo-text` or `gallery` block sits right under a short hero. On those, an owner's change can fail the required check
and stay unmerged, although the live site would be fast.

## Evidence (2026-11-25, Grant's Mac, `npm run test:lighthouse`, 3 runs per page, median)

| Server | `/blog/example` with a lead photo | Every other page |
| --- | --- | --- |
| Today (uncompressed) | performance 78 to 79, LCP 5.8 to 6.3 s | 98 to 100 |
| With gzip for html, css, js, json, txt, xml, svg | performance 89 to 90 (median 90), LCP 3.6 to 3.8 s | 100 |

Two other fixes were tried first and did not help: `loading="eager"` with `fetchPriority="high"` on the photo, and a
`<link rel="preload">` for it (the run keeps the preload, which Next's docs recommend for a main image).

Gzip is a conservative stand-in: Cloudflare's brotli is smaller still, so the live site does at least this well.

## The change

In `scripts/preview.mjs` (not an owner-only path, but it is the harness behind a required check), compress text files when
the browser accepts gzip:

```js
import { gzipSync } from "node:zlib";
// in the request handler, before writeHead:
const body = readFileSync(target);
const zip = /gzip/.test(req.headers["accept-encoding"] ?? "") && /\.(html|css|js|json|txt|xml|svg)$/.test(target);
// add `...(zip ? { "content-encoding": "gzip" } : {})` to the headers, and end with:
res.end(zip ? gzipSync(body) : body);
```

Plus a test in `scripts/preview.test.mjs` (or beside the existing preview tests) that a `.js` file comes back gzipped when
asked and plain when not, and that images and fonts are never re-compressed.

## Before it was decided

- The template's example post had no lead photo, so the template's own CI passed on text-led pages only.
- `docs/EDITING.md`, Known limits, said that a post with a lead photo could fail the `lighthouse` check (removed when applied).
- The 90 threshold is unchanged and must stay unchanged; the fix is the server's fidelity, not the bar.
