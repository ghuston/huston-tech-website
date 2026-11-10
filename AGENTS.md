<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Huston Tech website: permanent rules

Marketing site for Huston Tech (one-person business systems consultancy, Grant Huston). Next.js App Router, strict TypeScript, Tailwind CSS v4, **static export** deployed on **Cloudflare Pages**. Nothing here is deployed automatically. Read this file before changing the repo, and update it when a rule changes.

## Architecture

- `output: "export"` in `next.config.ts`. The site is 100% static: no API routes, no server actions, no runtime server code, no `next/image` optimization (images are `unoptimized`; ship pre-sized files). Anything needing a server must use an external provider (form, scheduler, analytics).
- `src/app/` routes only: pages, `layout.tsx`, `sitemap.ts`, `robots.ts`, `not-found.tsx`, `og.png/route.tsx`, `icon.svg`. Route files compose components and content; they hold no copy.
- `src/content/` holds **all copy and site settings** as typed TypeScript modules (`home.ts`, `services.ts`, `past-work.ts`, `about.ts`, `contact.ts`, `insights.ts`, `privacy.ts`, `testimonials.ts`, `site.ts`, `nav.ts`). Edit copy here, never inline in JSX.
- `src/components/ui/` reusable primitives (`ProcessSteps` has `compact` and `detailed` variants); `src/components/sections/` page-level compositions; `src/components/layout/` header/footer/nav; `src/components/illustrations/` decorative SVG. Prefer a new small reusable component over repeating markup. Server Components by default; add `"use client"` only for real interactivity (currently: `HeaderNav`, `MobileCtaBar`, `PartnerAwareHeading`). Keep client JS minimal.
- `src/lib/` pure helpers (`metadata.ts`, `jsonld.ts`, `placeholders.ts`).
- `scripts/` Node scripts: `check-placeholders.mjs` (launch gate), `preview.mjs` (static preview server that also applies the `/*` block of `public/_headers`).
- `public/_headers` is the Cloudflare Pages header config. `.github/workflows/ci.yml` runs the checks.
- Design tokens (colors, fonts, radii, shadows) live in `src/app/globals.css` under `@theme`. Use the tokens (`ink`, `paper`, `surface`, `line`, `muted`, `signal`, `sage`, `note`, ...); never hard-code hex values in components (the OG image route is the one exception because it cannot use CSS). Fonts are loaded only through `next/font/google` in `layout.tsx` (Fraunces display, Inter body, JetBrains Mono labels), which self-hosts them at build time. No third-party font or script tags.

## Content rules (non-negotiable)

- The authoritative source is the Huston Tech Website V1 strategy/copy doc and the launch article draft. **Preserve approved copy verbatim.** Do not paraphrase, "improve", or add claims.
- **Testimonials are authentic and render exactly as stored** in `testimonials.ts`, including "…" cuts and original punctuation. Only entries with `approved: true` render. Never edit a quote to fix punctuation. New testimonials need written approval first (record where it may appear and the date).
- **Never display pricing**, rates, or dollar amounts. The Workflow Review fee is discussed on the call. The one exception is `siteConfig.reviewPrice` in `site.ts`: it is `null` until Grant decides to publish the Review price, and only the Review bar and the Services "Find it" stop-point read it. Never hard-code a price anywhere else.
- **The Find it · Fix it · Flick it framework** is the operating model on every page. Step names, numbers and one-liners live only in `framework.steps` in `site.ts`; content strings use `fw()` tokens (`{find}`, `{fix}`, `{flick}`, `{steps}`, `{stepsList}`, `{stepsSentence}`, `{shorts}`) and never type the labels by hand. The free 20-minute call is "step zero" and is never a fourth numbered step or a list item. Case studies describe what happened in each phase but never claim a formal paid Review took place.
- Do not invent credentials, results, statistics, client names, or certifications. Do not name the former agency or its clients. Agency work is never presented as Huston Tech client work. Do not claim time savings for Irvine Family Counseling.
- Voice: first person ("I"), one person, never "we/our team/hundreds of clients". Avoid "digital transformation", "unlock", "leverage", "synergy", "AI-powered". Zoho never appears in the hero, headlines or nav. The "Huston, we have a problem" pun is used exactly twice (Contact eyebrow and 404).
- Unknowns are written as `[[double-bracket placeholders]]` inside content strings. The `Text` component renders them as highlighted, visible markers. Do not delete a placeholder to hide a gap; resolve it with the real value. `npm run check:placeholders` lists every unresolved one and fails while any remain; `npm run build:launch` runs it before building. Provider settings in `site.ts` (`email`, `schedulerUrl`, `linkedInUrl`) must also be non-null at launch, and every flag in `decisionsConfirmed` must be `true`.
- Copy is rendered as plain React text. `Text` supports only `**bold**` and `[[placeholder]]`. **Never use `dangerouslySetInnerHTML`** except in `components/ui/JsonLd.tsx`, which serializes static objects and escapes `<`. No markdown-to-HTML or user-supplied HTML.

## Security rules

- No secrets in the repo, in `NEXT_PUBLIC_*` variables, or in client code. The only env var is `NEXT_PUBLIC_SITE_URL` (public). `.env*` files are git-ignored except `.env.example`.
- `public/_headers` must keep: CSP, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, HSTS, COOP/CORP. The CSP needs `'unsafe-inline'` for scripts/styles only because the Next.js static export inlines its bootstrap scripts. Do not loosen it further. When adding a provider (scheduler iframe, form endpoint, analytics script) add only the exact origin it needs (`frame-src`, `connect-src`, `script-src`) in the same change and document it in the README.
- External links (`http(s)://`) must use `target="_blank" rel="noopener noreferrer"`. `Button` does this automatically; hand-written anchors must too.
- Contact and scheduling are **placeholders until providers are chosen**. There are deliberately no `<form>` elements, no `action`, no submit handlers, and no fake success states. Do not add a form that appears to work. When a provider is chosen, wire it through `site.ts` / `ContactFormPlaceholder` / `SchedulerPanel`, add its origin to the CSP, add spam protection (honeypot plus Turnstile or equivalent), and never ask visitors to submit sensitive data (client or health records) through the form.
- Dependencies: keep them minimal (currently only Next, React and Tailwind plus lint/type tooling). Justify any new runtime dependency in the PR. Commit `package-lock.json`; CI installs with `npm ci`.

## SEO, accessibility, performance

- Every page exports metadata via `pageMetadata()` (`src/lib/metadata.ts`) using the exact SEO title and description from the copy doc, a canonical path, Open Graph and Twitter tags. The site origin comes from the single constant `siteConfig.url` in `src/content/site.ts` (override with `NEXT_PUBLIC_SITE_URL`). New indexable routes must be added to `src/app/sitemap.ts`. `/contact/thanks` and the 404 are `noindex` and stay out of the sitemap.
- JSON-LD only states facts from the docs (name, URL, description, founder, job title). Do not add `areaServed`, addresses, ratings, reviews, prices, or social profiles until confirmed.
- One `<h1>` per page, logical heading order, landmarks (`header`, `nav` with labels, `main#main`, `footer`), skip link, visible `:focus-visible` outlines (white on dark sections via `.on-dark`), 44px minimum tap targets, descriptive link text, alt text on every meaningful image (decorative SVG is `aria-hidden`). Respect `prefers-reduced-motion` (global rule in `globals.css`). No carousels, auto-play, parallax, pop-ups or auto-rotating quotes.
- Color pairs must keep WCAG AA contrast (see tokens). Run the axe check described in the README after visual changes.
- Images: use `next/image` with explicit `width`/`height` (or `fill` with a sized parent), real `alt`, and files sized for display. Screenshots of client work must have client, patient and employee names blurred, and be labeled "Demo data" if mocked.

## Code quality

- Strict TypeScript, no `any`, no `@ts-ignore`. ESLint uses `eslint-config-next` (core-web-vitals + TypeScript). Fix warnings; do not disable rules without a comment explaining why.
- Keep it simple: small components, props typed explicitly, content passed in via props or imported from `src/content`. No state libraries, CSS-in-JS, animation libraries or component libraries. Tailwind utility classes with tokens; shared patterns become components, not copied class strings.
- Comments explain non-obvious intent only. No narrating comments.
- Commit in small logical steps with clear messages. Never commit `.next/`, `out/`, `node_modules/` or env files.

## Checks (must pass before every PR)

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # static export to ./out
npm run check       # all three, in order
npm run check:placeholders   # launch gate; expected to fail until placeholders are resolved
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck and build on every PR, verifies the deploy artifacts exist (`out/index.html`, `404.html`, `sitemap.xml`, `robots.txt`, `_headers`), and reports unresolved placeholders informationally.

## Maintenance

- Upgrading Next.js: read the bundled docs in `node_modules/next/dist/docs/` first, then re-run `npm run check`, re-test the static export (`npm run preview`) on every route, and re-verify the CSP in the browser console.
- Adding a page: content module in `src/content/`, route in `src/app/<route>/page.tsx` using `pageMetadata`, nav/footer entry if needed, sitemap entry, and a check that it renders with no console errors at mobile and desktop widths.
- Adding an Insights article: Insights is currently a "coming soon" page. The planned article format (short-version box, "Try this this week" callout, author box, CTA, related articles, `BlogPosting` JSON-LD with real published/reviewed dates) is described in the V1 copy doc; add routes, sitemap entries and a content type then. Never invent statistics; label hypothetical examples; anonymize client details.
- Launch checklist lives in the README. Do not deploy from this repo's automation; deployment is a manual Cloudflare Pages setup done by the owner.
