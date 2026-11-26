# Catch up to the template (process run, 2026-11-25)

One branch, `chore/catch-up-to-template`, one PR, at least one commit per step. Nothing merged, no auto-merge.
Template: `huston-logic/site-template` main at `8c49fcd`. Sources: its `docs/CONVERT-TO-BLOCKS.md`, `docs/EDITING.md`,
`docs/EDITING-LANES.md` and `docs/PROCESS.md`. Before picture: a build of main (`e49a981`).

## Gate for every step

- Screenshots of every page (/, /systems, /how-i-work, /services, /past-work, /about, /insights, /contact, /privacy,
  /contact/thanks, /card and the 404) at 390 × 844 and 1440 × 900, reduced motion, compared pixel by pixel with the
  build of main. Each must say `identical`. Differences of 1 or 2 of 255 inside soft glows are re-run, as the
  template's doc allows; anything larger is a real change and is fixed at its cause.
- `npm run check:fast` per commit, `npm run check` before the PR.
- The contact Worker's code path for `/api/contact` stays byte-for-byte the same as main (`worker/contact.ts`,
  `intake.ts`, `sheets.ts`, `email.ts`, `turnstile.ts`, `messages.ts`), so leads still go to the Pipeline app when
  `INTAKE_SECRET` is set and to the Sheet otherwise.

## Decisions made up front

1. **Site-owned design hooks.** This site's sections carry spacing that the template's three rhythms do not have, and
   its approved motion (STYLE-GUIDE §9.4) draws lines with `stroke-dashoffset`. Both live in one site-owned file,
   `src/site-blocks/design.ts`: extra rhythms the renderer applies, and extra keyframe properties with a reason. The
   renderer still owns spacing and the design check still runs on every file. Listed for Grant as a template
   proposal; not a loosened threshold.
2. **Site blocks draw their own glows.** The renderer adds the hero and closing glows only to library blocks.
3. **Arbitrary values become tokens** with the same pixels (spacing steps at 4 px per step, `--text-*` and
   `--container-*` tokens, `--duration-*` tokens), so `npm run check:design` passes.
4. **One config file.** `site.config.ts` holds this site's values (Huston Logic, hustonlogic.com, `huston-site`,
   service-account Sheet writer, destination `sheet`, rate limit ids 2101 and 2102). `src/content/site.ts` and
   `providers.ts` read from it. Generated `wrangler.jsonc` and `public/_headers` must match main's apart from the
   template's additions (video player origins, `/files/*` download headers); `/grant.vcf` headers are kept.
5. **Contact Worker stays this site's.** `worker/index.ts` becomes the entry and sends `/api/contact` to the existing
   handler. Forms use the same save chain. `INTAKE_SECRET` is not added to `secrets.required`.
6. **Editor and uploads off.** `editor.enabled` false, `editor.uploads.enabled` false, no account-bound value set.
7. **New dependency:** `@cloudflare/workers-oauth-provider` 1.2.4, exact, as the template's editor message allows;
   checked for age and flagged.

## Steps

1. **Convert to blocks** (CONVERT-TO-BLOCKS steps 3 to 7).
   - a. Tokens: arbitrary values in `src/components/hl` and the pages become tokens; motion times become tokens.
     Gate: identical screenshots.
   - b. Block system: copy `src/blocks/`, the libraries it imports (collections, settings, brand, forms schema),
     `src/lib/page-files.ts`, `pages.ts`, `routes.ts`, the scripts and tests the doc lists, `site.config.ts` and
     `sync-config.mjs`; merge `package.json` scripts, `hl.css`, `globals.css`, layout components (menu from page files).
   - c. Pages as JSON: one `src/content/pages/<name>.json` per page; every section a site block (or a library block
     when its markup is the same); strings copied exactly; `fw()` tokens kept in the strings.
   - d. Delete the old page files and per-page content modules once nothing imports them; keep `contact.ts`.
   - e. `blocks:catalog`, `check:content`, `check:design`, `check`; gate.
2. **Move the content** (CONVERT-TO-BLOCKS, "Move blog posts..."): testimonials to
   `src/content/collections/testimonials/`, business details to `business.json`, brand to `brand.json` (palette.css
   and fonts.ts generated, same values), `notice.json` empty. Insights has no articles, so no posts move. Gate.
3. **Editor ports**, in EDITING.md order, each a commit: the site editor; uploads and photos; collections and brand
   settings; forms and downloads. Gate after each.
4. **Other template process items** not yet here (CHANGE-SCOPE, SECRETS, HOSTING, OFFBOARDING, TEMPLATE, the script
   tests, `check:scope`, `report:changes`), switched off where they would turn something on. Owner-only files go to the
   scratchpad as `.proposed`.
5. **Close:** review-code, review-a11y and review-security once on the branch, design critique from screenshots,
   STATUS.md, one PR with the pixel result per page.

## Stop rules

A step that fails its gate and cannot be fixed honestly stops the run: push what passed, open the PR as a draft, report.
