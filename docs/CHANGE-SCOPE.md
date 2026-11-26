# Change scope check and change report

Clients will ask for website changes in plain words, and an AI will make each change on its own branch. These two tools
judge the **files** a branch changed, not what anyone says they did. They are plain Node scripts with no new dependencies.

- **Change scope check** (`npm run check:scope`): sorts a change into tier 1 or tier 3, runs the content check on the page
  files, and enforces the image (type, size, hidden data, alt text) and placeholder rules.
- **Strip images** (`npm run strip:images`): removes hidden camera and location data from the images a branch adds or
  changes, so the image rules can pass.
- **Change report** (`npm run report:changes`): before and after screenshots of the pages a change touches, at phone and
  desktop width, with the scope result on top (which lists each image with its alt text).

The rules live in one file: [`scripts/change-scope-rules.mjs`](../scripts/change-scope-rules.mjs). Editing it is itself tier 3.

## The tiers

| Tier | What it is | What the check does |
| --- | --- | --- |
| **1** | Content: page files `src/content/pages/<name>.json` that pass the content check at the head commit, item files `src/content/collections/<kind>/<slug>.json` that pass the content check at the head commit, the settings files `src/content/business.json`, `brand.json` and `notice.json` that pass it, `src/app/palette.css` and `src/lib/fonts.ts` only when they match the generator's output for `brand.json` byte for byte (see "Items, settings and brand"), photos in `public/images/`, PDFs in `public/files/` (see "PDF rules"), and plain-data content modules in `src/content/` (for example `contact.ts` and `nav.ts`, see below) | Passes. Content problems **block** on `change/` branches (see below) |
| **3** | Everything else: `worker/`, `public/_headers`, `wrangler.jsonc`, `site.config.ts`, the wiring modules in `src/content/` (`site.ts`, `providers.ts`, `auto-reply.ts`, `contact-fields.ts`), `src/lib/` (including `routes.ts`), every file under `src/app/`, `src/blocks/` and `src/site-blocks/` (a block's design is code), `package.json` and the lockfile, `.github/`, `.claude/`, `src/components/`, `src/collections/`, `src/brand/` and `src/settings/` (the rules), deleting or renaming a page file, an item file or a settings file, an unknown collection kind or a file nested under `src/content/collections/`, and any other file | Fails (exit code 1) and lists each file with a plain reason |

(Tier 2, "ask first", is about a vague request and is handled by the agent, not by files, so the scope check does not know it.)

Four modules in `src/content/` are wiring, not copy, so they are tier 3: `site.ts`, `providers.ts`, `auto-reply.ts` and
`contact-fields.ts`. Files with a dot in the name (`*.test.ts`, `*.d.ts`) and files in sub-folders are tier 3 too (the page
files in `src/content/pages/` and the form files in `src/content/forms/` are the exceptions, see below). Symbolic links, submodules and file type changes are tier 3
at any path, and so is deleting `routes.ts` or `nav.ts`.

**Tier 1 `.ts` files must be plain data.** A content module runs at build time (and `contact-fields.ts` also runs inside the
contact Worker, which holds the email and Turnstile secrets), so "it only changes text" is not enough. The file is parsed
with the TypeScript parser (already a dev dependency) and must contain only: imports of sibling content modules or
type-only imports, type declarations, and `const` values built from literals, arrays and objects (spreads, `as const`,
`satisfies` and `+` between literals are fine; a stray `;` is fine). Calls, functions, classes, templates with `${}`, `process`,
`fetch`, `require`, `.constructor`, computed or `dangerouslySetInnerHTML`/`__proto__` keys, `using` declarations, syntax errors and any
other statement make it tier 3. A NUL byte does too.

A new page is a new JSON file, so there is no page code to judge. The plain-data parser still checks the `.ts` content modules.

A page file (`src/content/pages/<name>.json`) is tier 1 when it passes the content check at the head commit, whether it is new or edited. Deleting or renaming a page file is tier 3: pages are archived, not deleted (set `"status": "archived"`).

**Collection items and settings.** An item file (`src/content/collections/<kind>/<slug>.json`) is tier 1 when its kind is a known
collection, its slug is lowercase words and digits joined by hyphens, and the whole site (pages, items and the three settings
files) passes the content check at the head commit. `src/content/business.json`, `notice.json` and `brand.json` are tier 1 on the
same terms. `src/app/palette.css` and `src/lib/fonts.ts` are generated from `brand.json`: they are tier 1 only when they are
byte-for-byte what `brand.json` generates at the head commit; a hand-edited one is tier 3 ("a generated brand file that does not
match brand.json"). Deleting or renaming an item or a settings file is tier 3 (items are archived, not deleted), and so are an
unknown kind, a nested file and any other file under `src/content/collections/`. Placeholder, image and alt text rules apply to
items as they do to pages (an image used in an item with `alt` beside it counts as a use). A change to `brand.json` or a
generated brand file is marked in the report ("Brand change: touches every page; it needs a preview before the yes.").

**Forms.** A form file (`src/content/forms/<id>.json`, with a slug id) is tier 1 when the whole site passes the content check
at the head commit, new or edited. A change branch is blocked by a content problem in it, as for pages. The registry
(`src/forms/registry.generated.ts`) is tier 1 only when it is byte-for-byte what the form files generate at the head commit;
otherwise it is tier 3 ("not a form file" or a registry that does not match). `src/content/forms/contact.json` is tier 3 in any
status ("the contact form's wiring"), because the contact form is set up by Huston Logic. Deleting or renaming a form file is
tier 3: forms are archived, not deleted. Any other file under `src/forms/` is tier 3 ("form rules (code)"). The `forms`
caps and tab names in `site.config.ts` are tier 3, as is the rest of that file.

In the change report, a post maps to `/blog/<slug>` and `/blog`, any item to every page with a list block of its kind, and the
settings files and generated brand files to every page. A form file maps to every page whose `form` block shows that form,
on the head side or the base side, so those pages get before and after screenshots.

There is no longer a list of flagged changes. Prices, contact details, legal text, new links, page changes and file size
are the client's own business, so they pass without a flag. Bad links (`javascript:`, `data:`, `http:`, and links to a
missing or archived page) are content-check failures instead, so they block on a `change/` branch.

## Content problems (blocking on change branches)

The content check reads every page file and the image list from git at the commit being judged, so its verdict matches
what will be built. It checks:

- the page keys, the path (one level deep, `/name`), that the file name matches the path, unique paths, title and
  description lengths, the status (`live` or `archived`), and the menu (labels, places, at most six header items);
- every block type is known, and the variant is one that block has;
- anchors are unique and well formed; content keys are known; required keys are present; types and limits hold (for
  example, a FAQ with too many questions);
- text is plain text. Only the marks `**bold**` and `[[placeholder]]` count. No HTML tags, entities, markdown links or
  control characters;
- links are an internal path to a live page (with an anchor that exists on it, if one is given), `https://`, `mailto:`,
  `tel:`, or the site's booking link. Nothing else;
- images are under `/images/`, exist, are jpg, png or webp, and have real alt text;
- video links are from the YouTube or Vimeo allow-list;
- placement: a page starts with a block that may come first, no block goes over its maximum per page, and a page has at
  most one focal (signature) animation.

Each message names the file, the block number and the field, in plain words. For example:
`services.json, block 3 (faq): "items" has 9 questions; this block takes at most 8.`

The same check runs in `npm run check:content` (part of `npm run check:fast`) and inside `npm run build`, so a bad page
also fails the build.

## Image rules (blocking on change branches)

For added or changed files under `public/images/`: `.jpg`, `.jpeg`, `.png` or `.webp` only, the file's first bytes must
match its extension (a renamed SVG fails), and at most **500 KB** (512,000 bytes). SVG is never allowed because it can
carry code. A file with `<script`, `<svg`, `<html` or `<iframe` inside it fails even when its first bytes are right. Deleted
images are not checked.

### Hidden camera and location data (blocking on change branches)

A phone photo usually carries the GPS position it was taken at, the phone's make and model and the time, and editing tools
add captions, authors and thumbnails. On a client's website that can show where someone lives or works. Every added or
changed image must be free of it, and the check fails with the exact fix: run `npm run strip:images`, then commit.

What `npm run strip:images` removes, without decoding or re-encoding the picture (the picture bytes are copied unchanged).
It works from an **allow-list**: only the kinds of segment or chunk a picture needs are kept, and each one must have exactly
the size and structure its format defines, so something cannot be kept because of its name and then carry text in its
payload. Anything else is dropped. A known kind with the wrong shape (a header with extra bytes, a corrupt colour profile,
extra bytes after the picture stream) makes the file "damaged", because dropping it would break the picture.

| Type | Removed | Kept (and checked) |
| --- | --- | --- |
| jpg | EXIF (camera, GPS, time), XMP, IPTC/Photoshop, comments, an embedded thumbnail, every other application, reserved or unknown segment, anything after the end of the picture | the picture's own tables and headers (exact sizes checked), the colour profile and a 12-byte Adobe colour marker; **one EXIF block holding only the rotation flag**, so a sideways phone photo still shows upright |
| png | text notes, XMP, EXIF, the last-changed timestamp, suggested palettes, unknown private chunks, anything after the end of the picture | the drawing and colour chunks (gamma, colour profile, transparency, physical size, animation), each with its exact size; the picture data must be one complete compressed stream |
| webp | EXIF and XMP chunks (and their flags), unknown chunks whatever their name, unused header bits and bytes, anything after the end of the picture | the header, colour profile, animation and picture chunks |

By default it handles the images that differ from the point where the branch split from `origin/main`, whether committed,
staged or not yet added. `--all` handles every image under `public/images/`; `--check` changes nothing and exits 1 if any
image still has hidden data. A damaged image is reported and left untouched. Symbolic links and other file types are
skipped (the scope check refuses them anyway). It is safe to run twice. The scope check uses the same code, so the two can
never disagree about what "clean" means. The report names what was found (for example "EXIF (camera and location data)")
but never prints the data itself.

### Alt text (blocking on change branches)

Every added or changed image must be used somewhere in `src/` with real alt text written out next to it, so a screen
reader says what the picture shows. The check finds each place a string equal to the image's address appears (for
`public/images/team/sam.jpg`, the string `"/images/team/sam.jpg"`), reading the files with the TypeScript parser, and
accepts only these two shapes:

```tsx
<img src="/images/team/sam.jpg" alt="Sam at the front desk" />   // img, next/image or any component
{ src: "/images/team/sam.jpg", alt: "Sam at the front desk" }    // in a content file: any key may hold the path, the key must be alt
```

In a page file (`src/content/pages/<name>.json`) the same use is written with JSON keys: `{ "src": "/images/team/sam.jpg", "alt": "Sam at the front desk" }`. Uses in `.ts`, `.tsx` and page files all count.

It fails when the image is used nowhere, when a use has no `alt`, when the alt text is empty, a `[[placeholder]]`, a file
name or camera name (`IMG_1234`, `DSC00123`), a word that says nothing (`image`, `photo`, `picture`, `graphic`, `icon`, `logo`,
`alt text`, `todo`, `tbd`, `untitled`, `placeholder`, with or without "a", "the", "of" or a plural; the list is
`genericAltText` in the rules file), something too short to describe a picture (under 3 letters or digits after punctuation,
HTML entities such as `&nbsp;` and invisible characters are taken out), and when the alt text is not written out as
plain text (a variable, a function call, a template with `${}` or a spread of props cannot be checked). Alt text may be a
string, a template without `${}`, or two strings joined with `+`. Every use is checked, not just the first. An element with
`aria-hidden` (anything but `"false"`) or `role="presentation"`/`"none"` fails, because its alt text is never read, and an
object that spreads another object (`{ src, alt, ...more }`) fails, because the spread could replace the alt text. A `?:`
choice between two images in `src` is fine. The change
report lists each image with its alt text, so Grant can read it and judge whether it actually describes the picture.

A purely decorative image (one that should have empty alt text) cannot pass this check on purpose: it stops for Grant,
who decides how to mark it.

## PDF rules (blocking on change branches)

A price sheet or menu can be added as a PDF. It goes in `public/files/`, one level deep, named in lowercase words joined by
hyphens and ending in `.pdf` (`price-sheet.pdf`, served as `/files/price-sheet.pdf`), and a page links to it. An added or
changed file that matches that name is tier 1 and must pass, with the fix named in each message:

- it starts with `%PDF-` and ends with `%%EOF` within its last 1,024 bytes (a renamed or cut-off file fails);
- it is at most **10 MB** (10,000,000 bytes);
- it holds none of the names `/JavaScript`, `/JS`, `/Launch`, `/EmbeddedFile`, `/EmbeddedFiles`, `/RichMedia`, `/XFA`, `/AA`,
  `/SubmitForm`, `/ImportData`. Names are matched whole after `#xx` escapes are decoded, so `/J#61vaScript` counts and
  `/JSFoo` does not match `/JS`. The fix is "save it again as a plain PDF (Print, then Save as PDF)". Names inside
  compressed object streams are not seen; the headers below are the layer for that;
- it is used: a string exactly equal to `/files/<name>.pdf` appears in a `.ts`, `.tsx` or page `.json` file under `src/`
  (no alt text is needed). The check reads the head commit, so the PDF and the page that links it can arrive in one pull
  request in any order.

Anything else under `public/files/` (another file type, capital letters, spaces, a sub-folder) is tier 3: only PDFs named in
lowercase words joined by hyphens can go in `public/files/`. Deleting a PDF is tier 1 and is not checked; if a page still
links to it, the content check on the pages says so. PDF document properties (such as the author) are not removed.

`public/_headers` always carries a generated `/files/*` block (`Content-Disposition: attachment`,
`Content-Security-Policy: sandbox`, `X-Content-Type-Options: nosniff`), so a PDF downloads and never runs on the site's own
origin. That file is tier 3 and is changed with `npm run sync:config`; the editor never touches it. The byte checks are in
`scripts/pdf-check.mjs`, which the Worker's upload check mirrors.

## Leftover placeholders (blocking on change branches)

Any new `[[placeholder]]` on a line the change **adds** in `src/content/` (page files included) or `src/app/`. A placeholder that was already on a
line the change edited is not new (each added one cancels against a removed one with the same text), and the launch gate (`npm run check:placeholders`, which lists every placeholder in the repo) is unchanged.

## Items, settings and brand

Item files and the three settings files are checked by the same content rules as blocks: field kinds, limits, plain text,
links, images with real alt text, and the post body. The content check also judges the brand:

- every color pair in `src/brand/contrast-pairs.ts` must keep its contrast on the `brand.json` at the head commit. A pair
  that fails blocks the change and names the pair and its ratio;
- each font must be on the curated list in `src/brand/fonts.ts`;
- a logo must be an upload that is at least 160 by 80 pixels, with a shape between 1:1 and 6:1.

The change report maps these files to the pages they can change:

- a post item maps to its own page and to `/blog`;
- any other item maps to every page that holds a list block for its kind (latest posts, post index, video list, episode
  list, testimonials or team). Examples do not change, so `/blocks` is not photographed for items;
- `business.json`, `notice.json`, `brand.json`, `src/app/palette.css` and `src/lib/fonts.ts` map to every page. The report
  flags a brand change as "touches every page".

## Running it

```bash
npm run check:scope
```

By default it compares `HEAD` with `origin/main`. Options: `--base <ref>`, `--head <ref>`, `--report-only` (print the
same report, always exit 0) and `--ci` (read GitHub's own variables: the base comes from `GITHUB_BASE_REF`, and it is
strict only when the pull request's branch starts with `change/`; outside a pull request it does nothing). Exit codes:
0 pass, 1 fail, 2 could not run.

```bash
npm run strip:images
```

Cleans the images this branch adds or changes (see "Hidden camera and location data"). Options: `--base <ref>` (default
`origin/main`), `--all`, `--check`. Exit codes: 0 done, 1 an image still has data (`--check`) or could not be read, 2 could
not run.

```bash
npm run build
npm run report:changes
```

Writes `change-report/report.md` and `change-report/<page>/{before,after}-{phone,desktop}.png` (the folder is git-ignored).
"After" is your `out/` build. "Before" is built for you in a temporary git worktree from the point the branch split from
`main` (`npm ci` and `npm run build`, a minute or two, removed afterwards); pass `--base-out <dir>` to reuse a build you
already have. It photographs only the pages the change touches. A page file maps to its own page. A change to a block in
`src/blocks/library/<type>/` or a site's own block in `src/site-blocks/<type>/` maps to every page that uses that block, plus
the block showcase (`/blocks`); so do the blocks whose folders import that file (video-grid imports the video player). Other
block code (anything else under `src/blocks/`, or directly in `src/site-blocks/` such as `definitions.ts`) reaches every page.
Any other file is traced by its imports. Tracing stops at a block's own folder, so a component that only one block uses
photographs the pages that use that block, plus `/blocks`, not every page. A change to the shared layout, or
one that cannot be traced, photographs every page. Files under `worker/`, test files (`*.test.ts`, `*.test.mjs`), `docs/`,
`scripts/`, `tests/` and Markdown files cannot change how a page looks, so they photograph nothing. A page going from live to archived
is shown as "page archived" with no after picture, and going back to live as "page restored" with no before picture. Widths: phone 390 × 844, desktop 1440 × 900.
It needs Chromium from Playwright (already a dev dependency) and falls back to an installed Google Chrome.

It needs `npm ci` first, because the code check uses the `typescript` dev dependency.

Tests for both tools: `npm run test:scripts` (fake diffs, plus throwaway real git repositories in the temp folder; no network).

## In CI

The jobs `change-scope` and `change-report` in `.github/workflows/ci.yml` (copied in by hand, because Claude Code
cannot write workflows) run on pull requests. They are **not** required checks yet: per CLAUDE.md a new check becomes
required only after 5 clean runs and a deliberate-failure proof PR, and only after the ruleset is changed first.

The jobs already run everything described here (the hidden-data and alt text checks live inside `check-change-scope.mjs`,
and the script tests run with the `scripts/*.test.mjs` glob), so adding them needed no further workflow change. The `check` job runs `npm run check`, which includes `check:content`, and the build reads the page
files through the same check, so a bad page also fails CI.

## Using it in a client repo

Copy `scripts/change-scope-rules.mjs`, `scripts/change-scope-code.mjs`, `scripts/check-change-scope.mjs`, `scripts/change-report.mjs`,
`scripts/image-metadata.mjs`, `scripts/image-alt.mjs`, `scripts/strip-image-metadata.mjs`, `scripts/image-fixtures.mjs`, every `*.test.mjs` beside them,
`scripts/preview.mjs` and the six `package.json` scripts (`check:scope`, `report:changes`, `strip:images`, `test:scripts`, `check:content`, `check:design`) from the template. Adjust the rules file for that site: any extra file that should stay off limits, and the size limits. The page and block pieces are a separate copy: the whole `src/blocks/` and `src/site-blocks/` folders, `src/lib/page-files.ts`, `src/lib/pages.ts`, `src/content/pages/`, and `scripts/check-content.mjs`, `scripts/check-design.mjs` and `scripts/design-rules.mjs`. The steps are in [`docs/CONVERT-TO-BLOCKS.md`](CONVERT-TO-BLOCKS.md). Name the agent's branches `change/<short-name>`.

## Known limits

- **Strict mode depends on the branch name or the author.** `--ci` is strict when the pull request's branch starts with
  `change/`, and also when the pull request was opened by the site editor's GitHub App (its login is `editor.github.botLogin`
  in `site.config.ts`, read from the pull request event). Strict only fails the job: for that to block a merge, the check must
  also be a required check in the ruleset. The check judges files, not claims, but it trusts the actor it guards to pick that
  branch name. Until the ruleset enforces it
  (for example CODEOWNERS on tier 3 paths, or a required check that needs an owner label), the agent's workflow must create
  `change/` branches itself and nobody should open a client change from another branch.
- **The code checks are static analysis, one layer among several.** They reject code in tier 1 `.ts` files by
  reading the parse tree, which is far harder to dodge than text search, but they cannot prove a file is harmless. The other
  layers are the required checks (including CodeQL), the preview Grant looks at, and the rule that Claude cannot merge.
- **Images are checked by their first bytes, their size and a scan for markup**, not decoded. A hostile file that is a valid
  image and also carries a hidden payload could still pass; the site's CSP and `nosniff` header limit what it could do.
- **Two places stay unchecked, because looking inside them means decoding the picture.** Text hidden *inside* the compressed
  picture data (appended inside a JPEG scan, a WebP picture chunk or a PNG's compressed stream) and the free-text fields
  inside a colour profile (the ICC profile in a JPEG, PNG or WebP) pass through. Neither is something a camera, a phone or
  an editor writes by accident, and the checks above are aimed at that: the location and camera data real devices write.
  Someone who sets out to smuggle text into the pixels or the profile is a different problem, and Grant's own look at the
  preview and the report is the layer for it.
- **Stripping removes the known places a file can hold data, not everything.** It does not touch the picture itself, so a
  visible street sign, a name tag, a screen or a blurred-but-readable face stays. It does not change a file's name (a name
  such as `home-at-12-oak-street.jpg` stays), and it keeps a colour profile and the rotation flag on purpose. A PNG's rotation
  flag (in its EXIF chunk) is dropped rather than kept; browsers rarely use it. A JPEG with several EXIF blocks keeps at most
  one rotation-only block. A file stripped of a flag it needed to look right would need to be re-encoded, which this tool
  never does.
- **Alt text is checked for being there and for saying something, not for being true.** `"A smiling woman"` passes for any
  photo. Grant reads the alt text in the change report. Only uses in `.ts`, `.tsx` and page `.json` files under `src/` count (an image used
  only as a CSS background has nowhere to hold alt text, so it fails as "not used"). A use whose alt text sits in a variable,
  or in another file than the one holding the path, fails and has to be written out beside the image. The path must be
  written exactly (`"/images/a.jpg"`), with no query string such as `?v=2`.
- **Any string equal to the image's path counts as a use, rendered or not.** A real `<img>` whose `src` is built from pieces
  (`"/images/" + name`) and has empty alt, next to an unused object that holds the right path and good alt text, would pass.
  That is deliberate cleverness, not a slip, so it is left to Grant's look at the report and the preview.
- **Marker-level parsing, not full decoding.** The three file readers walk a file's segments or chunks and refuse a file whose
  structure is damaged (a cut-short upload, a length that runs off the end). They do not check that the compressed picture
  inside is valid; the browser does that.
- **The report's "after" is whatever is in `out/`**; rebuild before running it.

## What this does not do

It does not read copy for banned wording or invented claims. That is a separate check. It checks that alt text exists and
says something, but it cannot tell whether the alt text describes the picture. It also cannot tell whether a changed sentence
is true. It only guarantees that a change stayed inside the allowed files.
