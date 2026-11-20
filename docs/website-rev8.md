# Huston Logic website: Revision 8 (Nov 20, 2026)

**Status:** approved by Grant, Nov 20, 2026. Home (B1) was approved from the mockup. Grant answered the open questions for B2 to B7 the same day (Section F) and reviews those pages on the preview link before the merge. Decisions behind this are in `website-rework-decisions-2026-11-20.md`.

**How to read this.** Revision 8 is a set of changes on top of the copy now in the repo `ghuston/huston-tech-website`. The repo is ahead of Revision 7, so the repo is the base. Anything this file doesn't mention stays as it is. Voice rules: `grant-voice.md`. Look: style guide v3, with the motion changes in Section C. `[[double brackets]]` mark what only Grant can supply.

---

## A. Sitewide

- **Nav:** How I work · Websites (→ `/services#websites`) · Systems (→ `/systems`, new page) · Past work · About · Say hello ↘ (→ `/#hello`).
- **Footer:** tagline becomes "Personal websites and software." Remove the "Zoho partners: need overflow help?" line. Add Systems to the links.
- **Offers:** two. Accelerated Websites, and AI-Centric System Redesign. The Workflow Review, the Zoho specialty as an offer, and the "from $750" price are gone.
- **Price:** no number anywhere on the site. Prices are discussed in person.
- **AI apps:** never name one. Say "your AI app" or "by talking".
- **Industries:** name none as a target market. Client names and industries stay on testimonials and case studies, because those are facts.
- **Protected records:** nothing may suggest the talking system is for health or other protected records.
- **Contact topics:** `?topic=website` and `?topic=system`. Treat the old `?topic=workflow` as `system`. Remove `?topic=partner`.
- **Sitemap and metadata:** add `/systems`. Update the Organization JSON-LD description to match the Home meta description. No prices in structured data.
- **Wording sweep.** After the build, these return nothing in the site source: `Workflow Review`, `$750`, `Fix a workflow`, `Things keep slipping`, `small outfits`, `Already on Zoho`, `Zoho partners`. "Workflow" and "workflows" survive only inside client quotes and the Past work case-study text. "Zoho" survives only in Past work and About, as history.

---

## B1. Home

**SEO title:** Huston Logic | Personal Software and Websites for Small Businesses
**Meta description:** I build websites and AI-run systems for small businesses, starting with sales follow-up you run by talking. Checked the way a big software team would. Yours when I'm done.

About 750 words in 7 sections. Layout reference: the two Revision 8 home mockups (phone and desktop).

**1. Hero**
- Eyebrow: Hi, I'm Grant. Personal software and AI acceleration for small businesses.
- H1: For the parts of the job / *you never signed up for.*
- Subhead: I build the systems that handle them, starting with sales follow-up you run by talking to your phone. It lives in your accounts, and it changes when you tell it to.
- Pill: AI-accelerated, checked by hand.
- Buttons: **Book a free 20-minute call →** and a text link, "See what I'm installing now ↘" (→ `#installing`). The two compact hero doors are removed.
- **Hero stack.** Keep the `HeroStack` component and all of its motion (fan-out, tilt, drift, the dot on the ring). Only the cards change:
  - Front card: the board. Heading "Today". Rows: **Dana Ortiz**, Quote, three units, Due Fri (highlighted) · **R. Alvarez**, Proposal, no reply yet, Nudge · **Kim Lee**, Call back, Today.
  - Back card 1, tag "You say, after the call": Just talked to Dana. She wants a quote for three units by Friday.
  - Back card 2, tag "Before your next call": **Dana Ortiz**, 2:00 pm. Wants three units. Quote due Friday.
  - Back card 3, tag "A rule you added by asking": **Nudge me three days after any proposal with no reply.** Don't like it? "Undo that."
  - Chip: **Notes saved** · Follow-up set for Friday.
  - `aria-label`: "The owner's board in front, with a new follow-up for Dana. Around it: the spoken note that created it, a brief before the next call, and a rule added by asking."
  - All names are invented. Mark them in code as stand-ins.

**2. What I'm installing now** (`id="installing"`)
- Eyebrow: What I'm installing now
- H2: A sales follow-up system you run by talking.
- Three pairs, each a message bubble and its result:
  - "Just talked to Dana. She wants a quote for three units by Friday." → Notes saved. Follow-up set for Friday.
  - "Who do I need to talk to today?" → A short list, with what was said last time.
  - "From now on, nudge me three days after any proposal with no reply." → The rule is added, in plain English. Changed your mind? "Undo that."
- Three phone screenshots: Today, Pipeline, Brief (Section D).
- Line: I set it up in your own accounts and tune it for 30 days. After that it's yours, whether or not you keep me around.
- Link: See how the install works → (→ `/systems`)

**3. Two doors** (`id="hello"`)

| | Door 1 | Door 2 |
|---|---|---|
| Title | Accelerated Websites | AI-Centric System Redesign |
| Line | Custom-designed, AI-accelerated, owned by you. Want something changed? Say it in a sentence. It's checked before it goes live. | A system you run through your AI app. Big companies are rebuilding around AI. I do the same for a business your size, starting with sales follow-up. |
| Button | Start a website → (`/contact?topic=website`) | See the system → (`/systems`) |

The door titles are offering names, so they keep their capitals and have no quotation marks.

**4. Why hire me** (`id="why"`)
- Eyebrow: Why hire me
- H2: Anyone can vibe-code an app these days. / *Here's why you'd still hire me.*
- Body: You could build this yourself with AI, and the first version would probably work. The hard part is knowing it still works next month, on a slow phone, after an update nobody noticed. So nothing I build goes live until it passes the checks a big software team would run. I can't skip them either.
- The track, seven stops:
  1. **It builds clean.** On a fresh machine, not only my laptop.
  2. **Everyone can use it.** Every page scanned for accessibility, at phone and desktop size.
  3. **It's fast, and Google can read it.** Audited as a mid-range phone on a slow connection.
  4. **The building blocks are safe.** Every outside package checked against known vulnerabilities.
  5. **The code is safe.** Scanned for the patterns attackers look for.
  6. **I've tried to break it.** By hand, on a phone and with a keyboard.
  7. **Then it goes live.**
- Callout: I broke each automatic check on purpose to prove it blocks a bad change. Five tries, five blocked.
- Three one-liners:
  - **You work with me.** The person on the call is the person doing the work.
  - **You see the price first.** Fixed, and agreed in writing before I start.
  - **It's yours.** Your accounts and your data, with or without me.

**5. Proof** (`id="proof"`)
- H2: What clients said afterward. Tag: Custom systems, 2024 to 2025.
- The three approved home testimonial cuts, unchanged, in the existing order. A swipe row on phones.
- Three chips: **3 of 3** met the goals set at kickoff · **5/5** on communication · **5/5** on handoff & training. Small print: From client wrap-up surveys. A small sample, I know.
- Two case-study cards, each with a screenshot (Section D):
  - **Hideout Fitness.** An owner dashboard for retention, revenue and profit by coach and client.
  - **Irvine Family Counseling.** A staff app, payroll submissions and dashboards for a 10-practitioner practice.

**6. About**
- The existing headshot, inside the logo ring.
- H2: Hi, I'm Grant.
- I've spent my career where software meets business, as an application developer, business analyst and software consultant. I started Huston Logic to bring small businesses into the AI age, one useful system at a time.
- Link: More about me →

**7. Close**
- H2: Twenty minutes. / *Worst case, you get one good idea.*
- Tell me what keeps landing on your plate. If I'm not the right person, I'll tell you who is.
- **Book a free 20-minute call →** · Or send a quick note →

**Removed from Home:** the six pain cards, "What you can hire me for", both Scope it, Shape it, Ship it blocks, the Zoho callout, the Insights teaser, the hero's compact doors, and two of the five "Why people hire me" points.

---

## B2. Systems (new page, `/systems`)

**SEO title:** AI Systems for Small Businesses | Huston Logic
**Meta description:** A sales follow-up system you run by talking, installed in your own accounts. A one-time install, an optional care plan, no subscription.

- Eyebrow: Systems
- H1: A system you run by talking.
- Intro: Big companies are rebuilding how they work around AI. I do the same for a business your size. It starts with the part most owners carry in their heads: sales follow-up.
- **Book a free 20-minute call →**

**What it does**
Say what happened. It keeps the notes, tells you who to follow up with today, and has a brief ready before the next call. It drafts follow-ups in your voice, and you send them.
*(The three pairs from Home, then four screenshots: Today, Pipeline, Brief, a rule preview.)*

**What I set up** *(a real sequence, so it's numbered)*
1. **A design call.** We set your stages and your follow-up rules.
2. **Your own copy, in your accounts.** Your website form connected, your contacts imported from a spreadsheet.
3. **A rulebook in your voice,** and five starter rules.
4. **30 days of tuning,** then a one-page handoff.

**It's yours**
Every account is in your name. Your data exports in full, any time. After the 30 days, a care plan is optional: updates, keeping the AI connection working, and a tune-up each quarter. Cancel it and the system keeps running.

**You can change it yourself**
Add a rule, a stage or a field by asking. Those are settings, not code, so you can't break what's underneath. Every change is logged and can be undone. For anything bigger, ask me, and it goes through the same checks as the rest (→ `/#why`).

**What it costs**
A one-time install price, agreed in writing before I start. No subscription. I'll share the price on the call.

**Coming very soon**
Bulk email and campaigns, texting, call recording, booking and payments. Tell me which one you need first, and it moves up the list.

**Handle protected records?**
Patient files and the like need extra agreements, and this system isn't set up for them yet. Talk to me first.

**What else I build this way**
The same approach works past sales: owner dashboards, staff tools, and connections between the software you already use. Built with AI, checked the same way, yours when I'm done. **See past work →**

**Closing:** Start with the free call. I'll show it to you on my phone. The demo takes 90 seconds. **Book a free 20-minute call →**

*Optional opener, two pain lines reused from the old Home: "Someone filled in your contact form on Friday. You found it Tuesday." and "You pay for a CRM and use it as a very expensive address book."*

---

## B3. Services (`/services`: Websites, Care, FAQ)

Remove the Workflows sections, "Platforms I know well", and the Zoho callout. Sub-nav: Websites · Care · FAQ.

**H1:** Websites, scoped and priced before I start.

**Websites** (`#websites`)
- H2: Accelerated Websites
- Every site I build is designed from scratch for one business. AI does the slow parts of the build, so the price doesn't have to cover them. I design every page and check it myself before you see it.
- What's included: a custom design · a contact form that writes back, and feeds your system if you have one · fast on phones, and checked for accessibility, security and search basics before launch · hosting in an account in your name, on your own domain · one round of revisions before launch.
- After launch: for six weeks, small changes are included, and I fix anything that doesn't work as agreed. Want something changed? Say it in a sentence. I make the change, it passes the same checks, and it goes live. Bigger changes get a quote first.
- Price: fixed, and agreed in writing before I start. I'll quote it after the call. Payment is 50% to start and 50% at launch.
- Button: Start a website →

**Care** (`#care`): keep Site Care, as what continues after the six weeks. Replace the workflow Care paragraph with the systems care plan from B2.

**FAQ** (`#faq`), replacing the current list:
- **What does it cost?** A fixed price, in writing, before I start. A system is a one-time install with an optional care plan, never a subscription.
- **Do you use AI?** Yes, to build faster. I design, decide and check every page and every system myself.
- **Who owns it?** You do. The accounts, the data and the logins are in your name. If you stop working with me, it keeps running.
- **Can I change it myself?** A system, yes: add rules, stages and fields by asking. A website: tell me what you want changed, and I make it through the same checks. Small changes are included for six weeks after launch.
- **Which AI app does it work with?** I'll check yours on the call. It needs an AI app that can connect to your own tools.
- **We handle health or other protected information. Can you help?** With a website, yes, carefully. The talking system isn't set up for protected records yet.
- **Who does the work?** I do, from the first call to the handoff.
- **Do you work remotely?** *(keep the current answer)*
- **What do you need from me?** For a website: your words, photos and logo, two or three sites you like, and access to your domain. For a system: an hour for the design call, and a spreadsheet of your contacts if you have one.

---

## B4. How I work

- Keep the page and the three steps. Columns become **Website | System**.
- Remove the Workflow Review and the "You can stop here" callout everywhere.
- Website column, Ship it: replace "14 days of fixes" with "six weeks of small changes and fixes".
- System column:
  - **01 · Scope it.** A design call: your stages and follow-up rules. Then a written plan and a fixed price.
  - **02 · Shape it.** Your own copy set up in your accounts, your form connected, your contacts imported. I test it end to end before you use it.
  - **03 · Ship it.** 30 days of tuning, a one-page handoff, and a full export whenever you want one.
- Intro line: Every project, website or system, runs the same three steps.
- "After launch": Site Care for a website, the care plan for a system. Neither is required.

## B5. Past work

- Meta description: Custom systems for a group therapy practice and a personal training studio, in the clients' own words, plus agency experience across 21 client accounts.
- Rename "Systems projects" to "Custom systems".
- Websites section, until a site is live: Website case studies appear here as each site goes live and its owner says yes.
- Case studies, testimonials and the agency section: unchanged. Their "14-day correction window" lines describe those past projects and stay.

## B6. About

- **The short version:** I'm the founder of Huston Logic and, for now, the whole team. I build websites and AI-run systems for small businesses, and I check them the way a big software team would.
- **New paragraph, "Why I do this":** Big companies have teams to bring AI into how they work. A small business has the owner, usually after hours. I started Huston Logic to bring small businesses into the AI age, one useful system at a time, with no fluff and no upselling.
- **Moved here from Home:** I start with what you have. New software isn't always the answer. Often the fix is a setting, a process or a connection between tools you already pay for.
- "Why websites too": change "the first workflow a business has" to "the first system a business has".
- "What working with me is like": replace the Workflow Review line with "I tell you the truth. If you don't need a build, I'll say so."
- Remove the "Zoho partner agencies" box. Zoho stays in "How I got here" and "What I bring" as experience.
- Meta description: Grant Huston builds websites and AI-run systems for small businesses, checked the way a big software team would. One person, from the first call to the handoff.

## B7. Contact

- "What do you need?" options: A website · An AI system for my business · Both · Not sure.
- Placeholder for the system option: "e.g. Follow-up lives in my head, and my call notes never get written down."
- "What do you use today?" placeholder: "e.g. A spreadsheet, a CRM I stopped opening, or nothing yet."
- "What happens next", step 3: If there's a fit, you get a written plan and a fixed price. If not, I'll point you somewhere useful.
- Remove the partner variant.

---

## C. Motion (amends style guide v3, section 9)

Grant wants more movement between sections. v3 allowed two orchestrated moments. Revision 8 allows **one per section, each played once**, and each must show something happening in the product or the process, never decoration.

| Section | What moves | Trigger |
|---|---|---|
| Hero | Unchanged from v3: cards fan out from behind the front card, the stack tilts under the cursor, the dot travels the ring. Order: the "You say" card, the highlighted row, the brief, the rule, the chip | Page load |
| Installing now | Each message bubble slides in 8px from the right; its result tick draws 250ms later. Three pairs, staggered | Section 35% in view |
| Doors | Unchanged swing on hover and focus. On phones, each leaf opens 8° once and settles | Hover, focus; in view on phones |
| Why hire me | The rust dot travels the track; each stop's tick draws as the dot passes; it rests at "Then it goes live." This replaces the Scope, Shape, Ship arc on Home and reuses the arc's geometry on desktop | Section 35% in view |
| Proof | The three chips pop in, 120ms apart. Numbers never count up | In view |
| About | The dot travels the ring around the headshot | In view |
| Screenshots, case cards | The existing tilt-and-glow card | Pointer, focus |

**Phones:** the hero stack stays an overlapped stack with the fan-out (no tilt), in a fixed-height stage, in place of v3's plain column.

**Unchanged rules:** only `transform`, `opacity` and `stroke-dashoffset` animate. No loops, no scroll-linked motion, no parallax, no animation library. Reduced motion and no-JavaScript show the end state. CLS stays 0. The H1 stays the LCP element. Lighthouse stays at 90 or more on mobile.

## D. Images

- **Pipeline screenshots:** generated in `huston-logic/pipeline` from seeded demo data, never from Grant's live copy. Phone size 390 × 844: Today, Pipeline, Brief, and a rule preview. Fake names only, matching the hero cards. Fallback if they can't be generated: the same screens drawn in HTML, in the hero card style.
- **Case-study screenshots:** reuse the images already live on Past work, in `public/work/`. Hideout Fitness card: `systems-1.webp` (owner dashboard). Irvine Family Counseling card: `systems-3.webp` (staff app payroll screen). Keep their existing alt text.
- **Headshot:** the one already on the site.
- All images: AVIF with WebP fallback, explicit width and height, lazy-loaded, nothing in the first screen. No stock photos.

## E. Build notes for Claude Code

- Repo: `ghuston/huston-tech-website`. Copy comes only from this file and the repo's current copy.
- Step labels stay in `site.ts`. Add the two offers and the nav there.
- The production build still fails on any `[[placeholder]]`. Section D has none left.
- The contact form is not connected to `/intake` in this run. That waits on `INTAKE_SECRET`.

## F. Grant's answers (Nov 20)

1. **Door lines:** stand as written in B1. Grant's "tell your AI of choice" line goes in when clients can change a site themselves.
2. **Websites** are sold and quoted after the call. Only the fixed $750 offer is off.
3. **Founding installs:** not published. That is an in-person discussion.
4. **Features not in the system yet** are listed as "Coming very soon".
5. **Small website changes** are included for six weeks after launch. Grant makes them. Fixes share the same six weeks, so a website has one window, not two.

## G. Still open

- Connecting the contact form to `/intake`.
- Copy for the day clients can change a website through their own AI.
