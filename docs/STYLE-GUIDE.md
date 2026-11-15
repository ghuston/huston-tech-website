# Huston Logic: Design System v3 (style guide)

**Status:** authoritative from Nov 14, 2026. It **replaces STYLE-GUIDE v2 entirely** (bone, ink and rust; hairlines; centered hero). Where this file disagrees with v2, with the interim rules in Revision 7 §E3, or with any earlier component or stylesheet, this file wins. **Copy still comes only from Revision 7, Section B** (`claude/huston-tech-website-v1.md`); this guide never changes a word of it.

**Amended Nov 14, 2026 (Grant):** the hero eyebrow is now "Websites and workflows for small businesses" and the H1 is now "The site brings them in. *The system answers.*", matching Rev 7.1 (§3, §5, §10 and `reference/home-top.html` updated). §9.3 adds the scroll-driven header badge and lifts the matching bans in §9, §11, §12 and §13.

**Chosen direction:** Direction A, "Ring and stack", with two parts taken from Direction B: **the doors that swing open** (two-door band) and **the arc layout for the three steps**. Grant's pick, Nov 14.

**Source of truth, in order:**
1. `reference/home-top.html`: the approved first screen, the arc steps, the two-door band and the top of the next section, with every animation. In the project it is `claude/huston-logic-v3-reference.html`; copy it into the repo as `design-v3/reference/home-top.html`. The live preview is the "Huston Logic: style guide v3 reference" artifact. Compare your build side by side at 1440 × 900 and 390 × 844.
2. This document: the rules behind it, plus every component the reference doesn't draw.
3. The logo kit: Drive › Grant — Zoho Consulting & Business Systems › Logo › Huston_Logic_Logo_Kit › `01_Vector_SVG`. Copy `huston-logic-badge-black.svg`, `huston-logic-wordmark-black.svg` and `huston-logic-full-black.svg` into `public/brand/`. **Never redraw the mark.** The ring, the dot and the HL are three subpaths of the badge's single path (§6.1).

**The reference is not the build.** Its top bar (Motion on / Reduced motion / Replay) and the dark notes block are review tools; don't ship them. Its band website, "Dana Ortiz" and the other names inside the cards are stand-ins (§5.3).

### What changed from v2, and what it resolves

| v2 / Rev 7 interim | v3 | Resolves |
|---|---|---|
| Bone `#F6F4EE` background, `band` bands | Cool silver `#F3F5F4` and white; no full-bleed tinted bands. Sections blend through soft green glows that straddle their edges | E9 #14 (cream + serif + rust flagged as an AI default) |
| Hairlines, radius 0, no shadows, no cards | Soft cards with radius and a green-tinted shadow, used only where something is a thing you could hold (a page, a door, a screenshot). Text sections stay unboxed | E9 #14 |
| IBM Plex Mono caps eyebrows, mono step numbers and labels | No mono face. Eyebrows and labels are Outfit 500 in sentence case, in green | E9 #14 |
| Inter Tight 800 display | **Outfit** 700 (its round geometry matches the wordmark) | n/a |
| Second voice: Newsreader italic in rust | **Kept.** Newsreader italic 400, rust, on its own line | n/a |
| Hero centered, no buttons on desktop | Left-aligned hero with the card stack on the right; two compact doors in the first screen | Brief ("informative up front") |
| Supporting line: mono caption (interim) | A white pill with a tick icon, under the subhead | E9 #11 |
| Review band / interim two-halves door band | **Swinging doors** (§7.8), `id="hello"` | E9 #12 |
| Framed screenshots only | Image-led website case study and Home website cards on the tilt-and-glow card (§7.17, §7.18) | E9 #13 |
| Three-column framework diagram in a hairline frame | **The arc** (§7.7): the three steps sit on a piece of the logo's ring | n/a |
| Big-number Proof strip on a band | Proof chips (§7.15) | E9 #14 |
| Wordmark text in Inter Tight | The real logo: badge + wordmark SVG | Brief |

Kept from v2 on purpose: the two-voice rule (three H2s plus the H1), the scope / shape / ship icon geometry and its animations, the slow-and-once motion pacing, native scrolling only, SVG arrows that point where they go, and the 44px tap-target rule.

---

## 1. Remove v2: this is a replacement, not a reskin

Delete from the codebase (CSS, Tailwind config, `design-v2/src/styles/huston.css` imports, components). Don't keep them "for later":
- **Fonts:** Inter Tight, IBM Plex Mono.
- **Tokens:** `--ht-bone #F6F4EE`, `--ht-band #E8E9E0`, `--ht-rule #C0C2B4`, and the `--u` scaling unit with its 1784px mockup math. v3 uses real px with fluid clamps (§4).
- **Components:** `ReviewBar`; the hairline-framed `ProcessSteps` compact layout; the band-backed `ProofStrip`; any text wordmark (`<span>Huston Logic</span>` styled as a logo).
- **Patterns:** mono caps labels (`text-transform: uppercase` + mono), the centered hero, full-bleed `band` sections, and 1px `rule` dividers as the main structure.
- Keep `LineIcon.tsx` (renamed scope / shape / ship), `Arrow.tsx` and the `IntersectionObserver` hook, then restyle them to this guide.

Old-to-new token map, for the find-and-replace:

| v2 | v3 |
|---|---|
| `--ht-bone` | `--hl-silver` |
| `--ht-band` | `--hl-silver-2` (footer, quiet panels only) |
| `--ht-ink` | `--hl-ink` (same hex) |
| `--ht-rust` | `--hl-rust` (same hex, narrower use) |
| `--ht-rule` | `--hl-line` (decorative only) |
| `#FBFAF7` form field | `--hl-white` |

---

## 2. Color

Two families: **silver and white** are the surface people see; **green** is what's behind it (glows, the door edges, icons, labels). **Rust** is the one warm note: the second voice and the dot. Text is `ink` unless a rule below says otherwise.

| Token | Hex | Use |
|---|---|---|
| `--hl-silver` | `#F3F5F4` | Page background |
| `--hl-silver-2` | `#E8EEEA` | Footer background; the "Try this this week" panel; quiet panels. Never a full-bleed mid-page band |
| `--hl-white` | `#FFFFFF` | Cards, the door leaves, chips, pills, form fields, arc stations and track |
| `--hl-ink` | `#29332D` | All body and heading text; primary button fill; the logo |
| `--hl-ink-2` | `#4A5750` | Secondary text (timestamps, captions, small print, attributions); form-field borders |
| `--hl-green` | `#2B6455` | Eyebrows, step numbers, line-art icons, tags, secondary text links, the tick in the supporting-line pill |
| `--hl-green-deep` | `#1E4A3D` | Behind the doors (gradient stop); dark green surfaces |
| `--hl-green-edge` | `#4E9A7C` | Lit edge of the door gradient. Decorative only, never text |
| `--hl-tint` | `#E6F1EB` | Tag and chip fills; the stop-point callout; the selected row in the hero spreadsheet card |
| `--hl-glow` | `#B4DEC8` | Glow core (used only inside radial gradients, at ≤ 0.8 alpha) |
| `--hl-mint` | `#CDE6D8` | Glow falloff; the cursor glow on tilt cards |
| `--hl-rust` | `#994D34` | The second voice; the ring's dot, the arc's dot and the door knobs; slow underlines; focus rings; the testimonial quote mark; form errors |
| `--hl-line` | `#D3DAD6` | Borders on pills, compact doors and chips; fading dividers. **Decorative only** |

```css
:root{
  --hl-silver:#F3F5F4; --hl-silver-2:#E8EEEA; --hl-white:#FFFFFF;
  --hl-ink:#29332D; --hl-ink-2:#4A5750;
  --hl-green:#2B6455; --hl-green-deep:#1E4A3D; --hl-green-edge:#4E9A7C;
  --hl-tint:#E6F1EB; --hl-glow:#B4DEC8; --hl-mint:#CDE6D8;
  --hl-rust:#994D34; --hl-line:#D3DAD6;
}
```

**Contrast (WCAG 2.2, computed):**

| Pair | Ratio | Passes for |
|---|---|---|
| `ink` on `silver` / `white` / `silver-2` / `tint` | 11.9 / 13.1 / 11.1 / 11.3 | All text |
| `ink` on the strongest glow (`#BDE1CE`, composited) | 9.2 | All text |
| `ink-2` on `white` / `silver` / `silver-2` | 7.6 / 6.9 / 6.4 | All text |
| `green` on `white` / `silver` / `tint` / `silver-2` | 6.9 / 6.3 / 5.9 / 5.8 | All text |
| `green` on the strongest glow | 4.85 | All text (just). Keep green text ≥ 15px there |
| `rust` on `white` / `silver` / `tint` / `silver-2` | 6.1 / 5.5 / 5.2 / 5.2 | All text |
| **`rust` on the strongest glow** | **4.28** | **Large text only** (≥ 24px, or ≥ 18.66px bold). The second voice is always ≥ 32px, so it passes. **No small rust text over a glow** (errors, links, labels) |
| `silver` label on `ink` button | 11.9 | All text |
| `ink-2` field border on `white` | 7.6 | Non-text 3:1 ✓ |
| `rust` focus ring on `silver` / `white` | 5.5 / 6.1 | Non-text 3:1 ✓ (the ring sits outside the element, on the page background) |
| `line` on `silver` | 1.3 | Decorative only. Never the only boundary of a control |
| Placeholder `#3A3200` on `#FFF3B0` | 11.4 | Dev-only placeholder chip |

**Glows** are the only gradients on the site, and they are always `radial-gradient(closest-side, …)` on a positioned, non-interactive `div` (no images, **no `filter: blur()`**, no `backdrop-filter`). Three recipes:

| Name | Size | Gradient | Where |
|---|---|---|---|
| `glow-green` | 900 × 900 | `rgba(180,222,200,.75)` → `rgba(205,230,216,.35)` 55% → `rgba(243,245,244,0)` | Hero: behind the card stack, `right:-260px; top:-120px` of the hero |
| `glow-white` | 1100 × 760 | `rgba(255,255,255,.95)` → `rgba(255,255,255,0)` | Seam between hero and steps: `left:-380px; top:520px` of the steps section |
| `glow-seam` | 1300 × 900 | `rgba(176,220,197,.8)` → `rgba(205,230,216,.4)` 50% → `rgba(243,245,244,0)` | Centered on the top edge of the door band (`top:-260px`), so it spans the steps→doors seam |

**Glow rules:**
- A glow sits **on a seam** between two sections (or behind the hero stack), never in the middle of a text column.
- One glow per seam. At most three in any 1440 × 900 viewport.
- Sections have **no background color of their own**: the page is one continuous silver sheet, and the glows do the blending. That's the "blurred edges, not blocks" rule from the brief.
- Mobile: scale each glow to about 55% of its desktop size; keep the same positions relative to the seam.

---

## 3. Typography

Three families, **three font files**, self-hosted with `next/font/google` (latin subset, `display: 'swap'`, fallback metrics on).

| Role | Family | Weights / style | File | Used for |
|---|---|---|---|---|
| Display + UI | **Outfit** | 500, 600, 700 (one variable file) | preload | H1 line 1, every single-voice heading, H2 line 1, nav, buttons, eyebrows, labels, step numbers, chips, tags |
| Text | **Inter** | 400, 500 (one variable file) | preload | Body, subhead, step lines, door lines, card text, forms |
| Second voice | **Newsreader** | **italic 400 only** (one file) | preload | H1 line 2, the second line of the three two-voice H2s, testimonial quotes and pull quotes |

```ts
// src/lib/fonts.ts
export const outfit = Outfit({ subsets:['latin'], weight:['500','600','700'], variable:'--font-display', display:'swap' })
export const inter = Inter({ subsets:['latin'], weight:['400','500'], variable:'--font-text', display:'swap' })
export const newsreader = Newsreader({ subsets:['latin'], style:['italic'], weight:['400'], variable:'--font-voice', display:'swap' })
```

**Type scale.** Values are at 1440px wide (measured in the reference) and below 768px. Between those, use the clamp where one is given; otherwise the desktop value holds down to 768.

| Element | Desktop | Line height | Tracking | Mobile (< 768) |
|---|---|---|---|---|
| H1 line 1 (Outfit 700) | `clamp(40px, 4.15vw, 60px)` → 59.8 at 1440 | 1.0 | −0.035em | 40 |
| H1 line 2 (Newsreader italic, rust) | 1.07em of line 1 → 64 at 1440 | 1.08 | −0.02em | 1.07em → 42.8 |
| H2 two-voice, line 1 (Outfit 700) | `clamp(32px, 3.5vw, 50px)` | 1.04 | −0.035em | 32 |
| H2 two-voice, line 2 (Newsreader italic, rust) | 1.07em of line 1 | 1.1 | −0.02em | 1.07em |
| H2 single-voice (Outfit 700) | `clamp(30px, 3vw, 44px)` | 1.08 | −0.03em | 30 |
| Inner-page H1 (Outfit 700, single voice) | `clamp(36px, 3.6vw, 52px)` | 1.04 | −0.035em | 36 |
| H3 / door title (Outfit 700) | 36 | 1.1 | −0.03em | 28 |
| Step verb on the arc (Outfit 700) | 40 (32 at 900–1100) | 1.05 | −0.035em | 30 |
| Card / item title (Outfit 600) | 22 | 1.25 | −0.01em | 20 |
| Eyebrow (Outfit 500, green, sentence case) | 16 | 1.3 | 0 | 16 |
| Nav link (Outfit 500) | 15.5 | 1 | 0 | 20 in the menu |
| Button (Outfit 600) | 17 | 1 | 0 | 17 |
| Step number "01" (Outfit 600, green) | 15 | 1 | 0.02em | 14 |
| Hero subhead (Inter 400) | 20 | 1.5 | 0 | 18 |
| Body (Inter 400) | 18 | 1.6 | 0 | 17 |
| Step line, door line (Inter 400) | 19 | 1.4 | 0 | 17 |
| Small / caption (Inter 400, `ink-2`) | 14 | 1.45 | 0 | 14 |
| Tag (Outfit 600, green on `tint`) | 11.5 in the hero cards, 13 elsewhere | 1 | 0 | same |
| Testimonial quote (Newsreader italic 400, `ink`) | 24 | 1.4 | −0.005em | 20 |

**Measure:** body text max 66ch; the hero subhead max 29em (two lines at 1440); door lines never exceed the leaf width minus the 48px knob gutter.

**The two-voice rule.** Line 2 is always Newsreader italic 400 in `rust`, on its own line (`display:block`), directly under line 1 with no gap. On desktop (≥ 1101px) the H1's line 2 must not wrap (`white-space: nowrap`). On phones, with the Nov 14 H1, line 1 wraps to two lines and line 2 fits on one, so the hero H1 still runs three lines at 390px (measured in the reference). The treatment appears on exactly these four headings (copy from Rev 7 B1):
- H1: "The site brings them in. *The system answers.*"
- "You've been busy with the real work. *Your website and your inbox can tell.*"
- "Same three steps, *website or workflow.*"
- "Twenty minutes. *Worst case, you get one good idea.*"

Every other heading is single-voice Outfit 700 in `ink`. Never put rust on a whole heading, and never italicize a word inside a heading.

**Labels.** Sentence case everywhere. No `text-transform: uppercase`, no letter-spaced caps, no mono. The door titles keep their quotation marks (they're the visitor speaking); use typographic quotes `“ ”`.

---

## 4. Space, shape, depth, grid

**Spacing scale (px):** 4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 56 · 64 · 72 · 96 · 110 · 120. Nothing off-scale except the measured first-screen values in §5.

**Container:** `max-width: 1320px`, centered, padding 40px each side (20px below 768) → a 1240px content column at full width. Every section uses it; nothing is full-bleed except glows and the footer background.

**Section rhythm:** 96px vertical padding by default (64 below 768). The measured Home exceptions: steps 72 top, door band 64 top / 110 bottom.

**Breakpoints:** 1101+ (desktop), 900–1100 (narrow desktop), 768–899 (tablet), < 768 (phone). See §10.

**Radius:**

| Token | Value | Use |
|---|---|---|
| `--hl-r-field` | 10 | Inputs, textareas, selects |
| `--hl-r-btn` | 12 | Buttons |
| `--hl-r-card` | 14 | Hero cards, compact doors, chips' outer box (12), screenshots, callouts, tilt cards |
| `--hl-r-door` | 18 | Door leaves and their backing |
| `--hl-r-panel` | 22 | Large panels (contact form, "How to read this page") |
| `--hl-r-pill` | 999 | Supporting-line pill, tags, radio chips |

**Shadows** are always green-tinted (`rgba(31,61,49,…)`), never grey `rgba(0,0,0,.1)`:

| Token | Value | Use |
|---|---|---|
| `--hl-shadow-card` | `0 30px 50px -30px rgba(31,61,49,.5), 0 2px 6px rgba(31,61,49,.06)` | Hero stack cards, tilt cards |
| `--hl-shadow-lift` | `0 14px 28px -22px rgba(41,51,45,.45)` (hover: `0 20px 32px -22px rgba(41,51,45,.5)`) | Compact hero doors |
| `--hl-shadow-chip` | `0 18px 30px -18px rgba(31,61,49,.55)` | Proof chips |
| `--hl-shadow-door` | `0 40px 60px -40px rgba(31,61,49,.55)` | Door band |

**Cards vs. no cards.** A box is allowed only when the thing is an object: a page or screenshot, a message, a spreadsheet, a door, a chip, a form. Lists of ideas (problems, services, "Why people hire me", the FAQ, testimonials) are **not** boxed; they are separated by **fading dividers**: 1px lines drawn as `linear-gradient(rgba(41,51,45,0), rgba(41,51,45,.22) 30%, rgba(41,51,45,.22) 70%, rgba(41,51,45,0))` (vertical) or `linear-gradient(90deg, rgba(41,51,45,.22) 60%, rgba(41,51,45,0))` (horizontal).

---

## 5. Layout: the Home first screen (measured at 1440 × 900)

y is measured from the top of the page. The header is sticky.

```
y=0    ┌ header (silver 97%, 72 tall) ───────────────────────────────────────────────┐
       │ [badge 34][10][wordmark 129×21] at x=100      How I work · Websites · Workflows ·
       │                                               Past work · About · Say hello ↘ (right edge x=1340)
y=72   ├──────────────────────────────────────────────────────────────────────────────┤
       │  LEFT COLUMN x=100, 715 wide              │  STAGE x=863, 477 × 600, y=136–736   │
y=224  │  Websites and workflows for small businesses │   ring 800×800 centred on the     │
y=263  │  The site brings them in.    (60, Outfit) │      stage (centre x≈1125, y≈464),   │
y=324  │  The system answers.          (64, rust)  │      dot at the gap (upper right)    │
y=419  │  Custom websites for small businesses,    │   inbox card    (-4°)  y≈116         │
       │  and the follow-up that turns… (20/1.5)   │   SITE CARD (front, 409×240) y≈237   │
y=499  │  ( ✓ AI-accelerated, checked by hand. )   │   5/5 chip      y≈457                │
y=565  │  [ “I need a website.”  ][ “Things keep   │   reply card    (+3°)  y≈492         │
       │    Start a website →    ]  slipping.” …  ]│   sheet card  (-2.5°)  y≈615         │
y=648  │   (two 250-wide compact doors, 14 gap)    │                                      │
y≈808  ├─ steps section (no edge: the white glow carries across) ────────────────────────┤
       │  the arc, 1240 × 470, starts y≈880                                               │
```

**Rules:**
- **Grid:** `grid-template-columns: minmax(0,1.5fr) minmax(0,1fr)`, gap 48, `align-items: center`, padding 64 top / 72 bottom. The text column sits above the ring (`z-index: 2`); the ring sits behind the stack (`z-index: -1` inside the stage).
- **Vertical gaps (text column):** eyebrow → H1: 18 · H1 → subhead: 26 · subhead → pill: 20 · pill → compact doors: 30.
- **Supporting line** ("AI-accelerated, checked by hand.") is the pill under the subhead (§7.4). It appears only here.
- **The stage** is 477 wide (the front card 409 plus card overhangs) × 600 tall, fixed, with `perspective: 1300px`. Its height is fixed so nothing shifts when the cards animate (CLS 0).
- **Density:** no more than these seven things in the first screen: eyebrow, H1, subhead, pill, two compact doors, the stack. No secondary links, no badges, no logos of other companies.
- **Below 1101px** the stage moves under the text column, centered, 478 wide. **Below 768px:** see §10.

### 5.1 The card stack (component `HeroStack`)

The H1 drawn as a picture: in front, a client's website; behind it, the workflow it feeds. One `figure` with `role="img"` and this `aria-label`: "A band's website in front. Behind it: the owner's inbox, a spreadsheet row and an automatic reply, all set off by one message through the contact form." The cards inside are `aria-hidden` content (they are a picture, not page text).

| Card | Position in stage (left, top, width) | Rotation | Depth | Content |
|---|---|---|---|---|
| Inbox | −34, −20, 276 | −4° | `translateZ(-30px)` | Tag "Your inbox" · **New inquiry from the website** · 9:41 pm · "Dana Ortiz: Wedding, June 6. Are you free?" |
| Spreadsheet | −36, 486, 300 | −2.5° | `translateZ(-20px)` | Tag "A spreadsheet you own" · a 3-row table; the newest row highlighted in `tint`, Inter 500 |
| Reply | 196, 362, 282 | +3° | `translateZ(-10px)` | Tag "An automatic reply, right away" · **Got it, thanks** · 9:41 pm · "Hi Dana, your note reached the band. You'll hear back within one business day." |
| **Site (front)** | 56, 104, 400 | 0° | `translateZ(30px)` | Browser bar + a band website: nav, a serif headline, show dates, a "Book the band" form with the same inquiry typed in |
| Proof chip | −44, 318 | 0° | `translateZ(60px)` | Green dot · **5/5 on handoff & training** · "Systems projects, 2024–2025" |

- Cards: `white`, radius 14, 1px `rgba(41,51,45,.1)` border, `--hl-shadow-card`, Inter 12/1.4; tags per §7.15.
- **The front card's palette belongs to the client, not to Huston Logic.** It's the only place on the site where other colors appear (the reference uses navy `#1C2233`, cream `#F3EADB` and amber `#E0A458`), scoped to the card as local custom properties. Never reuse them elsewhere.
- **Stand-in content.** "The Night Herons", "thenightherons.example", "Dana Ortiz" and the show dates are invented. When the band site (W3) is live and the owner approves, swap in its real name, palette and headline, still built as HTML, not a screenshot (an image here would become the LCP element and cost the Lighthouse gate). Until then keep the stand-ins; they contain no real person's data.
- The reply card is written in the client's voice (the band), so it avoids "we" and "I" deliberately.

### 5.2 The ring behind the stack

The badge's ring and dot, without the HL, drawn at 800 × 800 behind the stack, in `white` at 0.85 opacity (ring) and `rust` (dot). Use the badge path's first two subpaths unchanged (§6.1). On load the dot travels the ring to its gap (§9). It's decorative: `aria-hidden="true"`.

---

## 6. Signature elements

These are what make the site Huston Logic's and not a template. Use them exactly here and nowhere else.

### 6.1 The mark's geometry

`huston-logic-badge-black.svg` is one path with three closed subpaths. Split it on `Z` (the reference's build script does this):
1. **Ring** (starts `M 744.5 792.9`): the open circle.
2. **Dot** (starts `M 955.129 190.377`): sits in the ring's gap at about 1 o'clock.
3. **HL** (starts `M 565.247 424.75`).

The badge's own `viewBox` is `386.789 54.986 760.365 760.365`; the ring's center is about (766.97, 435.17). To draw ring + dot centered at the origin: `viewBox="-380.18 -380.18 760.36 760.36"` and `transform="translate(-766.97 -435.17)"` on the paths. Rotating the dot's group around (0, 0) moves it along the ring.

| Use | What | Where |
|---|---|---|
| Header | Badge (34px) + wordmark (21px tall) | Every page |
| Favicon | Badge, black on transparent; a 180px apple-touch icon on `silver` | Site-wide |
| Hero ring | Ring + dot, 800px, white + rust | Home hero only |
| Arc | A section of a 1500px-radius circle, track in white, dot in rust | Home compact steps |
| Door knob | A 12px rust dot | Door band |
| About photo | Ring + dot around the headshot | About teaser, About page |
| Inner-page hero | A quarter of the ring, white, 520px, top-right, no dot, static | Every inner page |

### 6.2 Glows (§2) and the card stack (§5.1)

### 6.3 The tilt-and-glow card

Grant liked the tilting cards with a glow that follows the cursor (from Direction A's door band). Since the doors now swing, the effect moves to the **cards that show real work**:
- Home: the two case-study teasers (Hideout Fitness, Irvine Family Counseling) and the three Recent websites cards (once live).
- Past Work: the hero screenshot of each website case study.

Spec: white card, radius 14, `--hl-shadow-card`. On a fine pointer, it tilts toward the cursor (max **3°** on each axis, eased by 0.12 per frame, settling flat on leave), and a 420px mint glow (`radial-gradient(420px circle at var(--mx) var(--my), rgba(205,230,216,.55), rgba(205,230,216,0) 60%)`) follows the cursor under the content, fading in over 400ms. Keyboard focus on the card's link shows the glow centered (no tilt). Nowhere else: not on buttons, testimonials, the form or the doors.

---

## 7. Components

Names are the React components Claude Code should create or rename. Copy for each is in Rev 7 Section B.

### 7.1 Header (`Header`)
- Sticky (`top: 0`), 72px tall, background `rgba(243,245,244,.97)`, `box-shadow: 0 1px 0 rgba(41,51,45,.06)`. **No `backdrop-filter`.**
- Left: logo link (badge 34 × 34 + 10 gap + wordmark 21px tall, `aria-label="Huston Logic, home"`), min 44px tall.
- Right: six text links in Outfit 500 15.5, gap 30, each 44px tall: How I work · Websites · Workflows · Past work · About · **Say hello** + ↘ arrow (→ `/#hello`; on Home it scrolls smoothly to the band with a 110px offset, instant under reduced motion).
- Hover and focus: the slow underline (§7.10). The current page's link keeps its underline drawn (`aria-current="page"`).
- No button, pill, tint or border.
- **Mobile (< 768):** 60px tall; badge 30 + wordmark 18; a "Menu" text button (Outfit 500 16, 44px target). It opens a full-width panel under the header on `silver`, with the six links at 20px, each 56px tall, separated by fading dividers. `aria-expanded` and `aria-controls` on the button; Escape closes it; focus returns to the button.

### 7.2 Hero (`Hero`): §5.

### 7.3 Eyebrow (`Eyebrow`)
Outfit 500 16, `green`, sentence case, 18px above the heading. Only where Rev 7 has an eyebrow line.

### 7.4 Supporting-line pill (`SupportingLine`)
Inline-flex pill: white at 0.8 opacity, 1px `line` border, radius 999, padding 8 / 14 / 8 / 10, gap 9; an 18px tick-in-circle icon in `green` (1.75 stroke); text Outfit 500 15 `ink`: "AI-accelerated, checked by hand." It isn't a link and isn't interactive.

### 7.5 Compact hero doors (`HeroDoors`)
Two links side by side (`grid-template-columns: repeat(2, minmax(0,250px))`, gap 14), each a white card: radius 14, 1px `line` border, padding 16 / 18, `--hl-shadow-lift`.
- Title: the door title with its quotes, Outfit 600 17, `ink`.
- Below it, 8px gap: the button label as a text link in Outfit 500 15 `green`, with a slow rust underline and → ("Start a website" → `/contact?topic=website`; "Fix a workflow" → `/contact?topic=workflow`). The whole card is the link.
- Hover / focus-visible: lift 2px and the deeper shadow (250ms ease-out), the underline draws, the arrow nudges.
- **Mobile:** stacked full width; then a text link "Book a free call →" (Rev 7 E8's mobile action) under the doors, 44px tall.

### 7.6 Card stack (`HeroStack`): §5.1, motion §9.

### 7.7 The arc: compact three steps (`ProcessSteps variant="arc"`, Home only)

The three steps sit on a white track that is a piece of a 1500px-radius circle, falling from top left to bottom right; the rust dot travels it once and comes to rest in a gap just past Ship it.

- Section: padding 72 top, 0 bottom; a visually hidden H2 "How it works: Scope it, Shape it, Ship it". The steps are an `<ol>`.
- **Arc box:** the full content width (1240 at 1440), `aspect-ratio: 1240 / 470`, `position: relative`. The SVG (`viewBox="0 0 1240 470"`, `aria-hidden`) is absolutely positioned over it.
- **Track** (two paths, so the dot has a gap): white stroke 16, round caps, no fill.
  - `M 46.5 25.1 A 1500 1500 0 0 0 1104.9 413.6`
  - `M 1152.0 411.3 A 1500 1500 0 0 0 1287.0 396.3` (runs past the content edge on purpose; the section clips nothing)
- **Dot:** `circle cx=1128.4 cy=412.6 r=8`, `rust`, inside `<g style="transform-origin:1054.7px -1085.6px">` (the circle's center), so rotating the group moves the dot along the track.
- **Stations:** 74px white circles (`box-shadow: 0 0 0 1px rgba(41,51,45,.08)`), each holding its 52px icon in `green`, centered on the track at (left %, top %) of the arc box: 01 (8.95, 17.11) · 02 (38.07, 63.13) · 03 (74.23, 86.90).
- **Text blocks** (width 300, top-left at): 01 (13.95%, −3.32%) · 02 (42.59%, 31.21%) · 03 (71.81%, 44.35%). Each: the number (Outfit 600 15 `green`, `aria-hidden`), the verb as `h3` (Outfit 700 40), the line (Inter 19/1.4).

| # | Verb | Line | Icon |
|---|---|---|---|
| 01 | Scope it | Plan and price, before I build. | `scope` |
| 02 | Shape it | Built, then I try to break it. | `shape` |
| 03 | Ship it | Live, and the logins are yours. | `ship` |

- **900–1100px:** text width 240, verb 32, line 17.
- **Below 900px** the arc becomes a vertical track: a 16px white bar at the left (x 29–45 within the list), each `li` a grid row `74px 1fr` (station, then the text), gap 28 between rows, and the rust dot (16px) resting at the bottom of the track. No arc SVG.

### 7.8 Two-door band (`DoorBand`, replaces `ReviewBar`; `id="hello"`)

Two doors side by side (gap 28) on the `glow-seam` glow. Each door is a white leaf hung on a green frame; on hover or keyboard focus the leaf swings open on its left hinge and shows the green behind it. The rust knob is the logo's dot.

```html
<section class="doors" id="hello" aria-label="Two ways to start">   <!-- see note on the label -->
  <div class="door"><div class="leaf">
    <h2>“I need a website.”</h2>
    <p>Custom, from [[$750]]. The contact form writes back.</p>
    <a class="btn" href="/contact?topic=website">Start a website →</a>
  </div></div>
  …
</section>
```

- **Frame (`.door`):** radius 18, `padding-right: 10px` (a 10px sliver of green always shows at the right edge), background `linear-gradient(90deg, #17392F, var(--hl-green-deep) 60%, var(--hl-green-edge))`, `perspective: 1500px`, `--hl-shadow-door`.
- **Leaf (`.leaf`):** min-height 300, padding 40 / 48 / 36 / 44, background `linear-gradient(100deg, #fff, #F7F9F8)`, 1px `rgba(41,51,45,.12)` border, radius 18, `transform-origin: 0 50%`, flex column; the button sits at the bottom (`margin-top: auto`).
- **Knob:** `::after`, 12px `rust` circle, 24px from the right edge, vertically centered. Decorative.
- **Text:** title as `h2` (Outfit 700 36, the quotes are copy); line Inter 19/1.45 with 24px right padding (clears the knob); primary button (§7.10), `ink`.
- **Swing:** `.door:hover .leaf, .door:focus-within .leaf { transform: rotateY(14deg) }`, 600ms `cubic-bezier(.2,.7,.2,1)`. Only `transform` animates.
- **Buttons** carry the topic links: "Start a website →" → `/contact?topic=website`, "Fix a workflow →" → `/contact?topic=workflow`. Fire `door_click` with `website` / `workflow`.
- `[[$750]]` renders as the dev placeholder chip (§7.27) until confirmed.
- **Accessible name:** Rev 7 has no heading for the band, so don't add visible copy. `aria-label="Two ways to start"` on the section is interface text and needs Grant's OK; if he declines, drop the label and let the two `h2`s carry the structure.
- **Mobile (< 768):** the doors stack (website first, gap 18), 8px green sliver, leaf padding 28 / 40 / 28 / 24, knob 16px from the right, title 28, line 17, full-width buttons, **no swing**.

### 7.9 Next-section join
The section after the band starts on the same silver with no edge; the seam glow above carries over it. Never put a divider, background change or `hr` between Home sections.

### 7.10 Buttons, links and arrows
- **Primary button (`Button`):** `ink` fill, `silver` label, Outfit 600 17, height 54, padding 0 24 0 22, radius 12, trailing arrow. Inline-flex; full width below 768 where a component says so. Hover / focus-visible: the label's slow underline draws in `silver` and the arrow nudges. No color change, no shadow, no scale.
- **Text link (`TextLink`):** Outfit 500 (in UI) or inherits (in body text), color `green` for standalone links and `inherit` inside paragraphs. Trailing arrow where Rev 7 has one.
- **The slow underline** (every link and button): a `linear-gradient(var(--hl-rust), var(--hl-rust))` background, 1.5px tall, sitting 3px under the text (`padding-bottom: 3px`), `background-size: 0 1.5px` at `right` → `100% 1.5px` at `left` on `:hover` and `:focus-visible`, transition `background-size .5s cubic-bezier(.2,.7,.2,1)`. It draws left to right and retracts to the right. Works across wrapped lines (it's a background on an inline `span`). Inside paragraphs, links also carry a permanent 1px `rgba(41,51,45,.35)` underline (`text-underline-offset: .25em`) so they're findable without hover; the rust underline draws over it.
- **Arrows** are inline SVG from `Arrow.tsx`, 0.8em, stroke 1.75, round caps: → goes to another page, ↘ jumps to a section on the page, ↓ downloads. The arrow alone nudges 3px in its direction (150ms ease-out) on hover and focus.
- **Focus ring:** 2px solid `rust`, offset 3px, radius 4 (follows the element's radius on cards and doors). Never removed.

### 7.11 Problems grid (`ProblemGrid`, "Sound familiar?")
Eyebrow + two-voice H2. Six cells, 3 × 2 on desktop (gap 48 / 56), 1 column below 768. **No cards.** Each cell: the problem in Outfit 600 22/1.25 `ink`, then the supporting line in Inter 17/1.55. Fading vertical dividers between columns, fading horizontal divider between rows. Below the grid: the line plus a primary "Book a free call →" button.

### 7.12 What I do (`ServiceGroups`)
Single-voice H2 and the intro paragraph (max 60ch). Two equal groups side by side (gap 64), stacked on mobile (Websites first), each with an Outfit 700 28 heading. Items: title Outfit 600 20, line Inter 17. A fading horizontal divider between items. Each group ends with its text link. No icons, no cards, no price badge (the price lives in the item title as copy).

### 7.13 "Already on Zoho?" callout (`ZohoCallout`)
One line on a `tint` panel, radius 14, padding 20 / 24: the bold lead in Outfit 600 `green`, the sentence in Inter 17 `ink`, the text link at the end. No border, no left rule, no icon.

### 7.14 Testimonials (`TestimonialRow`)
Three columns (gap 48) with fading vertical dividers; one column on mobile. Each:
- Tag "Systems project" (§7.15) on top.
- Quote in Newsreader italic 400 24/1.4 `ink`, with a hanging rust `“` (Newsreader italic, 1.6em, positioned `left: -0.5em`) and no closing glyph added by CSS. Render the text exactly as stored (Rev 7 E5).
- Name Outfit 600 17 `ink`; role and business Inter 14 `ink-2`; industry Inter 14 `ink-2`.
- No photos, cards, carousel or stars.

### 7.15 Tags, chips and the proof chips (`Tag`, `ProofChips`)
- **Tag:** inline pill, Outfit 600 13 (11.5 in hero cards), `green` on `tint`, padding 5 / 9, radius 999. Used for: "Systems project", the hero card labels, the case-study meta.
- **Proof chip:** white, radius 12, 1px `rgba(41,51,45,.1)` border, `--hl-shadow-chip`, padding 10 / 14, a 9px `green` dot, then the figure in Outfit 600 14 and its label in Inter 12 `ink-2`.
- **Proof chips** replace the v2 Proof strip: a row of three chips (wrap on mobile) carrying Rev 7's three figures ("3 of 3 clients said the project met the goals set at kickoff", "5/5 on communication", "5/5 on handoff & training"), followed by the small print in Inter 14 `ink-2`. On the page background, not on a band.

### 7.16 Case-study teasers (`CaseStudyTeaser`)
Two tilt-and-glow cards (§6.3) side by side: the screenshot (when supplied, blurred names) at the top in a 16:10 frame, radius 10 inside the card's 14; then the business in Outfit 600 20, the one-line description in Inter 17, and the "Read the project →" text link. Until screenshots exist, the card shows text only (no placeholder image).

### 7.17 Recent websites cards (`WebsiteCards`, Home)
Three tilt-and-glow cards (§6.3), shown only after each site is live and approved. Each: a desktop screenshot in a 16:10 frame (AVIF/WebP, ≤ 80 KB, explicit width and height, `loading="lazy"`), the business type as a tag, the one line, and the link to the case study. Until the first is live: the single line "This site was built the same way I'll build yours." in Inter 18, no card.

### 7.18 Website case study (`WebsiteCaseStudy`, Past Work › Websites): the image-led pattern
Per site, in this order:
1. **Showcase** (full content width): the desktop screenshot on a tilt-and-glow card, 16:10, with the phone screenshot (9:19.5, 22% of the showcase width) overlapping its bottom-right corner by 48px, on its own white card with radius 22 and `--hl-shadow-card`. The pair sits on a `glow-green` glow. Below 768: desktop shot full width, the phone shot centered under it, overlapping by 32px.
2. **Title row:** business name (with permission) as `h3`, Outfit 700 36; the one-line summary; the live URL as a text link with →.
3. **Meta row:** three tags (business type, pages, 2026). No middle dots.
4. **Scoped / Shaped / Shipped strip** (§7.19).
5. **In their words:** the testimonial (§7.14 styling), once approved.

Separate case studies with 120px of space and a fading divider.

### 7.19 Scoped / Shaped / Shipped strip (`CaseStudyPhases`)
A `<dl>` of three columns (one column below 768) with fading vertical dividers. Each: the 32px static icon (`scope`, `shape`, `ship`) in `green`, the term (Outfit 600 18: "Scoped", "Shaped", "Shipped"), the description in Inter 17. Labels come from `site.ts`. The same strip in both systems case studies.

### 7.20 Detailed steps (`ProcessSteps variant="detailed"`): Home `#how-it-works` and `/how-i-work`
The arc's vertical form, at full width: a 16px white track on the left with a 56px white station per step (static icon), and the content to the right.
- Each step: the heading exactly as written in Rev 7 (`h3`, Outfit 700 32). Rev 7's detailed headings already carry their number ("01 · Scope it."), so wrap the number in a `green` span instead of adding a separate one, then two columns **Website | Workflow** (gap 48, stacked below 1024, Website first), each with a column label (Outfit 600 15 `green`: "Website", "Workflow"), the paragraph, and "You get" (Outfit 600 15 `green`, sentence case) followed by the list.
- The rust dot rests at the bottom of the track. No animation in this variant.
- **Stop-point callout** ("You can stop here."): a `tint` panel, radius 14, padding 18 / 20; the lead in Outfit 600 17 `green`, the rest in Inter 17 `ink`. No left border. Worded identically wherever it appears (Rev 7 F checklist).
- On Home the step zero line and "Book a free 20-minute call →" button sit above the steps; the proof line sits below, Inter 15 `ink-2`.

### 7.21 Why people hire me (`ReasonList`)
Four items in a 2 × 2 grid (1 column on mobile), no cards, fading dividers: lead in Outfit 600 22, line Inter 17.

### 7.22 About teaser and the headshot (`AboutTeaser`)
Photo left (desktop 360px), text right. **The headshot sits inside the logo ring:** the photo cropped to a circle at 82% of the ring's inner diameter, centered in the ring + dot paths (§6.1) drawn in `green` with the dot in `rust`. Static. `alt="Grant Huston"`. Until the real headshot is supplied, render only the ring with a `silver-2` disc inside (no stock photo, ever). Heading single-voice; the text link with →.

### 7.23 Insights list (`InsightList`)
A list (no cards) with fading dividers: category tag + date (Inter 14 `ink-2`, separated by a 16px gap, not a middle dot), the title as a link in Outfit 600 26 with the slow underline, the dek in Inter 17. **Category filter:** text links in Outfit 500 16, the active one's rust underline stays drawn (`aria-current="true"`), each 44px tall, wrapping on mobile.

### 7.24 Closing CTA band (`ClosingCta`)
Not a band: silver, centered on a `glow-seam` glow that straddles its top edge. Two-voice H2 "Twenty minutes. *Worst case, you get one good idea.*", the line in Inter 19, then the primary button "Book a free 20-minute call →" and the text link "send a quick note →" (gap 24, wrapping), then the microcopy in Inter 15 `ink-2`. Left-aligned, like every other section.

### 7.25 Inner-page hero (`PageHero`)
Left-aligned eyebrow + single-voice inner-page H1 + intro paragraph (max 60ch) + the CTA Rev 7 gives that page. Top-right: a quarter of the ring (white, 520px, 0.85 opacity) and a 520px `glow-green` glow behind it, both clipped by nothing (they fade into the page). No dot, no motion. Padding 72 top / 64 bottom.

### 7.26 Footer (`Footer`)
`silver-2` background, starting with a 120px `linear-gradient(var(--hl-silver), var(--hl-silver-2))` fade at its top (no hard edge). Order per Rev 7 B10: the full logo (badge + wordmark, 28px tall); the tagline in Newsreader italic 22 `ink`; the brand line in Inter 15; the links in Outfit 500 16 (slow underline); email and LinkedIn; the partner line; the legal line in Inter 14 `ink-2`. Bottom-right: a white ring quarter (360px) crossing the footer's corner. Padding 96 top / 48 bottom.

### 7.27 Placeholders (`Placeholder`)
`[[…]]` renders as `<mark class="ph">` (Inter inherits, `#3A3200` on `#FFF3B0`, inset 1px `#C9B44A`, radius 3, padding 0 .2em) in development, and **fails the production build** (the CI grep check in Rev 7 E9).

### 7.28 Services page parts
- **Sub-nav** (Websites · Workflows · Care · FAQ): sticky directly under the header (top 72; 60 on mobile), `silver` at 0.97, Outfit 500 16 links with the slow underline, the current section's underline kept drawn (set by an `IntersectionObserver`; without JS, none is marked). Horizontally scrollable on mobile, each link 44px tall. No middle dots between links: 28px gaps.
- **Service blocks:** separated by 96px and a fading divider. "Good fit if:" as a lead in Outfit 600 `green`, then text. No tinted boxes, except the Zoho callout (§7.13).
- **"What's included" lists:** a 7px `green` dot as the bullet, 12px from the text.
- **Platforms:** a plain wrapped text list. No logos.

### 7.29 FAQ accordion (`Faq`)
Native `<details>/<summary>`, one per question, separated by fading dividers. Summary: the question in Outfit 600 20 `ink`, min-height 56, with a 20px icon on the right: a `green` ring (1.75 stroke) that gains a filled 8px `rust` dot when open (the logo's dot, again). The answer in Inter 17, max 66ch, padding 0 0 24. No height animation (native open/close); the icon change is instant.

### 7.30 Past Work page parts
- **"How to read this page" box:** a white panel, radius 22, padding 28 / 32, 1px `rgba(41,51,45,.1)` border, no shadow. Its three items as a list with `tint` tags for the bold leads.
- **Section nav:** like the Services sub-nav, not sticky.
- **Systems case studies:** H3 title (Outfit 700 32), meta tags (no middle dots), screenshots on plain white frames (radius 14, `--hl-shadow-card`, no tilt), the Scoped / Shaped / Shipped strip, the content sections with single-voice H4s (Outfit 600 22), the quote (§7.14), the results as a dotted list.
- **Agency experience:** a list with fading dividers; each lead in Outfit 600.

### 7.31 Article template (`Article`)
Column 680px. Category tag + reading time (Inter 14 `ink-2`); the H1 (inner-page size); the dek in Inter 21 `ink-2`; the author line in Inter 14. "The short version": a white panel, radius 14, 1px `rgba(41,51,45,.1)` border, padding 24. "Try this this week": a `silver-2` panel, radius 14, padding 24, lead in Outfit 600 `green`. Body H2/H3 single-voice. The author box uses the ring headshot at 72px. The CTA box: `tint`, radius 14.

### 7.32 Contact page and form (`ContactPage`, `ContactForm`)
- Hero per §7.25 with the eyebrow "Huston, we have a problem." (Rev 7's one pun; it's copy, not a voice break).
- Two columns (5fr / 7fr, gap 48; stacked below 900, scheduler first): **Book a call** on the silver page (heading, paragraph, primary button "Pick a time →" or the lazy-loaded scheduler embed); **Send a quick note** on a white panel, radius 22, padding 36, `--hl-shadow-card`.
- **Fields:** label above (Outfit 500 15 `ink`, 8px gap); input white, 1px `ink-2` border, radius 10, height 52, padding 0 14, Inter 17; textarea min-height 140. Optional fields add "(optional)" to the label as copy. Focus: the rust focus ring (§7.10) plus the border turning `ink`. Required marked with `aria-required`, not color.
- **"What do you need?" radio group:** a `fieldset` with a visible `legend` (same style as labels). Four options as pill chips in a wrapping row (gap 10): each a real `<input type="radio">` (visually hidden, still focusable) + `<label>` styled as a pill: min-height 44, padding 0 18, radius 999, 1px `ink-2` border, Outfit 500 16 `ink`. Checked: `ink` fill, `silver` text, and a 8px `rust` dot before the label text. Keyboard: arrow keys move between options (native radio behavior); focus ring on the pill. Preselected from `?topic=` (Rev 7 E6).
- **Errors:** below the field, Inter 15 `rust` (on white: 6.1:1), with a 16px rust ring icon; the field border turns `rust`; `aria-describedby` + `aria-live="polite"`; the error copy is Rev 7's.
- **Submit:** primary button "Send it over →", full width below 768.
- Under the textarea: the privacy line in Inter 14 `ink-2`.
- **"What happens next":** a numbered list (this one is a real sequence) with Outfit 600 `green` numbers.

### 7.33 Thanks page and 404
Inner-page hero layout. 404: H1 "Huston, we have a problem." with the hero ring at 520px and the **dot sitting outside the gap** (rotated 40° back along the ring), static. It's the only place the dot is out of place.

### 7.34 Images
- No stock photos of people. Grant's real headshot only (§7.22).
- Screenshots: AVIF with WebP fallback via `next/image` (static export: pre-generated sizes), explicit width/height, `loading="lazy"` (nothing above the fold uses an image), names blurred before export, Grant's approval before publishing (Rev 7 C4).
- Every meaningful image has alt text describing what it shows ("Owner dashboard showing retention by coach, names blurred").

---

## 8. Line art and icons

- **The three step icons** keep v2's exact geometry on a 200 × 150 viewBox (`LineIcon.tsx`, renamed):
  - `scope`: circles r 66.5 at x 77.5 (dashed `4 3.5`) and x 122.5 (solid), cy 75
  - `shape`: rings r 67 and r 37, plus a filled dot r 9, centered (100, 75)
  - `ship`: diamond with half-diagonal 72, plus a filled inner diamond with half-diagonal 41
- **Stroke** is now `green` (`--hl-green`), 1.75, `vector-effect: non-scaling-stroke`, round caps; fills in `green`. Sizes: 52 (arc stations), 56 (detailed steps), 32 (case-study strip).
- **Utility icons:** the tick-in-circle (pill), the ring-and-dot (FAQ), the arrows, the menu. All inline SVG, 1.75 stroke, round caps. That's the whole set.
- **Banned:** stock icon packs as decoration, emoji, robots, circuit boards, rockets, sparkles, 3D icons, gradient icons.

---

## 9. Motion

The pacing is measured. **Two orchestrated moments** play once (the hero load and the arc), plus responsive motion that answers the visitor's hand (hover, focus). Nothing loops. Nothing is tied to scroll position, except the header badge (§9.3).

### 9.1 Inventory

| # | Moment | Trigger | What moves | Timing |
|---|---|---|---|---|
| 1 | Hero load | Page load (CSS only) | H1 lines fade + rise 8px | 450ms each, line 2 at +80ms, `cubic-bezier(.22,.61,.36,1)` |
| | | | Back cards fan out from behind the front card (opacity 0 → 1, from the offsets below, rotation 0 → final, scale .9 → 1) | Inbox +250ms, sheet +370ms, reply +490ms; 800ms each, `cubic-bezier(.2,.8,.2,1)` |
| | | | Proof chip pops (opacity, scale .9 → 1) | +1100ms, 400ms ease-out |
| | | | Ring dot travels the ring into its gap (`rotate(-250deg)` → `0`) | +200ms, 2200ms, `cubic-bezier(.3,.7,.2,1)` |
| 2 | The arc | Arc section ≥ 35% in view (`IntersectionObserver`), once | The dot travels the track into its gap (`rotate(43.8deg)` → `0` around the circle's center) | +150ms, 1900ms, `cubic-bezier(.3,.6,.2,1)` |
| | | | Each icon plays its v2 animation as the dot reaches it | scope at +150ms, shape at +450ms, ship at +850ms (below) |
| 3 | Stack hover | Pointer over the stage (fine pointers) | Stack tilts toward the cursor, max 5° each axis; back cards drift apart (inbox −8, −8; reply +10, +8; sheet −8, +10 px) | Tilt eased 0.12 per frame, settles flat on leave; drift 500ms `cubic-bezier(.2,.7,.2,1)` |
| 4 | Door swing | Hover or focus inside a door | Leaf `rotateY(14deg)` on its left hinge | 600ms `cubic-bezier(.2,.7,.2,1)`, reverses on leave |
| 5 | Tilt-and-glow cards | Pointer over the card (fine pointers) / focus | Tilt max 3°; mint glow follows the cursor | Tilt eased 0.12; glow fades in 400ms |
| 6 | Slow underline | Hover or focus on any link or button | Rust underline draws left → right, retracts to the right | 500ms `cubic-bezier(.2,.7,.2,1)` |
| 7 | Arrow nudge | Hover or focus | The arrow moves 3px in its direction | 150ms ease-out |
| 8 | Compact door lift | Hover or focus | Lift 2px, deeper shadow | 250ms ease-out |
| 9 | "Say hello ↘" | Click | Smooth scroll to `#hello`, 110px offset | Browser smooth scroll |

**Card fan offsets** (start frames, `translate3d`): inbox (110, 150, −30), sheet (140, −220, −20), reply (−60, −160, −10). The front site card and the hero text column (eyebrow, subhead, pill, compact doors) never animate.

**Icon animations on the arc** (delays from the moment the arc starts):

| Icon | Motion |
|---|---|
| scope (+150ms) | Dashed circle slides in from −18px, solid from +18px, with a fade, 400ms ease-out |
| shape (+450ms) | Outer ring draws on (`stroke-dashoffset` 430 → 0, 300ms), inner ring at +60ms (260ms), center dot pops from scale 0 at +260ms (140ms) |
| ship (+850ms) | Outline turns from −45°, scale .92 into the diamond (280ms), filled center scales up from 0 at +200ms (200ms) |

The step numbers, verbs and lines never animate.

### 9.2 Guarantees
- **Only `transform`, `opacity` and `stroke-dashoffset` animate.** Layout shift stays at 0: the stage, the arc box and the doors have fixed dimensions before anything moves.
- **Start frames exist only when JS is present.** An inline script in `<head>` adds `.js` to `<html>` before first paint. Every start frame is scoped `html.js …`. Without JS, every element renders at its end state, and the doors, links and form all work.
- **Hero animations run on CSS alone** (no class gate), so a script error can't leave the hero invisible. The arc is gated by a `.go` class from the observer; if `IntersectionObserver` is missing, add `.go` at once. (The reference gates the hero with `.go` too, only so its Replay button works.)
- **Reduced motion** (`@media (prefers-reduced-motion: reduce)`): every animation and transition is off and the end state shows at once. The doors don't swing, the stack doesn't tilt, the tilt cards don't tilt (the glow may still appear, without a fade). Underlines appear instantly on hover and focus (they're a state, not motion). Smooth scroll becomes instant. The JS checks `matchMedia` before attaching any pointer handler.
- **Hover is never the only way:** every hover effect also appears on `:focus-visible` (or `:focus-within` for the doors). Touch devices get the end states through normal taps; the tilt code runs only when `(hover: hover) and (pointer: fine)` matches.
- **Native scrolling only:** no scroll-jacking, pinned sections, parallax, scroll-linked animation or smooth-scroll libraries. The one exception is the header badge (§9.3), which reads the scroll position but never changes scrolling.
- **No animation library.** CSS keyframes, one `IntersectionObserver` hook and one small pointer module (tilt + drift), under 3 KB minified together.
- **The LCP element is the H1.** Its fade must finish by 530ms; don't lengthen it.

### 9.3 The header badge turns with the scroll (amendment, Nov 14, 2026)

Grant's decision. It is the one scroll-driven motion on the site, and it overrides the scroll and 3D rules elsewhere in this guide (§9, §11, §12, §13).

- **What moves:** the header badge (§7.1) rotates around its vertical axis while the page scrolls. The angle is driven by scroll distance: the badge turns with the scroll and stops the moment scrolling stops. No momentum, no easing after scrolling ends, no loop, no autoplay. The wordmark does not move.
- **Version 1 (built in the build plan):** CSS 3D `rotateY` on the existing SVG badge. Only `transform` changes. One passive `scroll` listener that schedules at most one `requestAnimationFrame` update per frame and reads the scroll position; it never calls `preventDefault()` or changes scrolling, so native scrolling is untouched. Under 1 KB of code.
- **Off entirely under `prefers-reduced-motion: reduce`:** the listener is not attached and the badge stays static. **No effect without JS:** the badge renders static.
- **Version 2 (a separate experimental PR at the end of the build):** the real 3D model, `huston-logic-badge.glb` (supplied by Grant), lazy-loaded after the page is idle, desktop only, with the SVG badge as the fallback. It ships only if Lighthouse mobile stays ≥ 90 on every tested page; otherwise version 1 stays.

---

## 10. Responsive

| Width | Behavior |
|---|---|
| ≥ 1101 | Two-column hero (text left, stack right). Arc horizontal. Doors side by side. H1 line 2 doesn't wrap |
| 900–1100 | Hero stacks: text, then the stage centered (478 wide, 600 tall). Arc stays horizontal with smaller text (§7.7). Doors side by side |
| 768–899 | Arc becomes the vertical track. Doors side by side. Two-column grids stay two-column where they fit 320px+ per column |
| < 768 | Phone tokens (§3). Everything single-column, 20px gutters |

**On phones (< 768):**
- **Header:** 60px, badge + wordmark + "Menu".
- **Hero:** eyebrow, H1 (40px, three lines at 390), subhead, pill, the two compact doors stacked full width, then "Book a free call →" as a text link. Then the stack.
- **The stack becomes a column** (no absolute positioning, no 3D, no rotation): the site card first, then inbox, reply, sheet (gap 12), then the proof chip (left-aligned). The ring shrinks to 460px and sits behind the top-right of the stack (`right: -60px; top: -56px`), the dot still animating on load. The stage gets 44px top padding.
- **Steps:** the vertical track (§7.7).
- **Doors:** stacked, no swing (§7.8).
- **Tap targets:** every link, button, radio pill, summary and menu item is at least 44 × 44.
- **Check at 390 wide:** the eyebrow "Websites and workflows for small businesses" fits on one line at 16px (it does in the reference: 314px of 350, measured Nov 14) (if not, Rev 7 E9's fallback "Websites and workflows" applies); nothing overflows horizontally.
- **Sticky mobile CTA:** not in v3. The doors are in the first screen now, so it isn't needed.

---

## 11. Accessibility (WCAG 2.2 AA; the `a11y` check)

- **Contrast:** the table in §2. Small rust text never sits on a glow.
- **Focus:** the 2px rust ring with 3px offset on everything interactive, visible on silver, white and the door leaves. Skip-to-content link as the first focusable element (a primary button that appears on focus at top-left).
- **Headings:** one H1 per page. The arc's verbs are `h3` under a visually hidden H2. The door titles are `h2`. Step numbers and all icons are `aria-hidden`.
- **The hero stack** is one `figure role="img"` with the `aria-label` in §5.1. No text inside it is read twice.
- **Motion:** §9.2. Nothing flashes; nothing moves for longer than 2.4 seconds on its own; nothing loops, so no pause control is needed. The header badge (§9.3) moves only while the visitor scrolls, and is off under reduced motion.
- **Forms:** labels on every field, the radio group as `fieldset` + `legend`, errors announced with `aria-live="polite"` and linked with `aria-describedby`.
- **Keyboard:** the menu, the accordion and the radio group are fully keyboard-operable; the doors swing on `:focus-within`.
- **Target size:** 44 × 44 (stricter than 2.2's 24 × 24 minimum, on purpose).
- **Language and links:** `lang="en"`; link text says where it goes (Rev 7 copy already does).

---

## 12. Performance budget (the `lighthouse` check: ≥ 90 on mobile, all four categories)

- **Fonts:** exactly three files (Outfit variable, Inter variable, Newsreader italic 400), latin subset, preloaded, `font-display: swap` with metric-matched fallbacks.
- **First screen:** no images, no video, no iframes. The stack and ring are HTML and inline SVG.
- **Effects:** no `filter: blur()`, no `backdrop-filter`, no `mix-blend-mode`, no box-shadows wider than the tokens. Glows are plain radial gradients. `will-change: transform` only on the stack and the door leaves.
- **JS:** under 3 KB (gzipped) of first-party motion code; the scheduler embed and analytics load lazily, after interaction or idle.
- **3D:** only the header badge's version 2 (§9.3): lazy-loaded after idle, desktop only, and it ships only if this budget's Lighthouse mobile ≥ 90 holds on every tested page.
- **CLS 0:** fixed stage and arc dimensions; `next/font` fallbacks; images with width/height.

---

## 13. Banned

**From v2 (removed, don't reintroduce):** the bone background, `band` sections, `rule` hairlines as structure, radius 0 as a rule, IBM Plex Mono, Inter Tight, mono caps eyebrows, the centered hero, `ReviewBar`, the big-number Proof strip.

**Look:**
- Purple, blue, or any accent beyond green and rust (except inside the client's site card, §5.1).
- Gradient washes as decoration: gradients appear only as glows, the door frames, the door leaves and the fading dividers.
- Gradient text; glassmorphism; `backdrop-filter`; CSS blur filters; neon; drop shadows in grey.
- Left-border callouts and cards with a colored stripe.
- Identical rounded cards for lists of ideas (§4: only objects get boxes).
- All-caps labels, letter-spaced caps, monospace labels, middle dots added by design (only where Rev 7 copy has them).
- Accenting a single word in a heading (color, italic or bold), or rust on a whole heading.
- Stock photos of people, stock illustration, stock icon packs, emoji, robots, rockets, sparkles, circuit boards, blobs, sticky notes.
- A logo wall or partner badges.
- Redrawing, recoloring (beyond ink, white, green and rust) or stretching the logo, or using the HL without its ring.

**Motion:**
- Loops (including subtle "breathing" glows), autoplaying carousels, marquees.
- Scroll-jacking, pinned or sticky storytelling sections, parallax, smooth-scroll libraries, and any scroll-linked animation other than the header badge (§9.3).
- Fade-and-rise on every section; animations on numbers, headings other than the H1, or body text.
- Animating `width`, `height`, `top`, `left`, `margin`, `filter` or `box-shadow` (except the 250ms compact-door shadow).
- Any animation library (Framer Motion, GSAP, Lottie). WebGL and 3D models only as the header badge's version 2 (§9.3).

**Interaction and content:**
- Pop-ups, modals for marketing, countdowns, exit-intent, cookie walls (analytics is cookieless).
- Hover-only information; a hover effect without its focus equivalent.
- Copy not in Rev 7 Section B, except the interface strings this guide names and flags for Grant's OK (§7.8 `aria-label`).
- Lorem ipsum or invented statistics anywhere, including placeholders.

---

## 14. Acceptance check (before calling v3 done)

1. **Visual:** at 1440 × 900 a screenshot of `/` lines up with `reference/home-top.html` (§5 positions within 4px; the arc's stations and text blocks within 1% of the box). At 390 × 844 the stacking order matches §10.
2. **Grep:** `grep -riE "F6F4EE|E8E9E0|C0C2B4|plex|inter.tight|uppercase|backdrop-filter|filter:\s*blur|ReviewBar" src app` returns nothing (or only this guide).
3. **Colors:** every color in the rendered page comes from the §2 tokens, the dev placeholder colors, or the client site card's scoped properties.
4. **Fonts:** the network panel shows exactly three font files.
5. **Motion:**
   - On load: H1 lines, then the cards fan out, the chip pops, and the ring's dot reaches its gap; each plays once.
   - The arc's dot travels once when the section enters view, and each icon plays as the dot passes.
   - Doors swing on hover and on Tab focus; the stack tilts and the tilt cards tilt only with a mouse.
   - Underlines draw on Tab focus as well as hover; arrows nudge.
   - With reduced motion on: no movement anywhere; the page matches the end state.
   - With JS off: the end state shows, the doors and form work, and nothing is invisible.
6. **Lighthouse (mobile):** ≥ 90 in Performance, Accessibility, Best Practices and SEO on `/`, `/services`, `/past-work` and `/contact`. CLS 0.
7. **a11y:** axe reports no violations; keyboard-only walk-through of Home, Contact (radio group, errors) and the Services FAQ succeeds.
8. **Copy:** every visible string matches Rev 7 Section B, plus the interface strings this guide names. The hero stack's stand-in names are the only invented content and are flagged in code with a `// stand-in until W3 approved` comment.
9. **Rev 7 sweep** (F checklist) still passes: the old wording search, the placeholder build failure, the labels from `site.ts`.
