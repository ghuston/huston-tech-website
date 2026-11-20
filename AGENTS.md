<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Huston Logic website: permanent rules

Marketing site for Huston Logic (one-person consultancy for custom websites and workflows, Grant Huston). Next.js App Router, strict TypeScript, Tailwind CSS v4, **static export** deployed on **Cloudflare Workers**. Merging a pull request into `main` deploys automatically through Cloudflare Workers Builds; other branches get preview URLs. Never run `wrangler deploy` by hand. Read this file before changing the repo, and update it when a rule changes.

## Sources of truth

- **Copy:** `docs/website-rev8.md` (Revision 8, Nov 20, 2026) is the single source of new copy. It is a set of changes on top of the copy already in `src/content/`; anything it doesn't mention stays as it is. `docs/website-plan.md` (Revision 7.1) is history: it explains the base copy but no longer overrides it. Preserve copy verbatim.
- **Design:** `docs/STYLE-GUIDE.md` (style guide v3, with the Revision 8 motion amendment in §9), then the Revision 8 Home mockups in `design-v3/reference/rev8/` (layout, order and spacing at 390 and 1440 wide; build with this repo's components and tokens, never their inline styles) and the v3 first screen in `design-v3/reference/home-top.html`. The logo files are in `public/brand/`; never redraw the mark. Where this file and those two disagree on copy or design, they win.
- **Pricing:** no price anywhere on the site (Revision 8). Prices are discussed in person.
- **Contact form:** `src/components/hl/ContactForm.tsx` posts JSON to the contact Worker (`POST /api/contact`, `worker/contact.ts`, website-plan E6), which verifies Turnstile, appends a row to Grant's Google Sheet, emails Grant and sends the B7b automatic reply. The form shows success (by moving to `/contact/thanks`) only when the Worker says the note reached Grant; there is no fake success state, and answers never go in the URL (the thanks page gets the first name from `sessionStorage`). Without JavaScript nothing is sent (no `action`, `method="post"`). See the README's "Contact form" section.

## Architecture

- `output: "export"` in `next.config.ts`. The Next.js site is 100% static: no API routes, no server actions, no runtime server code, no `next/image` optimization (images are `unoptimized`; ship pre-sized files). Server-side needs go to an external provider (scheduler, analytics) or, for the contact form, the Worker.
- `worker/` is the only server code: the contact Worker, run by `wrangler.jsonc` for `/api/*` only (`run_worker_first`), with its own `tsconfig.json`, generated runtime types (`npx wrangler types worker/worker-configuration.d.ts`; regenerate after changing `wrangler.jsonc`) and tests on Node's built-in runner (`worker/*.test.ts`, mocked `fetch`, never real mail or data). It uses no libraries: Web Crypto for the Google JWT, `fetch` for Turnstile, Resend and Sheets. It may import only import-free modules from `src/` (`content/contact-fields.ts`, `content/auto-reply.ts`, `content/providers.ts`, `lib/contact-validation.ts`, `lib/first-name.ts`), with explicit `.ts` extensions, so the form and the Worker share one set of rules. Never import `site.ts` there (it reads `process.env`). The notification email is plain text only; the automatic reply is the one HTML email, a fixed template in which the only visitor input is the escaped first name, and its logs hold fixed event names and status codes, never personal data or secrets.
- `src/app/` routes only: pages, `layout.tsx`, `sitemap.ts`, `robots.ts`, `not-found.tsx`, `og.png/route.tsx`, `grant.vcf/route.ts`, `icon.svg`. Route files compose components and content; they hold no copy. Every site page lives in the `(site)` route group, whose layout adds the header, `main#main` and footer (`SiteChrome`; the 404 wraps itself in it too). `/card` (the NFC business card, copy in `card.ts`) sits outside the group: no site nav, noindex, not in the sitemap, and it links to the build-time contact file `/grant.vcf` (headers in `public/_headers`).
- `src/content/` holds **all copy and site settings** as typed TypeScript modules (`home.ts`, `systems.ts`, `services.ts`, `past-work.ts`, `about.ts`, `contact.ts`, `contact-fields.ts`, `auto-reply.ts`, `insights.ts`, `privacy.ts`, `testimonials.ts`, `site.ts`, `providers.ts`, `nav.ts`, `card.ts`). Edit copy here, never inline in JSX. Provider settings (`email`, `schedulerUrl`, `linkedInUrl`, `turnstileSiteKey`) live in `providers.ts`; `site.ts` re-exports them.
- `src/components/hl/` the v3 design primitives and page sections; `src/components/layout/` header, footer, nav and the badge turn; `src/components/ui/` copy helpers (`Text`, `Placeholder`, `JsonLd`, `InViewOnce`, `BookCallButton`); `src/components/illustrations/` decorative SVG. Prefer a new small reusable component over repeating markup. Server Components by default; add `"use client"` only for real interactivity (currently: `HeaderNav`, `BadgeTurn`, `InViewOnce`, `PointerTilt`, `SectionNav`, `ContactForm`, `ThanksText`). Keep client JS minimal.
- `src/lib/` pure helpers (`metadata.ts`, `jsonld.ts`, `placeholders.ts`, `fonts.ts`, `framework.ts`, `routes.ts`, `vcard.ts`, `contact-validation.ts`, `first-name.ts`, `contact-handoff.ts`).
- `scripts/` Node scripts: `check-placeholders.mjs` (launch gate), `preview.mjs` (static preview server that also applies the `/*` block of `public/_headers`).
- `tests/a11y/` Playwright + axe accessibility check (CI job `a11y`, run against the built site via `scripts/preview.mjs`); `playwright.config.ts`. `src/lib/routes.ts` is the single route list used by `sitemap.ts` and the accessibility test.
- `lighthouserc.cjs` Lighthouse CI config (CI job `lighthouse`; pages come from `src/lib/routes.ts`); `scripts/lighthouse-summary.mjs` writes the score table to the job summary.
- `public/_headers` is the Cloudflare Workers header config. `.github/workflows/ci.yml` runs the checks.
- Design tokens (colors, type scale, radii, shadows) are defined once: the palette and Tailwind theme in `src/app/hl.css`, the base layer (body, headings, focus ring) in `src/app/globals.css`. Use the tokens (`ink`, `silver`, `green`, `rust`, `tint`, `hairline`, ...); never hard-code hex values in components (the OG image route is the one exception because it cannot use CSS). Fonts (Outfit for headings and UI, Inter for body, Newsreader italic for the second voice; no others) are declared only in `src/lib/fonts.ts` through `next/font/google`, which self-hosts them at build time. No third-party font or script tags, with one exception: Cloudflare Turnstile (`https://challenges.cloudflare.com`), which `src/components/hl/useTurnstile.ts` loads only after the visitor focuses the contact form.

## Content rules (non-negotiable)

- The authoritative source is `docs/website-rev8.md` (Revision 8) on top of the copy already in `src/content/`, and the launch article draft. **Preserve approved copy verbatim.** Do not paraphrase, "improve", or add claims.
- **Testimonials are authentic and render exactly as stored** in `testimonials.ts`, including "…" cuts and original punctuation. Only entries with `approved: true` render. Never edit a quote to fix punctuation. New testimonials need written approval first (record where it may appear and the date).
- **Pricing:** no price, rate or dollar amount anywhere on the site or in structured data (Revision 8). The two offers are Accelerated Websites and AI-Centric System Redesign (`offers` in `site.ts`); the Workflow Review and the Zoho specialty are no longer offers.
- **Revision 8 wording rules:** never name an AI app ("your AI app", "by talking"); name no industry as a target market (client names and industries stay on testimonials and case studies, as facts); nothing may suggest the talking system is for health or other protected records. The Section A wording sweep in `docs/website-rev8.md` must return nothing in `src/` and `worker/`.
- **The Scope it · Shape it · Ship it framework** (Revision 7.1, kept in Revision 8) is the operating model on every page; the case-study strip reads Scoped / Shaped / Shipped. Step names, numbers and one-liners live only in `framework.steps` in `site.ts`; content strings use `fw()` tokens (`{scope}`, `{shape}`, `{ship}`, `{steps}`, `{stepsList}`, `{stepsSentence}`) and never type the labels by hand. The free 20-minute call is "step zero" and is never a fourth numbered step or a list item. Case studies describe what happened in each phase but never claim a formal paid Review took place.
- Do not invent credentials, results, statistics, client names, or certifications. Do not name the former agency or its clients. Agency work is never presented as Huston Logic client work. Do not claim time savings for Irvine Family Counseling.
- Voice: first person ("I"), one person, never "we/our team/hundreds of clients". Avoid "digital transformation", "unlock", "leverage", "synergy", "AI-powered". Zoho never appears in the hero, headlines or nav. The "Huston, we have a problem" pun is used exactly twice (Contact eyebrow and 404).
- Unknowns are written as `[[double-bracket placeholders]]` inside content strings. The `Text` component renders them as highlighted, visible markers. Do not delete a placeholder to hide a gap; resolve it with the real value. `npm run check:placeholders` lists every unresolved one and fails while any remain; `npm run build:launch` runs it before building. Provider settings in `site.ts` (`email`, `schedulerUrl`, `linkedInUrl`) must also be non-null at launch, and every flag in `decisionsConfirmed` must be `true`.
- Copy is rendered as plain React text. `Text` supports only `**bold**` and `[[placeholder]]`. **Never use `dangerouslySetInnerHTML`** except in `components/ui/JsonLd.tsx`, which serializes static objects and escapes `<`. No markdown-to-HTML or user-supplied HTML.

## Security rules

- No secrets in the repo, in `NEXT_PUBLIC_*` variables, or in client code. The only env var is `NEXT_PUBLIC_SITE_URL` (public). `.env*` files are git-ignored except `.env.example`.
- `public/_headers` must keep: CSP, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, HSTS, COOP/CORP. The CSP needs `'unsafe-inline'` for scripts/styles only because the Next.js static export inlines its bootstrap scripts. Do not loosen it further. When adding a provider (scheduler iframe, form endpoint, analytics script) add only the exact origin it needs (`frame-src`, `connect-src`, `script-src`) in the same change and document it in the README.
- External links (`http(s)://`) must use `target="_blank" rel="noopener noreferrer"`. `Button` does this automatically; hand-written anchors must too.
- **Contact form Worker.** Secrets (`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_SHEET_ID`) exist only as Worker secrets that Grant sets himself (`wrangler secret put`, and `wrangler preview base-config secret put` for previews); `wrangler.jsonc` lists names only. Keep every layer: same-origin check, size limit, rate limit, honeypot (an honest error, never a pretend success), the shared validation, server-side Turnstile with hostname and action checks, RAW Sheet input with the formula guard, a plain-text notification, and an automatic reply whose HTML is a fixed template (the escaped first name is the only visitor input; the booking link comes from `providers.schedulerUrl`, never the request origin). Preview mode must never email anyone but the site's own address or write to the `Submissions` tab. Never ask visitors to submit sensitive data (client or health records) through the form.
- Scheduling is a **placeholder until a provider is chosen**: set `schedulerUrl` in `providers.ts` and add its origin to the CSP.
- Dependencies: keep them minimal. Runtime dependencies are only Next, React and React DOM; justify any new one in the PR. Dev-only tooling (Tailwind, ESLint, TypeScript, Wrangler, and `@playwright/test` + `@axe-core/playwright` for the accessibility check, and `@lhci/cli` for Lighthouse) never ships in the site bundle. Install `@playwright/test` only; never also `playwright` (one Playwright version). Tooling added from now on is exact-pinned (no `^`) and must be at least 7 days old when added. `package.json` `overrides` pins `playwright-core` and `basic-ftp`; remove an override when the upstream package no longer needs it. Commit `package-lock.json`; CI installs with `npm ci` under npm 10 (`engines.npm` plus `engine-strict` in `.npmrc`; generate lockfile changes with npm 10, see CLAUDE.md).
- CI runs two security scans, both enforced by the "Protect main" ruleset: `dependency-review` (pull requests; a required status check; fails on a newly added dependency with a known vulnerability, dev dependencies included) and `codeql` (pull requests, pushes to `main`, weekly; JavaScript/TypeScript, no build; enforced through the "Require code scanning results" rule). Both are SHA-pinned and declare minimal `permissions`.

## SEO, accessibility, performance

- Every page exports metadata via `pageMetadata()` (`src/lib/metadata.ts`) using the exact SEO title and description from the copy doc, a canonical path, Open Graph and Twitter tags. The site origin comes from the single constant `siteConfig.url` in `src/content/site.ts` (override with `NEXT_PUBLIC_SITE_URL`). New indexable routes must be added to `src/app/sitemap.ts`. `/contact/thanks` and the 404 are `noindex` and stay out of the sitemap.
- JSON-LD only states facts from the docs (name, URL, description, founder, job title). Do not add `areaServed`, addresses, ratings, reviews, prices, or social profiles until confirmed.
- One `<h1>` per page, logical heading order, landmarks (`header`, `nav` with labels, `main#main`, `footer`), skip link, visible `:focus-visible` outlines (a rust ring), 44px minimum tap targets, descriptive link text, alt text on every meaningful image (decorative SVG is `aria-hidden`). Respect `prefers-reduced-motion` (see Motion rules). No carousels, auto-play, parallax, pop-ups or auto-rotating quotes.
- Color pairs must keep WCAG AA contrast (see tokens). Sticky or translucent bars over page content use at least a `/95` background so text keeps AA contrast over dark sections. Run the axe check described in the README after visual changes.
- Images: use `next/image` with explicit `width`/`height` (or `fill` with a sized parent), real `alt`, and files sized for display. Screenshots of client work must have client, patient and employee names blurred, and be labeled "Demo data" if mocked.

## Code quality

- Strict TypeScript, no `any`, no `@ts-ignore`. ESLint uses `eslint-config-next` (core-web-vitals + TypeScript). Fix warnings; do not disable rules without a comment explaining why.
- Keep it simple: small components, props typed explicitly, content passed in via props or imported from `src/content`. No state libraries, CSS-in-JS, animation libraries or component libraries. Tailwind utility classes with tokens; shared patterns become components, not copied class strings.
- Comments explain non-obvious intent only. No narrating comments.
- Commit in small logical steps with clear messages. Never commit `.next/`, `out/`, `node_modules/` or env files.

## Motion rules

The motion design is `docs/STYLE-GUIDE.md` §9. The rules below are the guardrails. The static design is always the resting state: every animation must end exactly in it, and removing a rule must never change how a page looks.

- **Where it lives.** Keyframes, the door, tilt and menu-panel (`.panel`) rules and the "Revision 8 section motion (§9.4)" block are in `src/app/hl.css`; the shared timing tokens (`--ease-site`, `--duration-feedback`, `--duration-panel`) are in `src/app/globals.css`, and Tailwind's default transition uses them, so a plain `transition-colors` is already compliant. Add new motion by extending these, not per page.
- **One moment per section, played once (Revision 8, STYLE-GUIDE §9.4).** Each section may have one orchestrated moment, released once by `InViewOnce` (or page load for the hero), and it must show something happening in the product or the process, never decoration. No loops. The framework icons are static.
- **Never hide content behind motion.** Body copy, actions and links are in the initial HTML. Headline and hero intros are CSS keyframes with `both`/`backwards` fill, so they need no JS. A section moment may hold its elements at a start frame (bubbles or chips at opacity 0, say) only behind both the `html.js` class (set by an inline script in `<head>` before first paint) and `prefers-reduced-motion: no-preference`, released by `InViewOnce`; without JS, or with reduced motion, everything shows.
- **Reduced motion.** `prefers-reduced-motion: reduce` sets `animation: none` and `transition: none` globally (end of `hl.css`), so the end state shows immediately, and the badge turn and door swing are switched off. Any new animation must be safe under that rule (no state that only a running animation reveals).
- **Scrolling stays native.** The only scroll listener is the passive one in `BadgeTurn` (STYLE-GUIDE §9.3, off under reduced motion). No scroll hijacking, scroll-linked effects or wheel/touch listeners; use `IntersectionObserver` (via `InViewOnce`) for reveal-on-view.
- **No motion libraries.** CSS transitions and keyframes only.

## Checks (must pass before every PR)

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit (site), then tsc --noEmit -p worker
npm run test:worker # contact Worker tests (node --test, no network)
npm run build       # static export to ./out
npm run check       # lint, typecheck, test:worker, build, in order
npm run check:placeholders   # launch gate; expected to fail until placeholders are resolved
npm run test:a11y   # Playwright + axe; needs `npm run build` first and an installed Chromium; not part of `npm run check`
npm run test:lighthouse   # Lighthouse CI; needs `npm run build` first and Google Chrome; not part of `npm run check`
```

CI job `a11y` runs `test:a11y` on every PR. It is a required check: a failure blocks merging.

CI job `lighthouse` runs `test:lighthouse` on every PR. It is a required check: a failure blocks merging.

- `check`, `a11y`, `lighthouse` and `dependency-review` are required checks in the "Protect main" ruleset, and the "Require code scanning results" rule (CodeQL) also blocks merging on new alerts. Never rename or remove those jobs, add a `paths:` filter or job-level `if:` to them, use `[skip ci]`, or change `.github/workflows/codeql.yml`'s languages or category; change the ruleset first (see CLAUDE.md).
- Fix a failing `a11y` or `lighthouse` job at its cause. Do not loosen a threshold or add a `known-issues.ts` entry just to get green.
- `.github/workflows/**`, `.claude/hooks/**`, `.claude/agents/**`, `.claude/skills/**` and `.claude/settings*.json` are owner-edited: Claude's hooks block changes to them, so a workflow or hook change is written to the scratchpad and copied into place by the owner (see CLAUDE.md and `.claude/hooks/README.md`).

CI (`.github/workflows/ci.yml`) runs `check` (lint, typecheck, build, a check that the deploy artifacts exist: `out/index.html`, `404.html`, `sitemap.xml`, `robots.txt`, `_headers`, and an informational placeholder report), plus `a11y` and `lighthouse`, on every PR.

## Maintenance

- Upgrading Next.js: read the bundled docs in `node_modules/next/dist/docs/` first, then re-run `npm run check`, re-test the static export (`npm run preview`) on every route, and re-verify the CSP in the browser console.
- Adding a page: content module in `src/content/`, route in `src/app/<route>/page.tsx` using `pageMetadata`, nav/footer entry if needed, add the route to `src/lib/routes.ts` (feeds the sitemap and the accessibility check), and a check that it renders with no console errors at mobile and desktop widths.
- Adding an Insights article: Insights is currently a "coming soon" page. The planned article format (short-version box, "Try this this week" callout, author box, CTA, related articles, `BlogPosting` JSON-LD with real published/reviewed dates) is described in the V1 copy doc; add routes, sitemap entries and a content type then. Never invent statistics; label hypothetical examples; anonymize client details.
- Launch checklist lives in the README. Every merge into `main` is a production deploy through Cloudflare Workers Builds (settings in the README's "Deploy to Cloudflare Workers" section); never run `wrangler deploy` by hand, and the owner merges.
