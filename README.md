# Huston Tech website

Marketing site for **Huston Tech**, a one-person business systems consultancy run by Grant Huston. Built with Next.js (App Router), strict TypeScript and Tailwind CSS, exported as a fully static site for **Cloudflare Pages**.

Permanent architecture, security and content rules are in [`AGENTS.md`](./AGENTS.md). Read it before making changes.

## Pages

| Route | Page |
|---|---|
| `/` | Home |
| `/services` | Services (Start here, Common fixes, Systems work, FAQ) |
| `/past-work` | Past Work and testimonials |
| `/about` | About Grant |
| `/insights` | Insights (polished "coming soon" placeholder in V1) |
| `/contact` | Scheduler and contact form placeholders (`?topic=partner` shows the Zoho partner variant) |
| `/contact/thanks` | Form confirmation (noindex, not linked until a form provider exists) |
| `/privacy` | Privacy policy (draft, needs review) |
| `404` | Not found |

## Develop

Requires Node 20.9+ (CI uses Node 22).

```bash
npm install
npm run dev          # http://localhost:4821
```

All copy lives in typed modules under `src/content/`. Components are in `src/components/`, routes in `src/app/`.

### Checks

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # static export to ./out
npm run check       # lint + typecheck + build
```

CI runs the same checks on every pull request (`.github/workflows/ci.yml`).

### Preview the production build

```bash
npm run build
PORT=4822 npm run preview   # http://localhost:4822
```

`scripts/preview.mjs` serves `./out` with clean URLs and `404.html`, and applies the site-wide headers from `public/_headers` (including the CSP) so header problems show up locally.

### Configuration

| Setting | Where | Notes |
|---|---|---|
| Site URL | `NEXT_PUBLIC_SITE_URL` (see `.env.example`), default `https://hustontech.com` in `src/content/site.ts` | Used for canonical URLs, Open Graph, sitemap, robots and JSON-LD. Public value, not a secret. |
| Contact email, scheduler URL, LinkedIn URL | `src/content/site.ts` | `null` renders a visible placeholder. |

## Placeholders and launch gate

Anything only Grant can supply is written as `[[double brackets]]` in `src/content/*` and renders as a highlighted marker on the page. Provider-dependent values (`email`, `schedulerUrl`, `linkedInUrl`) are `null` in `src/content/site.ts`.

```bash
npm run check:placeholders   # lists every unresolved item, exits 1 while any remain
npm run build:launch         # runs the gate, then builds
```

Normal builds (and CI) allow placeholders so the site can be previewed. **Use `npm run build:launch` as the Cloudflare build command for the real launch** (see below) so a build with unresolved placeholders cannot go live.

### Contact and scheduling are placeholders

There is intentionally **no working form and no scheduler**. `ContactFormPlaceholder` renders disabled fields (not a `<form>`, no handler) and `SchedulerPanel` renders a disabled button, both clearly marked. Every "Book a free call" button points at `/contact#book` until `siteConfig.schedulerUrl` is set, then points at the scheduler.

To wire real providers later:

1. **Scheduler** (Zoho Bookings, Calendly, Cal.com): set `schedulerUrl` in `src/content/site.ts`. If embedding in an iframe, add the provider origin to `frame-src` in `public/_headers`.
2. **Form**: choose a provider (for example a Cloudflare Pages Function with Turnstile plus an email service, or a hosted form service). Replace `ContactFormPlaceholder` with a real `<form>`, add the provider origin to `connect-src`/`form-action`/`script-src` as needed, add spam protection, and make `/contact/thanks` the redirect target.
3. **Email and LinkedIn**: set `email` and `linkedInUrl` in `site.ts`.
4. **Analytics**: none is installed. The privacy copy mentions privacy-friendly analytics, so either add a cookieless tool (and its CSP origin) or edit the privacy text.

## Deploy to Cloudflare Pages

Deployment is manual and not automated by this repo.

1. Cloudflare dashboard, Workers & Pages, Create, Pages, connect the Git repository.
2. Build settings:
   - **Framework preset:** None (or Next.js (Static HTML Export))
   - **Build command:** `npm run build` for previews, `npm run build:launch` for production once placeholders are resolved
   - **Build output directory:** `out`
   - **Root directory:** `/`
   - **Environment variables:** `NODE_VERSION=22`, `NEXT_PUBLIC_SITE_URL=https://<final domain>`
3. Add the custom domain, then confirm DNS, HTTPS and (for email) SPF, DKIM and DMARC.
4. `public/_headers` is copied into `out/` and applied by Cloudflare Pages automatically. It also adds `X-Robots-Tag: noindex` to `*.pages.dev` URLs so preview hostnames stay out of search results.

`output: "export"` means there is no Node server at runtime.

## Launch checklist

- [ ] Domain, DNS and business email working; `NEXT_PUBLIC_SITE_URL` set to the final domain
- [ ] `email`, `schedulerUrl`, `linkedInUrl` set in `src/content/site.ts`
- [ ] `npm run check:placeholders` passes (photos, screenshots, titles, location, background wording, musician line, certifications, privacy date)
- [ ] Real contact form and scheduler wired, tested end to end on desktop and phone, CSP updated
- [ ] Privacy policy checked against the tools actually used
- [ ] Screenshots supplied with names blurred (or placeholders removed)
- [ ] Submit `sitemap.xml` to Google Search Console
- [ ] Final claims check: no prices, no "Uncarved Dream", no real client data in images, no "we/our team"

## Project structure

```
src/
  app/            routes, metadata files (sitemap, robots, icon, og.png)
  components/
    ui/           buttons, cards, chips, FAQ, testimonial, placeholders
    sections/     case study, scheduler and contact-form placeholders
    layout/       header, nav, footer, mobile CTA bar
    illustrations/ decorative SVG (arrows, hero board)
  content/        typed copy and site settings (single source of truth)
  lib/            metadata, JSON-LD and text-token helpers
scripts/          placeholder gate, static preview server
public/_headers   Cloudflare Pages security and cache headers
```
