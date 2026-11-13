# Huston Tech website

Marketing site for **Huston Tech**, a one-person business systems consultancy run by Grant Huston. Built with Next.js (App Router), strict TypeScript and Tailwind CSS, exported as a fully static site for **Cloudflare Workers**.

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

Requires Node 22.12+ (matches `engines` in package.json; CI uses Node 22).

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

### Accessibility check (Playwright + axe)

```bash
npm run build
npx playwright install chromium   # once; downloads the browser (see Playwright's cache folder)
npm run test:a11y
```

`playwright.config.ts` starts `npm run preview` (port 4822) and scans the built site in Chromium at desktop (1280 px) and phone (375 px) width, with `prefers-reduced-motion` set. Each page is checked against axe's WCAG 2.0/2.1/2.2 level A and AA rules plus axe's best-practice rules, twice: once at the top of the page (every rule) and once scrolled to the bottom, where the mobile call bar appears and the sticky header sits over dark sections. It also scans `/services` with every FAQ open and the opened mobile menu.

One rule is skipped, in one place: `target-size` in the scrolled pass on `/services` at desktop width (added 2026-11-12). At maximum scroll the sticky header and sub-nav cover the last CTA button, so axe reports it as partly obscured, although scrolling up uncovers it. The same button is checked by every rule in the top-of-page pass. The skip and its reason are in a comment in `tests/a11y/site.a11y.spec.ts`; do not widen it. The page list comes from `src/lib/routes.ts`, the same list the sitemap uses, and a test fails if a built page is missing from it.

Automated checks find only part of the accessibility problems. Keyboard, screen reader, zoom and wording checks are still manual.

A genuine false positive may be recorded in `tests/a11y/known-issues.ts` (one rule on one selector, with a written reason). Never add an entry just to get green.

In CI this is the `a11y` job in `.github/workflows/ci.yml`. It is informational for now: it is not a required check in the "Protect main" ruleset, so a red result shows on the PR but does not block merge. On a failure the Playwright HTML report is uploaded as the `playwright-report` artifact (kept 7 days). It becomes a required check after 5 consecutive clean runs on separate PR or `main` runs, including at least one PR that changes the UI.

Clean runs so far: 0 of 5.

### Configuration

| Setting | Where | Notes |
|---|---|---|
| Site URL | `NEXT_PUBLIC_SITE_URL` (see `.env.example`), default `https://hustontech.com` in `src/content/site.ts` | Used for canonical URLs, Open Graph, sitemap, robots and JSON-LD. Public value, not a secret. |
| Contact email, scheduler URL, LinkedIn URL | `src/content/site.ts` | `null` renders a visible placeholder. |
| Framework step names, numbers, one-liners | `framework.steps` in `src/content/site.ts` | The only place "Find it / Fix it / Flick it" is defined. Content strings use `{find}`, `{fix}`, `{flick}`, `{steps}` tokens via `fw()` (`src/lib/framework.ts`). Rename a step here and every page follows. |
| Review price | `siteConfig.reviewPrice` in `src/content/site.ts` | `null` (default) keeps all prices out of the copy. A value such as `"$500"` switches the Review bar and the Services "Find it" stop-point to their with-price wording. Also update the FAQ cost answer if you publish it. |
| Hero option | `siteConfig.heroOption` in `src/content/site.ts` | `"A"` (recommended), `"B"`, `"C"` or `"D"` from the spec. Option B restores "Sound familiar?" as the problems heading. |

## Motion

Animation is CSS only (no library), driven by shared tokens in `src/app/globals.css` and rules in `src/app/motion.css`: one ease-out curve and four durations (150ms feedback, 200ms panels, 350ms intros, 400ms illustration steps). Headlines fade in with an 8px rise, button and link arrows nudge 3px on hover and keyboard focus, the mobile menu and FAQ share one open/close transition, and the homepage process diagram plays once when it scrolls into view. With `prefers-reduced-motion: reduce`, or with JavaScript off, the final static design shows immediately. See "Motion rules" in `AGENTS.md` before adding any.

## Placeholders and launch gate

Anything only Grant can supply is written as `[[double brackets]]` in `src/content/*` and renders as a highlighted marker on the page. Provider-dependent values (`email`, `schedulerUrl`, `linkedInUrl`) are `null` in `src/content/site.ts`.

```bash
npm run check:placeholders   # lists every unresolved item, exits 1 while any remain
npm run build:launch         # runs the gate, then builds
```

The gate also fails while any flag in `decisionsConfirmed` (`src/content/site.ts`) is `false`: hero option, publish the Review price, step 3 name, line-art style. Set each to `true` once Grant has confirmed the choice.

Normal builds (and CI) allow placeholders so the site can be previewed. **Use `npm run build:launch` as the Cloudflare build command for the real launch** (see below) so a build with unresolved placeholders cannot go live.

### Contact and scheduling are placeholders

There is intentionally **no working form and no scheduler**. `ContactFormPlaceholder` renders disabled fields (not a `<form>`, no handler) and `SchedulerPanel` renders a disabled button, both clearly marked. Every "Book a free call" button points at `/contact#book` until `siteConfig.schedulerUrl` is set, then points at the scheduler.

To wire real providers later:

1. **Scheduler** (Zoho Bookings, Calendly, Cal.com): set `schedulerUrl` in `src/content/site.ts`. If embedding in an iframe, add the provider origin to `frame-src` in `public/_headers`.
2. **Form**: choose a provider (for example a Cloudflare Worker with Turnstile plus an email service, or a hosted form service). Replace `ContactFormPlaceholder` with a real `<form>`, add the provider origin to `connect-src`/`form-action`/`script-src` as needed, add spam protection, and make `/contact/thanks` the redirect target.
3. **Email and LinkedIn**: set `email` and `linkedInUrl` in `site.ts`.
4. **Analytics**: none is installed. The privacy copy mentions privacy-friendly analytics, so either add a cookieless tool (and its CSP origin) or edit the privacy text.

## Deploy to Cloudflare Workers

Merging a pull request into `main` deploys the site automatically through Cloudflare Workers Builds. Other branches get preview URLs. Never run `wrangler deploy` by hand. The Worker config is `wrangler.jsonc` (static assets from `./out`).

Current settings in the Cloudflare dashboard (read by the owner on 2026-11-12, so check them if they may have changed):

- **Production branch:** `main`
- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy` (run automatically by Workers Builds)
- **Root directory:** `/`
- **Build variables:** `NODE_VERSION=22` is the only one set.

Before launch:

1. Add the build variable `NEXT_PUBLIC_SITE_URL=https://<final domain>`. It is **not set yet**, so canonical URLs, Open Graph, sitemap, robots and JSON-LD use the default in `src/content/site.ts`.
2. Change the production build command to `npm run build:launch` so a build with unresolved placeholders cannot go live.
3. Add the custom domain, then confirm DNS, HTTPS and (for email) SPF, DKIM and DMARC.

`public/_headers` is copied into `out/` and applied by Workers static assets. It also adds `X-Robots-Tag: noindex` to `*.workers.dev` (and `*.pages.dev`) URLs so preview hostnames stay out of search results.

`output: "export"` means there is no Node server at runtime.

## Launch checklist

- [ ] Domain, DNS and business email working; `NEXT_PUBLIC_SITE_URL` set to the final domain
- [ ] `email`, `schedulerUrl`, `linkedInUrl` set in `src/content/site.ts`
- [ ] `npm run check:placeholders` passes (photos, screenshots, titles, location, background wording, musician line, certifications, privacy date)
- [ ] Real contact form and scheduler wired, tested end to end on desktop and phone, CSP updated
- [ ] Privacy policy checked against the tools actually used
- [ ] Screenshots supplied with names blurred (or placeholders removed)
- [ ] Submit `sitemap.xml` to Google Search Console
- [ ] Decisions confirmed in `decisionsConfirmed`: hero option, Review price (default: none), step 3 name, geometric framework icons
- [ ] Framework wording matches everywhere: three steps (step zero is the call, not a fourth step), 20-minute call, reply within one business day, 14-day correction window, "5/5 handoff & training" and "3 of 3", 21 client accounts, Review fee credited toward the fix, the stop-point line on Home and Services
- [ ] Final claims check: no prices (unless the Review price is published), no "Uncarved Dream", no real client data in images, no "we/our team"

## Project structure

```
src/
  app/            routes, metadata files (sitemap, robots, icon, og.png)
  components/
    ui/           buttons, cards, chips, FAQ, testimonial, placeholders
    sections/     case study and phase strip, Review bar, scheduler and contact-form placeholders
    layout/       header, nav, footer, mobile CTA bar
    illustrations/ decorative SVG (hero board, framework icons and connectors)
  content/        typed copy and site settings (single source of truth)
  lib/            metadata, JSON-LD and text-token helpers
scripts/          placeholder gate, static preview server
public/_headers   Cloudflare Workers security and cache headers
```
