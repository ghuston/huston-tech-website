# Blocks

<!-- This file is generated. Do not edit it by hand; run `npm run blocks:catalog`. -->

This file is generated from the block library (`src/blocks/` and `src/site-blocks/`). Do not edit it by hand: run
`npm run blocks:catalog`. The same facts for programs are in `docs/blocks.json`. `npm run check:content` fails when
either file is out of date.

A page is one file in `src/content/pages/` with an ordered list of blocks. Each block is a designed section: pick a
type, optionally a variant, and fill in its content.

## Page rules

- **Page file.** One file per page in src/content/pages/. home.json is the home page (/); every other file is named after its one-segment path (services.json is /services). Paths are lowercase words joined by hyphens, one level deep, and each is used once.
- **Page keys.** `path`: "/" or a one-segment path like "/services". Must match the file name. `title`: The page's search-result title, 1 to 70 characters. `description`: The page's search-result description, 1 to 170 characters. `status`: "live" or "archived". `menu` (optional): Where the page appears in the menu: { label, order, places }. `blocks`: The page's sections, in order: at most 20.
- **Menu.** `label`: The words in the menu, 1 to 24 characters. `order`: A number; lower numbers come first. `places`: Any of "header", "footer", "legal". A page appears in the menu only if it has a menu entry. At most 6 live pages may be in the header.
- **Block keys.** `type`: The name of a block in this catalog. `variant` (optional): One of the block's variants; the first is used when it is left out. `anchor` (optional): A lowercase name (letters, digits, hyphens; starts with a letter; at most 40 characters) that links can point to as /page#name. Unique on the page. `content`: The block's fields, as listed in its entry.
- **Status.** `live`: the page is built, listed in the menu places it asks for, and in the sitemap. `archived`: the page leaves the build, the menu and the sitemap. The file and its content stay, and setting it back to live restores it. A link to an archived page fails the check.
- **Required pages.** `/` and `/contact` must exist and stay live. Reserved paths no page may take: `/blocks`, `/api`, `/contact/thanks`, `/og.png`, `/icon.svg`, `/sitemap.xml`, `/robots.txt`, `/404`, `/index`, `/_not-found`, `/_next`.
- **The first block.** The first block must be a block whose position is "first" (the hero). It carries the page's one H1, so a page has exactly one.
- **Focal animation.** At most one block per page may carry a signature (focal) animation.
- **Length.** At most 20 blocks on a page.
- **Text.** Text is plain. Only **bold** and [[placeholder]] marks are allowed. No HTML tags, no HTML entities, no markdown links and no control characters (line breaks, tabs, hidden characters).
- **Links.** Allowed: An internal path (/name) or a path with an anchor (/name#anchor) that points to a live page, and to an anchor that exists on it. An https:// address. A mailto: address. A tel: number. "@booking": the site's booking link (the scheduler when set, otherwise /contact#book). Never: `javascript:`, `data:`, `http:`, `//host`, or any other kind of address (a `//host` address has no scheme).
- **Images.** An image is { src, alt } with an optional focus: center, top, bottom, left or right. The file must exist under /images/ and be a jpg, png or webp. Each image slot has a shape (3:2, 4:3, 4:5, 1:1 or 16:9) and the picture is cropped to it; focus says which part to keep. The alt text must really describe the picture, so it can't be empty or only a generic word. Formats: jpg, png, webp. Alt text that is only one of these words is rejected: image, img, photo, picture, graphic, icon, logo, alt, alt text, todo, tbd, untitled, placeholder.
- **Files.** A link may point to a PDF under /files/ that exists, such as /files/price-sheet-k3x9q2mz.pdf. Visitors download it.
- **Video.** A video address must be from YouTube or Vimeo. The player is rebuilt from the video's id, not from the address that was pasted. Allowed player origins: https://www.youtube-nocookie.com, https://player.vimeo.com, https://open.spotify.com, https://embed.podcasts.apple.com.
- **Audio.** An episode address must be from Spotify or Apple Podcasts. The player is rebuilt from the episode's id, not from the address that was pasted.

## Collections

A collection is a list of items of one kind. Each item is one JSON file, `src/content/collections/<kind>/<slug>.json`, holding its `status` and its fields. List blocks and the blog show them. Items are archived, never deleted.

### Posts (`posts`)

Blog posts. Each one is a page at /blog/<slug>, listed newest first on /blog.

- **File.** `src/content/collections/posts/<slug>.json`. Lowercase words and digits joined by hyphens, 1 to 60 characters. It is the file name and, for a post, the address (/blog/<slug>).
- **Status.** Every item has a status: draft (built only outside production), live, or archived (never shown, never deleted).
- **Sort.** Newest date first.

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `title` | Title | yes | up to 90 characters |
| `description` | Summary. The search description, and the summary shown in lists. | yes | up to 170 characters |
| `date` | Date. The day the post was written, like 2026-03-27. | yes | a date, YYYY-MM-DD |
| `updated` | Updated. Only when the post was changed later. | no | a date, YYYY-MM-DD |
| `image` | Photo | no | a picture under /images/ with real alt text, shape 3:2 |
| `body` | Post | yes | up to 200 parts and 40000 characters: headings, paragraphs, lists, quotes and photos |

**Example:**

```json
{
  "status": "live",
  "title": "[[Post title]]",
  "description": "[[A sentence that says what the post is about]]",
  "date": "2026-03-27",
  "image": {
    "src": "/images/examples/vase-and-pears.jpg",
    "alt": "A pale blue vase beside a blue pear and a rust-red pear on a table"
  },
  "body": [
    {
      "type": "heading",
      "level": 2,
      "text": "[[A heading that opens the first section]]"
    },
    {
      "type": "paragraph",
      "text": [
        "[[A paragraph that explains the first idea. Questions? ]]",
        {
          "text": "Get in touch",
          "href": "/contact"
        },
        "."
      ]
    },
    {
      "type": "list",
      "style": "bullet",
      "items": [
        "[[First point]]",
        "[[Second point]]"
      ]
    },
    {
      "type": "quote",
      "text": "[[A short quote worth pulling out]]",
      "source": "[[Who said it]]"
    },
    {
      "type": "photo",
      "image": {
        "src": "/images/examples/window-light.jpg",
        "alt": "Soft light falling through a window onto a wooden table"
      },
      "caption": "[[A caption for the photo]]"
    }
  ]
}
```

### Videos (`videos`)

Videos from YouTube or Vimeo. A video plays on the page only when a visitor presses play.

- **File.** `src/content/collections/videos/<slug>.json`. Lowercase words and digits joined by hyphens, 1 to 60 characters. It is the file name and, for a post, the address (/blog/<slug>).
- **Status.** Every item has a status: draft (built only outside production), live, or archived (never shown, never deleted).
- **Sort.** Newest date first.

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `title` | Title | yes | up to 90 characters |
| `url` | Video address. A YouTube or Vimeo address. | yes | a YouTube or Vimeo address |
| `caption` | Caption | no | up to 200 characters |
| `date` | Date | yes | a date, YYYY-MM-DD |

**Example:**

```json
{
  "status": "live",
  "title": "[[Video title]]",
  "url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  "caption": "[[A sentence that says what to expect]]",
  "date": "2026-03-27"
}
```

### Podcast episodes (`episodes`)

Podcast episodes from Spotify or Apple Podcasts. An episode plays on the page only when a visitor presses play.

- **File.** `src/content/collections/episodes/<slug>.json`. Lowercase words and digits joined by hyphens, 1 to 60 characters. It is the file name and, for a post, the address (/blog/<slug>).
- **Status.** Every item has a status: draft (built only outside production), live, or archived (never shown, never deleted).
- **Sort.** Newest date first.

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `title` | Title | yes | up to 90 characters |
| `url` | Episode address. A Spotify or Apple Podcasts episode address. | yes | a Spotify or Apple Podcasts episode link |
| `summary` | Summary | no | up to 300 characters |
| `date` | Date | yes | a date, YYYY-MM-DD |

**Example:**

```json
{
  "status": "live",
  "title": "[[Episode title]]",
  "url": "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk",
  "summary": "[[A sentence or two about the episode]]",
  "date": "2026-03-27"
}
```

### Testimonials (`testimonials`)

Quotes from named clients, in the order you choose. Never write one the client did not say.

- **File.** `src/content/collections/testimonials/<slug>.json`. Lowercase words and digits joined by hyphens, 1 to 60 characters. It is the file name and, for a post, the address (/blog/<slug>).
- **Status.** Every item has a status: draft (built only outside production), live, or archived (never shown, never deleted).
- **Sort.** By the item's order number (lower first), then by its name.

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `quote` | Quote. Only words the client really said. | yes | up to 600 characters |
| `name` | Name. The named person who said it. | yes | up to 80 characters |
| `role` | Role | no | up to 60 characters |
| `organization` | Business | no | up to 80 characters |
| `order` | Order. Lower numbers come first. | yes | a whole number from 0 to 999 |

**Example:**

```json
{
  "status": "live",
  "quote": "[[Client quote, from a named client]]",
  "name": "[[Client name]]",
  "role": "[[Client role]]",
  "organization": "[[Client business]]",
  "order": 1
}
```

### Team (`team`)

The people on the team, in the order you choose.

- **File.** `src/content/collections/team/<slug>.json`. Lowercase words and digits joined by hyphens, 1 to 60 characters. It is the file name and, for a post, the address (/blog/<slug>).
- **Status.** Every item has a status: draft (built only outside production), live, or archived (never shown, never deleted).
- **Sort.** By the item's order number (lower first), then by its name.

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `name` | Name | yes | up to 80 characters |
| `role` | Role | yes | up to 60 characters |
| `bio` | Bio | no | up to 400 characters |
| `photo` | Photo | no | a picture under /images/ with real alt text, shape 4:5 |
| `order` | Order. Lower numbers come first. | yes | a whole number from 0 to 999 |

**Example:**

```json
{
  "status": "live",
  "name": "[[Team member name]]",
  "role": "[[Team member role]]",
  "bio": "[[Two sentences about this person]]",
  "photo": {
    "src": "/images/examples/jug-and-cups.jpg",
    "alt": "A tall blue jug beside two small cups on a table"
  },
  "order": 1
}
```

## Settings

Three files hold the site-wide settings. Each is one JSON object and is checked by `npm run check:content`.

### Business (`src/content/business.json`)

The business details every page can show: name, phone, email, address, hours and social links.

| Field | Required | Rule |
| --- | --- | --- |
| `name` | yes | The business name, up to 80 characters. |
| `phone` | yes | A phone number: 7 to 20 digits, spaces and + ( ) - . only. "" for none. |
| `email` | yes | One email address. "" for none. |
| `address` | yes | Up to 4 address lines, each up to 80 characters. [] for none. |
| `hours` | yes | null (no hours shown) or all seven days (monday, tuesday, wednesday, thursday, friday, saturday, sunday), each "closed" or { "opens": "09:00", "closes": "17:00" } in 24-hour time, closing after opening. |
| `hoursNote` | no | A note under the hours, up to 120 characters. |
| `social` | yes | Up to 8 links, each { "network", "url" }. Networks: instagram, facebook, linkedin, youtube, tiktok, x, pinterest, threads. The address must be https:// and on that network's own site. |

### Brand (`src/content/brand.json`)

The colors, fonts and logo. src/app/palette.css and src/lib/fonts.ts are generated from it (npm run sync:config); never edit them by hand.

**Colors** (`colors`, each written as `#rrggbb`):

- **brand:** `green`, `greenDeep`, `greenEdge`, `tint`, `glow`, `mint`. The brand color is `green`; its five companions are derived from it, keeping their lightness and softness and taking its hue.
- **accent:** `rust`. The accent color is `rust`.
- **neutrals:** `silver`, `silver2`, `white`, `ink`, `ink2`, `line`. Text and background colors that Huston Logic sets; they are not changed by chat.

**Contrast rule.** Every foreground and background pair the design puts together must keep its contrast: 15 text pairs need 4.5 to 1, and 7 pairs (large text, icons, control edges, the focus ring) need 3 to 1. A color that fails is refused with the nearest one that works.

**Fonts** (`fonts`). Each role takes one of its listed fonts, by id. The first of each role is the template default.

- `display`: outfit (Outfit), manrope (Manrope), sora (Sora), dm-sans (DM Sans), plus-jakarta-sans (Plus Jakarta Sans), fraunces (Fraunces)
- `body`: inter (Inter), source-sans-3 (Source Sans 3), work-sans (Work Sans), nunito-sans (Nunito Sans), figtree (Figtree), lora (Lora)
- `accent`: newsreader (Newsreader), fraunces (Fraunces), lora (Lora), playfair-display (Playfair Display)

**Logo** (`logo`). null (the business name is shown as text) or { src, alt, width, height }: an uploaded photo like /images/uploads/k3x9q2mz.webp with real alt text, at least 160 by 80 pixels, between square and 6 times wider than tall.

### Notice (`src/content/notice.json`)

A one-line notice above the header, with an optional link and last day.

| Field | Required | Rule |
| --- | --- | --- |
| `text` | yes | The notice, up to 120 characters. "" for no notice. |
| `link` | no | { label, href }: the link words (up to 40 characters) and a link (see Page rules). It needs notice text. |
| `endsOn` | yes | The last day it shows, YYYY-MM-DD, or null for no end date. |

## Hero (`hero`)

The top of a page: a small line above, the page headline, a short introduction and, if wanted, one button.

**Where it can go:** first on the page, once.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Left-aligned, with a soft glow in the top-right corner.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `eyebrow` | Small line above the headline | no | up to 60 characters |
| `title` | Headline. The page's one main heading. | yes | up to 90 characters |
| `intro` | Introduction | no | up to 320 characters |
| `action` | Button | no | button words up to 40 characters, and a link |

**Motion:** No entrance motion. The first block is the first paint, so it shows at once and never waits on motion.

**Example:**

```json
{
  "eyebrow": "A short line that sets the scene",
  "title": "A headline that says what this page is about",
  "intro": "One or two sentences that say more about the page.",
  "action": {
    "label": "A label that says what the button does",
    "href": "@booking"
  }
}
```

## Highlights (`highlights`)

A heading and a set of short ideas, each with a title and a few lines of text, and optionally a photo above each. Good for services, reasons or features.

**Where it can go:** anywhere, up to 3 times.

**Variants** (set with `variant`; the first is used when it is left out):

- `two-column` (default): The ideas sit in two columns (one column on phones), with soft dividers.
- `three-column`: The ideas sit in three columns on wide screens (with three or more ideas), two on tablets, one on phones.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |
| `items` | Ideas | yes | 2 to 9 items (give every item image, or none) |
| `items[].title` | Title | yes | up to 70 characters |
| `items[].body` | Text | yes | up to 280 characters |
| `items[].image` | Photo. Cropped to a 3 by 2 shape. Give every idea a photo, or none. | no | a picture under /images/ with real alt text, shape 3:2 |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that says what this section covers",
  "items": [
    {
      "title": "A short title for the first idea",
      "body": "A sentence or two that explains the first idea in plain words."
    },
    {
      "title": "A short title for the second idea",
      "body": "A sentence or two that explains the second idea in plain words."
    },
    {
      "title": "A short title for the third idea",
      "body": "A sentence or two that explains the third idea in plain words."
    }
  ]
}
```

## Text section (`prose`)

A heading with a few paragraphs under it. Good for a story, a background or a longer explanation.

**Where it can go:** anywhere, up to 4 times; it sits close under the hero.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Paragraphs in a comfortable reading width.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |
| `paragraphs` | Paragraphs | yes | 1 to 8 items, each up to 900 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that says what this section covers",
  "paragraphs": [
    "A paragraph of plain text that describes itself.",
    "A second paragraph, also plain text, that continues the thought."
  ]
}
```

## Questions and answers (`faq`)

A heading and a list of questions that open to show their answers.

**Where it can go:** anywhere, once.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Questions open and close one by one; works without JavaScript.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |
| `items` | Questions | yes | 1 to 12 items |
| `items[].question` | Question | yes | up to 140 characters |
| `items[].answer` | Answer | yes | up to 900 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that introduces the questions",
  "items": [
    {
      "question": "A question a visitor might ask?",
      "answer": "A plain answer that describes itself."
    },
    {
      "question": "Another question a visitor might ask?",
      "answer": "A second plain answer."
    }
  ]
}
```

## Closing call to action (`closing-cta`)

The last block on a page: a heading, a line of text and one button that says what to do next.

**Where it can go:** last on the page, once.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Left-aligned, with a soft glow that blends it into the page.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |
| `body` | Text | no | up to 280 characters |
| `action` | Button | yes | button words up to 40 characters, and a link |
| `note` | Small note under the button | no | up to 160 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that invites the next step",
  "body": "One or two plain sentences that say what happens next.",
  "action": {
    "label": "A label that says what the button does",
    "href": "/contact"
  },
  "note": "A small reassuring line"
}
```

## Contact form (`contact-form`)

A booking column next to the site's contact form. The form itself is wired to the site's own settings.

**Where it can go:** anywhere, once; it sits close under the hero.

**Fixed anchor:** `#book` (links can point to it; it cannot be changed).

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): The booking column on the left, the form on the right (stacked on phones).

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Booking heading | yes | up to 60 characters |
| `body` | Booking text | yes | up to 400 characters |
| `buttonLabel` | Booking button label | yes | up to 40 characters |
| `unsetNote` | Note shown while no booking link is set. Visitors see this instead of a working button until the site's booking link is set up. | yes | up to 120 characters |

**Motion:** No entrance motion. People type here, so the form stays still and is usable the moment it appears.

**Example:**

```json
{
  "heading": "A short heading about booking a time",
  "body": "A sentence or two that says what a booking is for.",
  "buttonLabel": "A label that says what the button does",
  "unsetNote": "A note that says the booking link is not set up yet"
}
```

## Form (`form`)

One of the site's forms (a quote request, a download sign-up) in a panel, with an optional heading and a sentence above or beside it. The form's fields, button and thank-you message are in its own form file.

**Where it can go:** anywhere, once.

**Variants** (set with `variant`; the first is used when it is left out):

- `stacked` (default): The heading and intro above the form panel, in one centred column.
- `beside`: The heading and intro on the left, the form panel on the right (stacked on phones).

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `form` | Form. The id of a live form, other than the contact form. | yes | the id of a live form (never the contact form) |
| `heading` | Heading | no | up to 60 characters |
| `intro` | Intro | no | up to 300 characters |

**Motion:** No entrance motion. People type here, so the form stays still and is usable the moment it appears.

**Example:**

```json
{
  "form": "showcase-example",
  "heading": "A short heading that says what the form is for",
  "intro": "A sentence or two that says what happens after the visitor sends the form."
}
```

## Numbered steps (`steps`)

A heading and a short numbered list that says what happens, step by step. It can end with an email line.

**Where it can go:** anywhere, up to 2 times.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Numbers in green on the left, text in a comfortable reading width.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |
| `steps` | Steps | yes | 2 to 6 items |
| `steps[].lead` | Bold opening words | yes | up to 80 characters |
| `steps[].body` | Text | yes | up to 400 characters |
| `emailLabel` | Words before the email address. When given, the line shows the site's email address after these words. | no | up to 80 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that says what happens next",
  "steps": [
    {
      "lead": "The first step.",
      "body": "A sentence that describes the first step."
    },
    {
      "lead": "The second step.",
      "body": "A sentence that describes the second step."
    }
  ]
}
```

## Policy sections (`legal-sections`)

A run of titled sections for a policy or terms page, with an optional line at the end such as a last-updated date.

**Where it can go:** anywhere, once; it sits close under the hero.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Sections one after another in a comfortable reading width.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `sections` | Sections | yes | 1 to 20 items |
| `sections[].heading` | Section title | yes | up to 90 characters |
| `sections[].body` | Section text | yes | up to 3000 characters |
| `footnote` | Line at the end | no | up to 160 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "sections": [
    {
      "heading": "A short title for the first section",
      "body": "Plain text that describes what this section covers."
    },
    {
      "heading": "A short title for the second section",
      "body": "More plain text for the second section."
    }
  ],
  "footnote": "A short line at the end of the page"
}
```

## Video (`video`)

One video from YouTube or Vimeo, with a title and a short caption. It plays on the page when a visitor presses play.

**Where it can go:** anywhere, up to 4 times.

**Needs JavaScript:** The play button swaps in the player only when it is pressed, so nothing loads from YouTube or Vimeo before that.

**Variants** (set with `variant`; the first is used when it is left out):

- `wide` (default): As wide as the page column.
- `inset`: Narrower and centered, the width of a reading column.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `url` | Video address. A YouTube or Vimeo address. | yes | a YouTube or Vimeo address |
| `title` | Title | yes | up to 80 characters |
| `caption` | Caption | no | up to 200 characters |
| `poster` | Cover picture. Shown before play. Without one the video shows a plain dark panel. | no | a picture under /images/ with real alt text, shape 16:9 |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  "title": "A short title that says what the video shows",
  "caption": "A sentence that says what to expect before pressing play."
}
```

## Video grid (`video-grid`)

Two to six videos from YouTube or Vimeo side by side, each with a title and a short caption.

**Where it can go:** anywhere, up to 2 times.

**Needs JavaScript:** The play button swaps in the player only when it is pressed, so nothing loads from YouTube or Vimeo before that.

**Variants** (set with `variant`; the first is used when it is left out):

- `two-column` (default): The videos sit in two columns (one column on phones).
- `three-column`: The videos sit in three columns on wide screens (with three or more videos), two on tablets, one on phones.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading. Names the group of videos for everyone, including screen reader users. | yes | up to 90 characters |
| `videos` | Videos | yes | 2 to 6 items |
| `videos[].url` | Video address. A YouTube or Vimeo address. | yes | a YouTube or Vimeo address |
| `videos[].title` | Title | yes | up to 80 characters |
| `videos[].caption` | Caption | no | up to 200 characters |
| `videos[].poster` | Cover picture | no | a picture under /images/ with real alt text, shape 16:9 |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that introduces the videos",
  "videos": [
    {
      "url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      "title": "A short title for the first video",
      "caption": "A sentence about the first video."
    },
    {
      "url": "https://vimeo.com/1084537",
      "title": "A short title for the second video",
      "caption": "A sentence about the second video."
    },
    {
      "url": "https://youtu.be/aqz-KE-bpKQ",
      "title": "A short title for the third video",
      "caption": "A sentence about the third video."
    }
  ]
}
```

## Photo with text (`photo-text`)

One photo beside a heading, a few paragraphs and an optional button. Good for an about section, a place or a service.

**Where it can go:** anywhere, up to 4 times.

**Variants** (set with `variant`; the first is used when it is left out):

- `photo-start` (default): The photo sits on the left on wide screens, the text on the right. On phones the photo is above the text.
- `photo-end`: The photo sits on the right on wide screens, the text on the left. On phones the photo is above the text.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `image` | Photo. Cropped to a 4 by 3 shape. | yes | a picture under /images/ with real alt text, shape 4:3 |
| `heading` | Heading | yes | up to 90 characters |
| `paragraphs` | Paragraphs | yes | 1 to 4 items, each up to 600 characters |
| `action` | Button | no | button words up to 40 characters, and a link |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "image": {
    "src": "/images/examples/vase-and-pears.jpg",
    "alt": "Abstract still life: a pale vase and two pears in soft window light"
  },
  "heading": "A short heading that says what the photo is about",
  "paragraphs": [
    "A few sentences that tell the story behind the photo in plain words.",
    "A second paragraph for the detail a visitor would ask about next."
  ],
  "action": {
    "label": "A short button label",
    "href": "/contact"
  }
}
```

## Photo gallery (`gallery`)

Two to twelve photos in a grid, each with an optional caption. The photos do not open larger.

**Where it can go:** anywhere, up to 2 times.

**Variants** (set with `variant`; the first is used when it is left out):

- `three-column` (default): The photos sit three across on wide screens and two across on tablets and phones.
- `two-column`: The photos sit two across on wide screens and tablets, and one across on phones.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading. Names the group of photos for everyone, including screen reader users. | yes | up to 90 characters |
| `intro` | Introduction | no | up to 280 characters |
| `photos` | Photos | yes | 2 to 12 items |
| `photos[].image` | Photo. Cropped to a 3 by 2 shape. | yes | a picture under /images/ with real alt text, shape 3:2 |
| `photos[].caption` | Caption | no | up to 140 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that names the photos",
  "intro": "A sentence that says what the photos show.",
  "photos": [
    {
      "image": {
        "src": "/images/examples/vase-and-pears.jpg",
        "alt": "Abstract still life: a pale vase and two pears in soft window light"
      },
      "caption": "A short caption for the first photo."
    },
    {
      "image": {
        "src": "/images/examples/bowl-and-lemons.jpg",
        "alt": "Abstract still life: a shallow bowl with three lemons on a pale table"
      },
      "caption": "A short caption for the second photo."
    },
    {
      "image": {
        "src": "/images/examples/jug-and-cups.jpg",
        "alt": "Abstract still life: a tall jug beside two small cups in morning light"
      }
    },
    {
      "image": {
        "src": "/images/examples/stacked-books.jpg",
        "alt": "Abstract still life: a stack of books with a round glass paperweight on top"
      },
      "caption": "A short caption for the fourth photo."
    },
    {
      "image": {
        "src": "/images/examples/candle-and-plate.jpg",
        "alt": "Abstract still life: a candle in front of a plate, with a long soft shadow"
      },
      "caption": "A short caption for the fifth photo."
    },
    {
      "image": {
        "src": "/images/examples/window-light.jpg",
        "alt": "Abstract still life: a round stool and a plant pot beneath a bright window"
      }
    }
  ]
}
```

## Latest posts (`latest-posts`)

The newest blog posts, with a heading and an optional link to all of them. It updates by itself when a post is added, and is left out of the page while there is no post.

**Where it can go:** anywhere, once.

**Variants** (set with `variant`; the first is used when it is left out):

- `cards` (default): Each post is a card with its photo on top (a tinted panel with the date when it has no photo), then the date, title and summary.
- `list`: Each post is a row with its date, title and summary, divided by soft lines.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |
| `intro` | Introduction | no | up to 200 characters |
| `count` | How many posts. From 1 to 6. Three when left empty. | no | a whole number from 1 to 6 |
| `action` | Link to all posts | no | button words up to 40 characters, and a link |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading for the newest posts",
  "intro": "One sentence that says what the posts are about.",
  "count": 3,
  "action": {
    "label": "All posts →",
    "href": "/blog"
  }
}
```

## Post index (`post-index`)

The list of every blog post, newest first, ten to a page, with links to newer and older pages. It belongs on the blog page only, once.

**Where it can go:** anywhere, once; it sits close under the hero.

**Variants** (set with `variant`; the first is used when it is left out):

- `list` (default): Each post is a row with its date, title and summary, divided by soft lines.
- `cards`: The posts are cards in a grid, each with its photo on top (a tinted panel with the date when it has no photo).

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `emptyText` | Text while there are no posts. Shown on the blog page when no post is live yet. | yes | up to 160 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "emptyText": "No posts yet. The first one is on its way."
}
```

## Business details (`business-details`)

A heading and the business's address, phone, email and opening hours, read from the business details settings (business.json), so they are written once and stay the same everywhere. Parts that are empty are left out.

**Where it can go:** anywhere, once.

**Variants** (set with `variant`; the first is used when it is left out):

- `columns` (default): Address, contact and hours side by side on wide screens, stacked on phones.
- `compact`: Address, contact and hours in one narrow column.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "Where to find me"
}
```

## Video list (`video-list`)

The newest videos from your Videos collection, side by side, each with its title and caption. Add videos in the collection; this block shows them.

**Where it can go:** anywhere, up to 2 times.

**Needs JavaScript:** The play button swaps in the player only when it is pressed, so nothing loads from YouTube or Vimeo before that.

**Variants** (set with `variant`; the first is used when it is left out):

- `two-column` (default): The videos sit in two columns (one column on phones).
- `three-column`: The videos sit in three columns on wide screens (with three or more videos), two on tablets, one on phones.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading. Names the group of videos for everyone, including screen reader users. | yes | up to 90 characters |
| `intro` | Intro | no | up to 240 characters |
| `count` | How many. The newest this many videos are shown. Twelve when left empty. | no | a whole number from 1 to 24 |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that introduces the videos",
  "intro": "A sentence that says what the videos are about.",
  "count": 6
}
```

## Podcast episodes (`episode-list`)

The newest episodes from your Podcast episodes collection, each with its date and summary. Add episodes in the collection; this block shows them.

**Where it can go:** anywhere, up to 2 times.

**Needs JavaScript:** The play button swaps in the Spotify or Apple Podcasts player only when it is pressed, so nothing loads from them before that.

**Variants** (set with `variant`; the first is used when it is left out):

- `list` (default): One row per episode with its player beside the text on wide screens (below it on phones).
- `compact`: One row per episode with its date and a link that opens the episode on Spotify or Apple Podcasts. No player.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading. Names the list of episodes for everyone, including screen reader users. | yes | up to 90 characters |
| `intro` | Intro | no | up to 240 characters |
| `count` | How many. The newest this many episodes are shown. Ten when left empty. | no | a whole number from 1 to 24 |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that introduces the episodes",
  "intro": "A sentence that says what the show is about.",
  "count": 3
}
```

## Testimonials (`testimonials`)

Quotes from named clients, taken from your Testimonials collection in the order you set there. Every quote shows who said it.

**Where it can go:** anywhere, up to 2 times.

**Variants** (set with `variant`; the first is used when it is left out):

- `grid` (default): The quotes sit in cards, two across on tablets and three across on wide screens (one column on phones).
- `feature`: The first quote is large, in the accent serif. Any others sit in a row beneath it.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |
| `count` | How many. The first this many quotes are shown. All of them (up to twelve) when left empty. | no | a whole number from 1 to 12 |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading above what clients say",
  "count": 3
}
```

## Team (`team`)

The people from your Team collection, in the order you set there, with a photo, name, role and short bio.

**Where it can go:** anywhere, once.

**Variants** (set with `variant`; the first is used when it is left out):

- `grid` (default): A card per person with a tall photo (a tinted panel with their initials when there is no photo), name, role and bio.
- `list`: Names and roles in two columns, no photos.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |
| `intro` | Intro | no | up to 240 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that introduces the people",
  "intro": "A sentence about who you work with."
}
```
