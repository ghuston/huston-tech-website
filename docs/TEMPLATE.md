# Site template: what is generic, what is per-client

This repo is the GitHub template every client site starts from. It was imported from the first client site (Huston Logic),
so that site's identity is still in `src/`, the Worker, `public/` and the pipeline docs. PR 1 (this one) made the repo
identity and top-level docs generic and wrote this plan. The code is untouched on purpose. Gates 1 to 3 (hooks, CI,
deploy) are unchanged.

Line numbers are from the commit this document was written on and will drift; re-run
`git grep -n -i "huston\|hustonlogic"` to refresh them.

## Planned PRs

| PR | Scope |
| --- | --- |
| 1 (this) | Generic identity, `docs/TEMPLATE.md`, empty input-doc skeletons |
| 2 (built) | Add `site.config.ts`, `sync:config`, `check:config`; route `src/content/site.ts`, `providers.ts` and `card.ts` through it |
| 3 | Strip Huston-only content, copy, images and brand files from `src/`, `public/`, tests |
| 4 (built) | Generic Worker (names, emails, Sheet tabs from config) and its tests; Apps Script Sheet writer as the default; `docs/SECRETS.md`; placeholders in `site.config.ts` |
| 5 (non-owner parts built) | Pipeline docs pass, `docs/ruleset-protect-main.json`, `docs/LAUNCH-CHECKLIST.md` stub. Still to do: the owner-only hand-copy (section D) and template README polish |

## A. File inventory

Legend: **G** = Generic (keep). **C** = Per-client (moves to the config file). **H** = Huston-only (strip in PR 3).

### Top level

| Path | Class | Note |
| --- | --- | --- |
| `.claude/agents/*` | G | Reviewer prompts are generic ("this site") |
| `.claude/hooks/*` | G | Gate 1 hooks |
| `.claude/settings.json` | G | |
| `.claude/skills/*` | G | `human-touch-design` reads `docs/STYLE-GUIDE.md` |
| `.env.example` | C | `NEXT_PUBLIC_SITE_URL` default domain |
| `.github/workflows/*`, `dependabot.yml` | G | Gate 2; owner-only |
| `.gitignore` | G | `.npmrc` was removed (no `engine-strict`; it broke Dependabot's npm 12) |
| `AGENTS.md`, `CLAUDE.md` | G | Names replaced by `[[...]]` in PR 1 |
| `README.md` | G | Names replaced in PR 1; Contact form section still lists per-client setup as `[[...]]` |
| `design-v3/` | H | Deleted in PR 1 |
| `docs/STYLE-GUIDE.md`, `docs/website-plan.md` | C | Empty skeletons since PR 1 |
| `docs/pipeline/*` | G | First-client names replaced with placeholders (`<owner>/<repo>`, `<worker-name>`, ...) in PR 5 |
| `eslint.config.mjs`, `tsconfig.json`, `playwright.config.ts` | G | |
| `lighthouserc.cjs` | G | Gate 2 thresholds |
| `next.config.ts` | G | |
| `package.json`, `package-lock.json` | G | Name is `site-template` |
| `public/_headers` | C | CSP origins, vcard file name (lines 13, 27-28) |
| `scripts/*` | G | `check-placeholders.mjs` also reads `providers.ts` keys |
| `tests/a11y/*` | G | |
| `wrangler.jsonc` | C | Worker name, rate-limit namespace ids |
| `worker/*` | G (values: C) | See Worker table |

### `src/content` (all copy is per-client unless noted)

| File | Class |
| --- | --- |
| `site.ts` | C (name, founder, url, one-liner, tagline, footer line); `framework`, `decisionsConfirmed` shape G |
| `providers.ts` | C (every value) |
| `home.ts`, `services.ts`, `past-work.ts`, `about.ts`, `how-i-work.ts`, `insights.ts`, `privacy.ts` | H (copy; keep the exported shapes) |
| `testimonials.ts` | H (keep the type) |
| `contact.ts`, `contact-fields.ts` | C (copy) / G (field rules shared with the Worker) |
| `auto-reply.ts` | C (signature block has name, email, domain, brand hex colors) |
| `card.ts` | H (NFC card: name, phone, vCard) |
| `nav.ts` | C |

### `src/components`, `src/lib`, `src/app`, `src/assets`

| Path | Class |
| --- | --- |
| `components/hl/*` | G, except `AboutTeaser.tsx:16` (headshot path), `SystemsCaseStudy.tsx`, `CaseStudyTeaser.tsx`, `ProofChips.tsx`, `TestimonialRow.tsx` (H content shape) |
| `components/layout/*` | G; `Logo.tsx`, `BadgeTurn.tsx` use the brand mark (C) |
| `components/illustrations/*` | H (`BrandArt.tsx` draws the Huston mark) |
| `components/ui/*` | G |
| `lib/*` | G; `fonts.ts` C; `metadata.ts:14` OG alt C; `vcard.ts` G |
| `app/(site)/*`, `app/robots.ts`, `app/sitemap.ts`, `app/not-found.tsx` | G |
| `app/layout.tsx:12` | C (default title) |
| `app/hl.css`, `app/globals.css` | G structure, C tokens (palette lines 10-22); `hl.css:482` bakery demo card H |
| `app/og.png/route.tsx` | G; colors line 11 and badge path line 15 C |
| `app/card/page.tsx`, `app/grant.vcf/route.ts`, `assets/card/grant-huston.jpg` | H (rename to a generic vcard route in PR 3 or remove) |
| `app/icon.svg`, `assets/og/Outfit-*.ttf` | C (icon) / C (OG fonts must match theme fonts) |

### `public`

| Path | Class |
| --- | --- |
| `public/brand/huston-logic-*.svg`, `grant-huston.webp` | H (replaced per client; `Marks.tsx:15-16` reads the file names) |
| `public/work/systems-1..4.webp` | H |
| `public/_headers` | C |

### `worker/`

| File | Class |
| --- | --- |
| `contact.ts`, `email.ts`, `env.ts`, `messages.ts`, `sheets.ts`, `turnstile.ts`, `tsconfig.json`, `worker-configuration.d.ts` | G logic, C values (table B) |
| `contact.test.ts` | G (builds the Worker from a fixture config with fake values; no client literal) |
| `turnstile-errors.test.ts` | G |

## B. Hard-coded client-specific values

Owner-only files are marked (owner).

| Value | Where (file:line) |
| --- | --- |
| Business name | `src/content/site.ts:4`; `src/app/layout.tsx:12`; `src/lib/metadata.ts:14`; titles in `src/content/{home:13, about:5, contact:6,91,111, how-i-work:8, insights:3, past-work:7, privacy:3, services:7}.ts`; `src/content/auto-reply.ts:27,30`; `src/content/card.ts:9,16`; `src/content/contact.ts:51`; `worker/messages.ts:32`; `worker/contact.ts:22`; `src/app/hl.css:2`; `.claude/agents/review-{a11y:12,code:12,security:10}.md` (owner) |
| Legal name | None in code. The privacy copy uses the business name (`src/content/privacy.ts:9`). Add `legalName` to config. |
| Owner / founder name | `src/content/site.ts:5,13`; `src/content/card.ts:9-16,23`; `src/content/about.ts:5,7`; `src/content/home.ts:282`; `src/content/auto-reply.ts:2,29`; `worker/contact.ts:23`; `src/app/grant.vcf/route.ts:15`; `public/_headers:28` |
| Domain / URLs | `src/content/site.ts:6`; `.env.example:2-3`; `worker/contact.ts:26` (booking fallback); `src/content/auto-reply.ts:27,32`; `worker/contact.test.ts:15,32,187,235-385` |
| Email: site address (from, notify, reply-to) | `src/content/providers.ts:7`; `worker/contact.ts:21-23` (fallback literal, From and Reply-To derive from it); `src/content/contact.ts:70`; `src/content/auto-reply.ts:27,32`; `src/content/privacy.ts` (via `providers.email`) |
| Email aliases | None in code; Workspace aliases are dashboard-side (README "Google Workspace" bullet) |
| Phone | `src/content/card.ts:19` |
| Postal address | None. Region only: `src/content/site.ts:13` ("Based in Southern California") |
| Booking link | `src/content/providers.ts:8` (Google Calendar appointment link) |
| Social links | `src/content/providers.ts:9` (LinkedIn) |
| Colors | `src/app/hl.css:10-22` (13 tokens); `src/app/og.png/route.tsx:11`; `src/content/auto-reply.ts:27` (inline hex in the email); `src/app/hl.css:482+` (bakery demo card) |
| Fonts | `src/lib/fonts.ts:5-31` (Outfit, Inter, Newsreader); `src/assets/og/Outfit-Regular.ttf`, `Outfit-SemiBold.ttf`; CSS variables `--hl-outfit`, `--font-inter`, `--font-newsreader` consumed in `globals.css` |
| Logo | `public/brand/huston-logic-{badge,full,wordmark}-black.svg`; `src/components/layout/Logo.tsx`; `src/components/hl/Marks.tsx:15-16`; `src/app/og.png/route.tsx:15`; `src/app/icon.svg`; `src/components/illustrations/BrandArt.tsx` |
| Headshot | `public/brand/grant-huston.webp`; `src/components/hl/AboutTeaser.tsx:16`; `src/assets/card/grant-huston.jpg` |
| Prices | "from $750" in `src/content/home.ts:11,15,37,142`; `src/content/services.ts:4,9,32,37,205`; `src/content/about.ts:29` |
| Sheet ID | Not in the repo (Worker secret `GOOGLE_SHEET_ID`). Tab names `Submissions` / `Preview`: `worker/contact.ts:163`; Sheet title and header row: README "Contact form" section |
| Turnstile site key | `src/content/providers.ts:11` (public by design). Widget name and hostnames: README, `docs/pipeline/contact-form.md:230` |
| Worker name | `domain.workerName` in `site.config.ts` (generated into `wrangler.jsonc`, read by `worker/config.ts`); the pipeline docs write `<worker-name>` |
| workers.dev account name | Never written literally in tracked files (docs use `<account>`); `public/_headers:36` is generic. Per-client: set in Cloudflare. |
| Rate-limit namespace ids | `wrangler.jsonc:17,24` (`1001`, `1002`; must be unique per Cloudflare account) |
| Analytics | `public/_headers:8,13` (Cloudflare Web Analytics origins in CSP); `src/content/privacy.ts:9` (copy). No token in code; it is enabled in the dashboard. |
| GitHub repo / ruleset ids | The pipeline docs write `<owner>/<repo>` and `<ruleset-id>`; the ruleset itself is `docs/ruleset-protect-main.json` (apply with `gh api -X POST repos/<owner>/<repo>/rulesets --input docs/ruleset-protect-main.json`) |
| GitHub repo settings | "Generate from template" copies files only, not repo settings. After creating a repo, turn on "Allow auto-merge" (`gh api repos/<owner>/<repo> --method PATCH -F allow_auto_merge=true`); without it `gh pr merge <n> --auto --squash` fails with "Auto merge is not allowed for this repository". Found by the smoke test (Nov 18). |
| Google Cloud project | The pipeline docs write `<gcp-project>` |

## C. `site.config.ts` (built in PR 2)

**Status.** `site.config.ts` exists at the repo root, holding the current Huston values, so the built site is
unchanged (PR 3 swaps in placeholders; PR 4 did it for the Worker's values). What is wired:

- `src/content/site.ts`, `providers.ts` and `card.ts` read it (existing imports still work); `layout.tsx` and
  `metadata.ts` build the default title and OG alt from the business name; `og.png/route.tsx` reads the colors in `brand.json`
  and `brand.badge`.
- `npm run sync:config` (`scripts/sync-config.mjs`) writes exactly four files: `wrangler.jsonc`, `public/_headers`,
  the `--hl-*` palette lines in `src/app/hl.css`, and `src/lib/fonts.ts`. With the Huston values the output is
  byte-identical to the files before PR 2.
- `npm run check:config` regenerates in memory and fails with a diff if a committed file differs. It runs first in
  `npm run check` and in `build:launch`.
- `npm run check:placeholders` (so `build:launch`) also reads `site.config.ts`: it fails on any `[[...]]` in it and on
  any empty required value, naming the key. `legalName`, `prices.website`, `csp.extra*` and `analytics` are optional.
- Held in the config but **not yet read** by anything: `contact.bookingFallbackPath` (the Worker no longer needs it: it
  refuses to send while `schedulerUrl` is `null`; the page code still uses its own `/contact#book`),
  `brand.wordmark/full/headshot`, `prices.website`. `Marks.tsx`/`AboutTeaser.tsx` (PR 3) will take the brand files.
- Read by the Worker since PR 4 (`worker/config.ts`): `business.name`, `owner.name/role`, `domain.url`, `workerName`,
  `previewHostSuffix`, `contact.siteEmail`, `fromName`, `replyFromName`, `schedulerUrl`, `sheetWriter`, `sheetTabs`, and
  `business.tagline` plus `contact.emailColors` (a copy of the brand colors, kept in `site.config.ts`) for the automatic reply's signature (`src/content/auto-reply.ts`). The rate
  limit is generated into `wrangler.jsonc`. `contact.sheetWriter` (new in PR 4, default `"apps-script"`) picks the Sheet
  writer. `contact.destination` (`"sheet"` by default, or `"pipeline"`) with it picks the `secrets.required` names, and
  `contact.pipelineUrl` is read for `"pipeline"`; see `docs/SECRETS.md`.
- Since PR 4 the first client's Worker name, sender names, email and booking link are `[[placeholders]]` or `null` in
  `site.config.ts`, so `build:launch` fails until they are filled in. The rate-limit ids (`contact.rateLimitIds`) are
  the template's `"1001"` and `"1002"` until a free pair is set; `npm run check:config` rejects those on a real site.
- The four generated files carry no "generated" banner, because they had to stay byte-identical.

Since the collections and brand run, `theme`, `brand.logo`, `owner.phone` and `contact.linkedInUrl` are no longer in `site.config.ts`. The palette, fonts and logo are in `src/content/brand.json`; the phone number, LinkedIn link and public business details are in `src/content/business.json`. The original proposal below is kept as it was written.

The original proposal follows.

One typed file at the repo root. It imports nothing, so the site, the Worker and plain Node scripts can all read it.

```ts
export const siteConfig = {
  business: { name: "", legalName: "", tagline: "", oneLiner: "", copyrightYear: 2026 },
  owner: { name: "", givenName: "", familyName: "", role: "", phone: "", regionLine: "" },
  domain: { url: "https://example.com", workerName: "", previewHostSuffix: ".workers.dev" },
  contact: {
    siteEmail: "",          // From, notify To, Reply-To
    fromName: "",           // display name for the notification
    replyFromName: "",      // display name for the automatic reply
    schedulerUrl: "",       // also feeds CSP frame-src if it is an embed
    bookingFallbackPath: "/contact#book",
    linkedInUrl: null as string | null,
    turnstileSiteKey: "",
    sheetTabs: { production: "Submissions", preview: "Preview" },
    destination: "sheet" as "sheet" | "pipeline",   // "pipeline" also needs pipelineUrl and INTAKE_SECRET
    pipelineUrl: null as string | null,
    rateLimit: { limit: 5, periodSeconds: 60 },
    rateLimitIds: { production: "", preview: "" },  // two whole-number strings, unique per site in the Cloudflare account
  },
  theme: {
    colors: { silver: "", silver2: "", white: "", ink: "", ink2: "", green: "", greenDeep: "", greenEdge: "", tint: "", glow: "", mint: "", rust: "", line: "" },
    fonts: {
      display: { family: "Outfit", weights: "variable" },
      body: { family: "Inter", weights: "variable" },
      accent: { family: "Newsreader", style: "italic" },
    },
  },
  brand: { badge: "/brand/badge.svg", wordmark: "/brand/wordmark.svg", full: "/brand/full.svg", headshot: "/brand/owner.webp" },
  prices: { website: "" },  // published price text; empty means none published
  csp: { extraScriptSrc: [] as string[], extraConnectSrc: [] as string[], extraFrameSrc: [] as string[] },
  analytics: { cloudflareWebAnalytics: true },
} as const;
```

### How each consumer reads it

| Consumer | How |
| --- | --- |
| Pages, `site.ts`, `providers.ts`, `card.ts` | Import `siteConfig` directly. `site.ts` and `providers.ts` become thin re-exports so existing imports keep working. |
| Metadata, JSON-LD, OG image, sitemap, robots | Read through `site.ts` (name, url, oneLiner). `og.png/route.tsx` reads the colors in `src/content/brand.json` and the name in `src/content/business.json`. |
| Contact Worker | Imports `site.config.ts` with an explicit `.ts` extension (allowed because the file is import-free, like `providers.ts` today). Replaces the literals in `worker/contact.ts:21-26,163` and `worker/env.ts:23,29`. |
| build:launch placeholder check | `scripts/check-placeholders.mjs` loads the config (Node 22 type stripping, or `site.config.mjs` if that is unavailable) and fails on any empty required value, replacing its regex over `providers.ts`. |
| `public/_headers`, `wrangler.jsonc`, `src/app/hl.css` tokens, `src/lib/fonts.ts` | Cannot import TS. See the decision below. |

### Decision for files that cannot import TS: generate, commit, and fail on drift

Chosen: `npm run sync:config` writes these four files from `site.config.ts`, the output is **committed**, and
`npm run check:config` (added to `npm run check`) regenerates in memory and fails with a diff if the committed file
differs. Files covered: `wrangler.jsonc` (name, rate-limit ids), `public/_headers` (CSP origins, vcard file name),
the `:root` palette block in `src/app/hl.css`, and `src/lib/fonts.ts` (`next/font/google` needs literal options at the
call site, so it cannot read config at runtime).

Why this and not build-time-only generation: Cloudflare and `wrangler types` read `wrangler.jsonc` before any build step
runs, so it must exist in git. Committed output keeps diffs reviewable in PRs and keeps Workers Builds simple (no extra
pre-build step to break). Why not a pure check with hand-edited files: it makes every client edit the same value in
five places and then fix a failing check; generation removes the mistake and the check only guards hand edits.
The generator must never write into `.claude/` or `.github/` (owner-only paths). `wrangler.jsonc` needs approval to
change, so the first generated version lands through a normal approved PR.

## D. Owner-only edits for a later hand-copy PR

These paths are blocked for Claude. For each, the owner copies the new text into place, runs
`node .claude/hooks/selftest.mjs` (last line `All N passed`), then commits.

| File | Old text | New text |
| --- | --- | --- |
| `.claude/agents/*.md` | Reviewer prompts | Done (PR #16): already say "this site" |
| `.claude/hooks/scan-src.mjs:6,12,116`, `selftest.mjs:35` | References to `docs/STYLE-GUIDE.md` §13/§14 | No change needed: the skeleton keeps those section numbers. Only revisit if the style-guide numbering changes. |
| `.github/workflows/*.yml` | No Huston strings found | None expected; re-check with `git grep -i huston .github` before PR 5 |
| `.claude/settings*.json` | No Huston strings found | None |
| `.github/workflows/ci.yml`, `check` job (hand-copy with PR 5) | Between the `Install dependencies` step and `- name: Lint`, nothing | Insert, with the same indentation as the other steps: `      - name: Check generated config` then `        run: npm run check:config`. The `check` job runs each script on its own (it does not call `npm run check`), so without this step CI never runs `check:config`. Do not rename the job. |

`wrangler.jsonc` is not owner-only; it only asks for approval on each change. Its edits are in table B.

## E. Open questions for the owner

- `AGENTS.md` still describes the Huston content rules (voice, framework, testimonials, pricing) as the template rules. PR 3 should decide which stay as defaults.
- `docs/pipeline/*` are kept as-is in this PR because they are Gate documentation; their client-specific examples were listed in table B and cleaned in PR 5.
