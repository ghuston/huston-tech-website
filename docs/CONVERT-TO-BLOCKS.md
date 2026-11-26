# Convert a site to blocks

This is for Grant, or a Claude session, converting a site that was built from this template before pages were data.
A converted site has the same pages and the same look. Only the way the pages are stored changes.

## What changes

- Each page file (`src/app/(site)/<name>/page.tsx`) becomes one data file, `src/content/pages/<name>.json`. It holds the
  path, the title, the description, the status and an ordered list of blocks. Every string is copied exactly.
- One renderer builds every page from those files. Blocks are the designed sections. The library in `src/blocks/` holds
  the sections the template ships. A site's own sections go in `src/site-blocks/`.
- The menu and the sitemap come from the page files. `src/content/nav.ts` keeps only the menu label.
- The per-page content modules (`home.ts`, `about.ts`, `services.ts`, `privacy.ts`) are deleted once nothing imports
  them. `contact.ts` stays, because it still holds the form, thanks and 404 copy.

## Steps

**1. Start a branch from main.** Switch to `main`, update it, then create the branch. The `--ff-only` flag refuses to
merge anything, so the pull only moves the branch forward and never makes a merge commit.

```bash
git switch main
git pull --ff-only
git switch -c chore/pages-as-blocks
```

**2. Build main first and keep that build as the before picture.** The before picture is what the site looks like now.
Every later check compares against it. Delete `.next` first, so no old build is reused. If dependencies are not
installed, run `npx --yes npm@10.9.9 ci` first.

```bash
rm -rf .next
npm run build
```

Then copy the `out/` folder to a folder outside the repo, for example `~/Desktop/before-blocks`. Do this before any edit.

**3. Copy the block system in from the template.** Work from a clone of `huston-logic/site-template` on its `main`
branch. Copy these, as they are:

- the whole `src/blocks/` folder
- `src/lib/page-files.ts`, `src/lib/pages.ts` and `src/lib/routes.ts`
- `src/app/(site)/[slug]/page.tsx` and the new `src/app/(site)/page.tsx`
- `src/app/(site)/blocks/page.tsx` (the showcase)
- `scripts/check-content.mjs`, `scripts/check-design.mjs`, `scripts/design-rules.mjs`, `scripts/compare-screenshots.mjs`,
  `scripts/blocks-catalog.mjs`, and their `*.test.mjs` files

- the client-change tools, which now understand page files: `scripts/change-scope-rules.mjs`,
  `scripts/check-change-scope.mjs`, `scripts/change-scope-code.mjs`, `scripts/image-alt.mjs`, `scripts/change-report.mjs`
  and their tests
- `scripts/sync-config.mjs` (it adds the YouTube and Vimeo player origins to the security headers), then run
  `npm run sync:config` so `public/_headers` is regenerated
- `lighthouserc.cjs` and `scripts/lighthouse-summary.mjs` (the showcase is audited without the SEO score)
- `src/content/showcase.ts` and `src/content/video.ts` (the words the showcase and the video player use)

Then merge, do not replace:

- the token and motion sections of `src/app/hl.css` and `src/app/globals.css`. Keep the site's own colors and fonts.
- in `package.json`, the scripts `check:content`, `check:design`, `compare:screens`, `blocks:catalog`, the warning flags
  on `check:scope`, `report:changes` and `test:scripts`, and the `check:fast` line that runs them.
- `src/components/layout/Header.tsx`, `HeaderNav.tsx` and `Footer.tsx`: the menu now comes from the page files
  (`getMenu("header")`, `"footer"`, `"legal"`) instead of `nav.ts`. Keep the site's own design.
- `src/components/hl/`: the library blocks import the template's primitives (`Container`, `HeroContent`, `PageHero`,
  `Button`, `TextLink`, `Faq`, `CellDividers`, `Glow`, ...). Where the site has its own version with a different design,
  keep the site's, make the library block use it, and make it pass `npm run check:design` (tokens only, same pixels).

Create `src/site-blocks/` by copying the template's folder. It holds empty lists and a README. Do not change those files
after that, so later template updates do not overwrite the site's own blocks.

**4. Write each page as a JSON file.** For each old page:

- Write `src/content/pages/<name>.json`. Use `home.json` for `/`, and a file name equal to the path for every other page
  (`services.json` is `/services`).
- Copy the SEO title and description exactly, from the page's `pageMetadata()` call.
- Copy every string exactly. Do not fix spelling, tone or punctuation.
- For each section on the page:
  - If it matches a library block, write it as that block, with its strings copied exactly. The library list is in
    `docs/BLOCKS.md` once `npm run blocks:catalog` has run (step 6).
  - If it is the site's own design, register it as a site block. Make one folder in `src/site-blocks/`. Add a definition
    with `source: "site"`, and a component that takes its content as props and uses only the site's tokens. Add the
    definition to `src/site-blocks/definitions.ts` and the component to `src/site-blocks/components.tsx`.
  - A site block must not reuse a library block's type name. The content check fails on that.
  - Do not change a site block's design to make it fit a library block. Register it as it is.
- The contact form stays as it is. Wrap it in the `contact-form` block.

**5. Delete the old files once nothing uses them.** Search for imports of each old page file and each per-page content
module before deleting it. Delete the old `page.tsx` files and the per-page content modules. Keep `contact.ts`.

**6. Run the generators and the checks.** Run each command on its own.

```bash
npm run blocks:catalog
npm run check:content
npm run check:design
npm run check
```

`blocks:catalog` writes `docs/BLOCKS.md`, `docs/blocks.json` and the generated section list in `docs/EDITING-LANES.md`.
Commit those files with the rest. `check:content` fails if a generated file is out of date, so run the catalog again
after any change to a block.

**7. Prove that nothing visible changed.** This is the gate. Every page must be pixel-identical.

```bash
npm run build
npm run report:changes -- --base-out ~/Desktop/before-blocks
npm run compare:screens
```

- `report:changes` takes before and after screenshots at phone width (390 × 844) and desktop width (1440 × 900), with
  reduced motion on. Check that all five pages are in the report. A change to the shared layout photographs every page.
- `compare:screens` compares each before and after picture pixel by pixel. For every page at both widths it must say
  `identical`.
- Soft glows and gradients can render a level or two differently from one run to the next, even for the same build
  (measured on this template: up to 2 of 255 on one channel, only inside glows). If the only differences say "largest
  channel difference 1 of 255" or "2 of 255", run the report again, or check with `node scripts/compare-screenshots.mjs
  change-report --tolerance 2` after looking at the pictures, and say so in the PR. Anything larger is a real change.
- If a page differs, find the cause and fix it. If the difference is a deliberate fix, explain it in the PR, with the
  page, the width and the number of changed pixels. Do not change a screenshot to make it match.

**8. Open the pull request.** Run `npm run check` once more before the PR. The PR description starts with a "Needs your
eyes" line. This conversion changes `package.json` (the new scripts) and possibly `src/app/hl.css`, so list those. Add
the screenshot result (identical or explained) and the list of site blocks, if any. Use the PR process in CLAUDE.md.

## Ready-to-paste message for the conversion run

Paste the block below into a Claude session in the client's repo.

```text
This is an autonomous process run named "Convert to blocks". Work from the steps in docs/CONVERT-TO-BLOCKS.md in the
huston-logic/site-template repo (fetch it from GitHub; do not guess the steps). Read CLAUDE.md, AGENTS.md and
docs/PROCESS.md in this repo first.

The gate is pixel-identical screenshots. Build main first and keep that build as the before picture. After the
conversion, every page must say "identical" in the pixel comparison at 390 and 1440 wide. Do not weaken the gate, and
do not change a screenshot to make it match. Explain any difference in the PR.

Register the site's own sections as site blocks in src/site-blocks/. Do not change their design to fit a library block.
Copy every string exactly. Do not change copy in meaning.

Stop, queue the item and continue with the other work on any of these, as CLAUDE.md says: secrets or credentials, DNS,
accounts or money, sending real email, deleting user data, lowering a threshold or a required check, or any owner-only
path (.claude/hooks, .claude/agents, .claude/skills, .claude/settings*.json, .github/workflows). For an owner-only
change, write the proposed file to the scratchpad and list it for Grant to copy in by hand. Do not add a dependency.

When the work is done, open one pull request on a branch named chore/pages-as-blocks, with the "Needs your eyes" line
first. Then stop.

END OF BRIEF
```

## Move blog posts, videos, testimonials, team, business details and brand

Use this after the conversion, for a site that has old copy in its pages or in `site.config.ts` (`theme`, `owner.phone`,
`contact.linkedInUrl`). Nothing is deleted. Each value is copied exactly, then checked by `npm run check:content`.

- **Blog posts, videos, podcast episodes, testimonials and team members** go in one JSON file each, under
  `src/content/collections/<kind>/<slug>.json` (kinds: `posts`, `videos`, `episodes`, `testimonials`, `team`). Each file
  holds `"status"` (`draft`, `live` or `archived`) and the fields the owner gave. Put a post that was already on the old
  site as `live` only when it is ready to show. Write a testimonial only with the quote and the named source the client
  gave you. Do not write a team member the client did not name.
- **Business details** (name, phone, public email, address, hours, social links) go in `src/content/business.json`. The
  LinkedIn link becomes a social entry. The phone number and the LinkedIn link leave `site.config.ts`.
- **Brand** goes in `src/content/brand.json`: the 13 colors from `theme.colors`, and the three fonts from `theme.fonts`.
  A font must be on the curated list in `src/brand/fonts.ts`. A font that is not on it is a Huston Logic change. The logo
  stays `null` (the business name as text) until the client uploads one.
- **Notice** goes in `src/content/notice.json`. Leave `text` empty unless the client asks for a notice.
- **Blog page.** `src/content/pages/blog.json` comes with the collections port (see "Add collections and brand settings"
  in [EDITING.md](EDITING.md)). Its text is `[[placeholders]]` until the client gives the words.

Then run `npm run sync:config`, which writes `src/app/palette.css` and `src/lib/fonts.ts` from `brand.json`, and
`npm run check:config`. Remove `theme`, `brand.logo`, `owner.phone` and `contact.linkedInUrl` from `site.config.ts`.
Add `business.timeZone` (the client's IANA zone), and set `contact.emailColors` and `editor.pageColors` to the same
colors as `brand.json`.

## Then add the site editor

Once the conversion is merged and live, the owner can change the pages by chatting with their AI app. That is the site editor. It is off by default and needs its own setup: a GitHub App, a sign-in gate and a few settings. [docs/EDITING.md](EDITING.md) has the steps and a ready-to-paste message for a Claude Code session. Keep it out of the conversion pull request.
