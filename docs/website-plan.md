# Huston Logic: Website V1 Strategy, Copy & Build Handoff

First prepared November 9, 2026. Revision 7 (Nov 14, 2026) sources: Grant's final copy lines and decisions of Nov 14, the copy options and voice rules (`claude/web-copy-options-fable-2026-11-14.md`), the two-line strategy draft (`claude/web-strategy-two-lines-draft-2026-11-13.md`), style guide v2, the Nov 13 build handoff, and the Drive master documents as updated on Nov 14.

**Status:** as of Revision 7, the Drive master documents and this file agree. Website decisions are logged in the Execution workbook (D26–D42). D36–D40 supersede D29 and D30, D40 resolves D33, and D41 makes the name final (superseding D32).

**Revision 7.1 (Nov 14, 2026, afternoon): Grant's answers to open placeholders**
- **Name final:** Huston Logic. "(working name)" is removed.
- **Email:** info@hustonlogic.com replaces every `[[email address]]` (Contact, Privacy, footer, auto-reply sender). **LinkedIn:** https://www.linkedin.com/in/granthuston/ (footer; `sameAs` in JSON-LD).
- **Base price scope:** up to 7 pages (replaces `[[five]]`).
- **Website payment terms:** 50% to start, 50% at launch. Added to Services, the FAQ, A8 and G.
- **Titles:** Jacob Rodriguez, Owner. Emily Mayot, Owner.
- **About:** the real background (application developer, business analyst, software consultant) replaces "business analysis, QA and application support" and the QA placeholder line; the musician line is now blues guitar and songwriting. "QA" in "What I bring" becomes "testing".
- **E9** is updated: these items move to Resolved.
- **Hero copy (Nov 14, Grant):** the eyebrow becomes "Websites and workflows for small businesses" (was "…for small outfits"), and the H1 becomes "The site brings them in. *The system answers.*" (was "The part people see. *And the part they shouldn't.*"). Updated in B1, A1, A1b and A3, and in STYLE-GUIDE.md v3 and its reference page.
- **Public-repo trim (Nov 14, Grant):** this copy lives in a public repository, so internal-only notes were removed: all of C5 (referral business names, a project critique and client sales notes), the internal output note in A1, the unused edited-review note in C2, and the internal wording on payment terms (here, E9 and G).

**Revision 7 (Nov 14, 2026): two equal service lines, new copy, new voice, Scope it · Shape it · Ship it**
- **Two equal lines.** Websites are no longer a side door. Huston Logic sells custom websites (from `[[$750]]`) and workflow consulting, side by side, to small businesses, solo pros and creatives (bands included). Every "side door", "start smaller" and systems-only line is gone.
- **Grant's final lines are in place, word for word:** the tagline, eyebrow, H1, subhead, supporting line, the three two-voice H2s, both doors and the header link (B1). The supporting line's first-screen spot is marked `[[DESIGN: placement]]` until style guide v3.
- **Steps renamed (D33 resolved, D40):** 01 Scope it, 02 Shape it, 03 Ship it, with new one-liners. Step zero is still the free 20-minute call, unnumbered. The case-study strip reads Scoped / Shaped / Shipped. Every Find it / Fix it / Flick it is gone, including Section G.
- **Price (D37):** the site publishes "from `[[$750]]`". It stays a placeholder until Grant confirms the number. The base site includes an automatic reply to every inquiry; a personalized follow-up sequence is an add-on. No other price appears on the site.
- **AI wording (D39):** "AI-accelerated, checked by hand." The long version appears once on Services and once on About. Never "AI-powered", no multipliers, no comparisons with agencies.
- **Voice (A1b):** the voice rules from the Nov 14 copy options replace Revision 6's table, with the step examples swapped to Scope it, Shape it, Ship it. Grant's final lines are approved exceptions to the banned-shapes list. All other copy was rewritten to these rules; testimonials stay word for word.
- **New page:** `/how-i-work` holds the detailed steps, with a Website and a Workflow column for each step. Services now has three sections (Websites, Workflows, Care) and a longer FAQ. Past Work has a Websites section with three `[[case study]]` slots. Contact gains a required "What do you need?" field, prefilled by the door buttons; "Business" becomes optional.
- **Header:** How I work · Websites · Workflows · Past work · About · Say hello ↘ (jumps to the two-door band, `id="hello"`).
- **Build (E):** hosting is Cloudflare Workers static assets (not OpenNext), matching the repo. The form's automatic reply needs an email-sending service and a small Worker script: new build work (E6).
- **Design is not part of this round.** The two-door band, the supporting-line slot, a portfolio pattern and the AI-default look go to style guide v3, built from inspiration sites Grant will bring. STYLE-GUIDE.md v2 is unchanged; where its copy disagrees with Section B, Section B wins (E3).
- **Backup:** Revision 6 is saved unchanged at `claude/archive/huston-tech-website-rev6.md`, with the full Revision 2–6 changelogs.

**Earlier revisions, in one line each** (full notes in the archive copy):
- **Rev 6 (Nov 11):** the name Huston Logic (made final in Rev 7.1); Starter Website side door; Cloudflare hosting; Claude Code handoff.
- **Rev 5 (Nov 9):** design rebuilt to match the mockup; STYLE-GUIDE.md becomes the single design source.
- **Rev 4 (Nov 9):** bone, ink and rust look; two-voice headlines; animation brief.
- **Rev 3 (Nov 9):** the three-step framework, step zero, and the framework used in delivery (Section G).
- **Rev 2 (Nov 9):** all three testimonials approved; agency projects described without names.

**How to read this:**
- `[[DOUBLE BRACKETS]]` mark something only Grant can supply, confirm or decide. Section E9 lists all of them.
- Testimonial quotes match the source files word for word. The only change is "Grant" in place of the name Jacob mistyped, which he confirmed. "…" marks a cut that keeps the meaning.
- `*Italic text*` inside a heading marks the rust serif-italic second voice (STYLE-GUIDE.md §3).
- The only price in the site copy is `[[$750]]`.

---

## A. Website strategy

### A1. Brand positioning

**One line:** Huston Logic builds custom websites and fixes the workflows behind them, for small businesses, solo pros and bands. One person does the work, from the first call to the handoff.

**Tagline (footer, bios):** Custom websites and workflows, from hello to handled.

**Positioning statement:**
Huston Logic is one business with two ways in.
- **Websites.** Every site is custom, designed for one client, never a template. The price starts at `[[$750]]` because AI does the slow parts of the build; Grant designs every page and checks it himself. The base site includes a contact form that writes back: every inquiry reaches the owner and a spreadsheet they own, and the person gets an automatic reply right away. A personalized follow-up sequence, online booking, an editable blog and extra pages are add-ons.
- **Workflow consulting.** For owner-led teams whose admin has outgrown them: follow-up, payments, reporting, staff pay, CRM cleanup, automations and custom tools. It starts with a fixed-fee Workflow Review, credited toward the fix, and usually works inside the software the business already pays for.

**How the two connect:** the contact form on every site is already a small piece of workflow work. A website client sees how Grant thinks about the moment someone says hello. A workflow client often needs a site that feeds the pipeline properly. That is what the H1 says: the site brings people in, and the system behind it answers them.

**Supporting line:** AI-accelerated, checked by hand. It appears once near the hero (`[[DESIGN: placement]]`). The long version appears exactly twice, once on Services and once on About:
> AI does the slow parts of the build, so the price doesn't have to cover them. I design every page and check it myself before you see it.

**What "checked by hand" can honestly point to:**
- Grant designs and reviews every page himself.
- Every site goes through the same build pipeline as this one: automated accessibility, performance, dependency and code-scanning checks before anything goes live, plus a manual check on phone and desktop.
- Workflow proof: 21 client accounts led at a Zoho consulting partner, and client systems projects since 2024.
- Grant's background, confirmed Nov 14 and used once on About: "I've spent my career where software meets business, as an application developer, business analyst and software consultant. Checking what AI builds is the same work, done faster."
- Website-specific proof stays a placeholder until the first three sites are live.

**The feeling we want:** *"He gets what I need, he told me the price first, and the thing he built works."*

**Brand personality:** serious about the work, relaxed about himself. Specific, warm, a little dry. Glad to be in the conversation, exact about what's included, and calm about the client's mess.

**Look:** STYLE-GUIDE.md v2 still governs the build (bone, ink, one rust accent, two-voice headlines, two animated moments). Style guide v3 will revisit the parts that read as AI defaults, using inspiration sites Grant brings (E3).

**Zoho's role:** a deep specialty and a strong expertise, never a gate or a requirement. It appears on Services ("Platforms I know well"), in one FAQ and in a short "Already on Zoho?" callout. It never appears in the hero, headlines or navigation.

### A1b. Voice rules

The balance in one line: serious about the work, relaxed about himself. These replace Revision 6's voice table.

1. **Write as Grant**, one person, talking to a business owner he likes. First person, contractions, plain verbs: "I build," "I check." Never "we," "our team," or a sentence with no person in it.
2. **Get specific fast.** Name a moment the client has lived through (an inquiry sent Friday and still unanswered; wincing when they send their own link) before naming what's for sale.
3. **Fact first, wink second.** The first line must stand alone as a serious claim. Humor goes in the second beat: the italic line, a parenthesis, a one-line description. One per section.
4. **The joke is on Grant or on the situation.** Never on the client, and never on the quality of the work. Models: "(please don't go looking for those old videos)" and "A small sample, I know."
5. **Credibility comes from precision, not adjectives.** State the price before work starts, what's included, who owns the logins, how long the call is. Praise comes only from clients, in their own words.
6. **Cut the hedges and the volume.** No "no pressure," "just," "hopefully" or "I think." No exclamation points. Sound like someone who has done this before and enjoyed it.
7. **Say how it's made before anyone asks:** "AI-accelerated, checked by hand." Never "AI-powered," never a multiplier, never a comparison with agencies. Anything unconfirmed stays a `[[placeholder]]`. The only price is `[[$750]]`.
8. **Alliteration belongs in names and labels** (Scope it, Shape it, Ship it; "from hello to handled"). Sentences stay plain. Labels a client will see on an invoice are never jokes. If a line works only because it's catchy, cut it.
9. **Shapes that kept turning up in drafts and were cut:** mirrored pairs ("Websites up front. Workflows out back."), lists of three ("designed, built and tested"), a list whose third item is the joke, question headlines ("Got twenty minutes?"), "more X, fewer Y" result claims, "everything" and "always" promises, and stock process words (Discover, Design, Deliver). **Banned words:** elevate, seamless, effortless, unlock, empower, solutions, tailored, crafted, journey, "built for," "without the hassle."
10. **Three tests before a line ships.** Could a competitor paste it unchanged? Does it name something a client has lived through? Would Grant say it out loud to a friend? Fail one and it gets rewritten.

**Approved exceptions.** Grant's final lines (B1 hero, steps, the three two-voice H2s, both doors, the header link and the tagline) are approved as written, even where they use a banned shape: the H1 ("The site brings them in. The system answers.") is a mirrored pair, and Scope it · Shape it · Ship it is a list of three. Don't "fix" them. No other copy gets an exception. Client quotes are never edited to fit these rules.

### A2. Target visitors

| Line | Who | What they're feeling | What they need to see |
|---|---|---|---|
| **Websites** | Small businesses, solo professionals and creatives (bands, artists) who need a site that looks like them and answers people. The first three clients: two engineering-related firms and a band | "I wince when I send someone our website." "People fill in the form and I find it days later." | A real price before the call, a custom design, a form that writes back, and proof that they'll own the domain and logins |
| **Workflows** | Owners and operations leads of owner-led businesses with roughly 3–15 people. Health & wellness (therapy, allied health, training and movement studios) is the lead market hypothesis and where the current proof comes from; it is not the brand | "I hired people and I'm still the bottleneck." Inquiries slip, payroll and reporting are manual, the software is half set up | Their own problems named plainly, proof from a therapy practice and a training studio, respect for the tools they already have, and a low-risk first paid step |
| **Workflows** | Existing Zoho users with a messy or underused setup (any industry) | "We pay for Zoho and use 10% of it." | Deep Zoho credibility on Services and About; "rescue, don't rebuild" |
| **Both** | Referral-driven small businesses in other industries (coffee roasters, professional services, trades, wholesale) | "Does he work with businesses like mine?" | An explicit yes, and the agency industries on Past Work |
| **Overflow** | Independent Zoho partner agencies | "Is he legit and available?" | A small "Zoho partners" note with a direct route (About, Contact) |

### A3. Messaging hierarchy

1. **Tagline:** Custom websites and workflows, from hello to handled.
2. **Hero:** The site brings them in. *The system answers.* Subhead: Custom websites for small businesses, and the follow-up that turns an inquiry into a booking. Supporting line: AI-accelerated, checked by hand.
3. **How:** 01 Scope it, 02 Shape it, 03 Ship it, the same for a website or a workflow, right under the hero.
4. **Two doors, in the first screen:** "I need a website." (custom, from `[[$750]]`, the contact form writes back) and "Things keep slipping." (a fixed-fee Workflow Review, credited toward the fix).
5. **Problem recognition:** You've been busy with the real work. *Your website and your inbox can tell.* Six moments, two of them about the website.
6. **What you can hire me for:** websites and workflow consulting, as two equal groups.
7. **Why trust me:** client words (systems projects so far), agency experience across 21 client accounts, and website case studies once the first three are live.
8. **What happens at each step:** Same three steps, *website or workflow.* You see the price before I build.
9. **Action:** pick a door, or book the free 20-minute call (step zero). Closing: Twenty minutes. *Worst case, you get one good idea.*

### A4. Differentiators (each backed by evidence)

| Differentiator | Website phrasing | Evidence |
|---|---|---|
| Custom, with a published starting price | "Custom, from `[[$750]]`." | Grant's decision (D37). The price is confirmed only after the free sites' hours are logged |
| The contact form writes back | "The contact form writes back." | Included in the base site (D37). The same flow runs on this site (E6) and in the IFC inquiry pipeline |
| Says how it's made | "AI-accelerated, checked by hand." | D39. The build pipeline's required checks (accessibility, Lighthouse, dependency review, code scanning) and Grant's own review |
| You see the price before I build | "Plan and price, before I build." | Fixed-fee Review and fixed website prices agreed in writing (Business Plan) |
| You own it | "Live, and the logins are yours." | Ops Guide: client-owned accounts, domain and hosting |
| Diagnose before prescribing (workflows) | "You can stop here. If the honest answer is 'you don't need a build,' that's still a win." | Business Plan: the Review is a standalone deliverable. Toolkit: "A finding that no build is justified is a valid paid outcome." |
| Works with existing systems | "I start with the tools you already pay for." | Hideout Fitness: kept Trainerize and built the reporting around it |
| One person | "The person on your call is the person doing the work." | Solo operation (Founder Brief §11); IFC and Hideout were personally built |
| Has led bigger, messier projects | "I led delivery for 21 client accounts at a Zoho consulting partner." | Agency experience record. Never name the agency or its clients |
| Hands off properly | "Live, and the logins are yours." | All three wrap-up surveys rated handoff/training 5/5; IFC: all employees trained; 14-day correction window |
| Takes sensitive data seriously | "Working with health information? The right agreements and access controls come first." | BAAs on two therapist engagements (D17); agency HIPAA groundwork for a benefits brokerage |

### A5. Conversion strategy

- **Primary action: the two doors.** The band directly under the framework diagram, inside the first screen, has two doors. "Start a website →" opens `/contact?topic=website` and "Fix a workflow →" opens `/contact?topic=workflow`, with the matching answer already chosen in "What do you need?". The contact page offers both the scheduler and the form.
- **Header:** "Say hello ↘" jumps to the doors (`/#hello`). No button.
- **Step zero everywhere else:** "Book a free 20-minute call →" goes to the scheduler, in the steps section, the closing band, on mobile under the hero, and in the closing CTA of every inner page. The call is never a numbered step.
- **Show the "how" in seconds:** the compact framework sits right after the hero.
- **Secondary:** "See what I've built" (Past Work), the Insights articles, and "send a quick note" for people not ready to book.
- **Low friction:** at most five required form fields (four today), no questionnaire, scheduling without the form, and a clear promise: an automatic reply right away, then Grant's own reply within one business day.
- **Qualify gently:** say what's included and what a good fit looks like. Don't gate.
- **Make the first purchase feel safe:** a website price is published and fixed before the build; the Workflow Review is fixed-fee, yours to keep and credited toward the fix. Its fee comes up on the call (voice rule 7).
- **No aggressive tactics:** no pop-ups, countdowns or exit-intent modals, and no drip emails to visitors. The form sends one automatic reply; everything after that is Grant writing.

### A6. Breadth without looking unfocused

- Lead with moments everyone has lived through: the site you wince at, the inquiry found on Tuesday, the payroll weekend.
- Two equal groups everywhere (Websites, Workflows), never one framed as the smaller or easier way in.
- Mix the examples: engineering firms and bands for websites; therapy practices, training studios and coffee roasters for workflows. Don't brand the site as a wellness consultancy.
- Answer breadth questions in one place each: the closing-band microcopy on Home and the "What kinds of clients" FAQ on Services.

### A7. Sitemap and navigation

```
/                      Home
/how-i-work            How I work (step zero + Scope it · Shape it · Ship it, website and workflow columns)
/services              Services (Websites · Workflows · Care · FAQ)
/past-work             Past Work (Websites · Systems projects · Agency experience)
/about                 About
/insights              Insights (blog index, category filter)
/insights/[slug]       Article
/contact               Contact (scheduler + short form; ?topic=website|workflow|partner)
/contact/thanks        Form confirmation
/privacy               Privacy policy
/404                   Not found
```

**Header nav (text links only, no button):** How I work (→ /how-i-work) · Websites (→ /services#websites) · Workflows (→ /services#workflows) · Past work · About · Say hello ↘ (→ /#hello). Mobile: the wordmark and "Menu". Insights, Contact and Privacy are linked from the footer and in-page CTAs.

**Footer:** wordmark · tagline "Custom websites and workflows, from hello to handled." · brand line "Grant Huston · `[[Based in Orange County, CA]]` · Working with clients anywhere" · nav links · Insights · Contact · info@hustonlogic.com · [LinkedIn](https://www.linkedin.com/in/granthuston/) · "Zoho partners: need overflow help?" (→ /contact?topic=partner) · Privacy · © 2026 Huston Logic

### A8. Engagement framework (the operating model)

The same three steps run the marketing and the delivery, for both lines. Step zero, the free 20-minute call, comes first and isn't numbered.

| Step | One line | Website | Workflow | Gate |
|---|---|---|---|---|
| **Step zero: free call** (20 min) | n/a | What the site must do, who it's for, timing, domain and content readiness | One problem, current tools, owner, urgency | Qualified → send a plan and price (website) or propose a Review (workflow) |
| **01 · Scope it** | Plan and price, before I build. | A short brief: pages, words, photos, logo, two or three sites they like. A written plan and a fixed price. No separate fee | The Workflow Review: fixed fee, paid before work; one process, up to two tools; interview, screen-share, safe sample, native-tool check, ranking. Written findings, a prioritized plan, a scoped quote if a build is justified | Website: client approves the plan and price, then pays 50% to start; the other 50% is due at launch. Workflow: the **decision point** (below) |
| **02 · Shape it** | Built, then I try to break it. | Design and build, a private preview link, one revision round, then testing on phone and desktop plus the pipeline checks, and test inquiries through the form | A scoped build with acceptance tests agreed first, the Review fee credited once, a deposit, testing with safe data, a check at 75% of hours, change requests in writing | Client approves the preview (website) or runs the acceptance script (workflow) |
| **03 · Ship it** | Live, and the logins are yours. | Launch on the client's domain, accounts in their name, a short handoff guide, 14 days of fixes, optional Site Care | Training, runbook and documentation, ownership confirmed, access reviewed, 14-day correction window | Testimonial and permission step → closed, or Care |

**Decision point after a Workflow Review.** The client chooses one of four outcomes: (a) **stop**, report in hand, which counts as a success; (b) **do it yourself** from the plan; (c) **commission Shape it** at the quoted scope; (d) **defer.** If the fix is infeasible or outside Grant's capability, recommend a paid feasibility step or refer it on. Track how many Reviews end in (a), (b) and (c); the Business Plan's validation test (2 implementations from the first 5 paid Reviews) depends on it.

**Between the lines.** At a website handoff, offer Site Care, and mention the Workflow Review only if the client described a workflow problem. At a workflow handoff, ask whether the website is feeding the pipeline properly. Neither line is a step toward the other.

**After Ship it:** Site Care or Care is optional and offered only when a continuing need exists. Run an outcome review after a suitable observation period, keeping technical acceptance separate from business results.

*Prices other than the published `[[$750]]`, internal hour budgets and invoice splits live in the Business Plan, not in this file, because this file goes into the code repository.*

---

## B. Complete website copy

> Notes for the developer appear in *italics in brackets*. Everything else is publication copy.

### B1. HOME

**SEO title:** Huston Logic | Custom Websites & Workflow Consulting for Small Businesses
**Meta description:** Custom websites from `[[$750]]` with a contact form that writes back, plus workflow consulting for small businesses and bands. You see the price before I build.

---

**[Hero]** *(component: `Hero`; centered; see STYLE-GUIDE.md §4–5)*

*Eyebrow:* Websites and workflows for small businesses

# The site brings them in. *The system answers.*
*(Two-voice headline: line 1 in Inter Tight 800, `ink`; line 2 in Newsreader italic, `rust`, on its own line.)*

Custom websites for small businesses, and the follow-up that turns an inquiry into a booking.

*Supporting line:* AI-accelerated, checked by hand. `[[DESIGN: placement]]`
*(v2 leaves about 40u between the subhead and the diagram, so this line has no slot yet. Options for style guide v3: move the diagram down about 50u, set it as a mono caption above the diagram, or place it inside the website door. Until v3, render it as a mono caption directly under the subhead.)*

*(Desktop: no buttons in the hero. Mobile: one full-width **[Book a free call →]** button under the subhead.)*

---

**[Framework: compact]** *(component: `ProcessSteps`; the main animated moment; see STYLE-GUIDE.md §5 and §7)*

*Visually hidden H2:* How it works: Scope it, Shape it, Ship it

| # | Step | One line | Icon (same positions as v2) |
|---|---|---|---|
| 01 | **Scope it** | Plan and price, before I build. | overlapping circles, the left one dashed (`scope`) |
| 02 | **Shape it** | Built, then I try to break it. | target: two rings and a center dot (`shape`) |
| 03 | **Ship it** | Live, and the logins are yours. | diamond outline with a filled center (`ship`) |

*(The icons and animations are unchanged from v2; only their names change, from find/fix/flick to scope/shape/ship.)*

---

**[Two-door band]** *(component: `DoorBand`, replacing `ReviewBar`; `id="hello"`; full-bleed band directly under the framework. Layout is `[[DESIGN: two-door band]]` for style guide v3. Until then: two equal halves with a 1px `rule` divider, each with its title, line and button, the button under the text so each line stays on one line.)*

| | Door 1 | Door 2 |
|---|---|---|
| *Title* | "I need a website." | "Things keep slipping." |
| *Line* | Custom, from `[[$750]]`. The contact form writes back. | A fixed-fee Workflow Review, credited toward the fix. |
| *Button* | **[Start a website →]** (→ /contact?topic=website) | **[Fix a workflow →]** (→ /contact?topic=workflow) |

*(Each button opens the contact page with the matching "What do you need?" answer already chosen. The quotation marks on the titles are part of the copy: they're the visitor speaking.)*

---

**[Problems: "Sound familiar?"]**

*Eyebrow:* Sound familiar?

## You've been busy with the real work. *Your website and your inbox can tell.*

*(Six problems in a hairline-ruled grid: 3 × 2 on desktop. Each cell has the problem in Newsreader 500 and the supporting line in Inter. No cards, quotation marks or names.)*

- **You send someone your website and wince a little.**
  The business has moved on since the site went up. The site hasn't.
- **Someone filled in your contact form on Friday. You found it Tuesday.**
  New business slips between the website, the inbox and the calendar.
- **Payroll means a weekend with three spreadsheets and a calculator.**
  Staff pay follows rules nobody wants to work out by hand twice a month.
- **A payment failed, and nobody knows who's supposed to chase it.**
  Exceptions sit in a report until they turn into a problem.
- **You pay for a CRM and use it as a very expensive address book.**
  The setup was never finished, or it was finished for the business you used to be.
- **It all works, as long as you're the one doing it.**
  You hired a team. The process still lives in your head.

*Below the grid:* If two of these sounded familiar, that's a good 20-minute call. **[Book a free call →]**

---

**[What I do]**

## What you can hire me for

I build custom websites, and I fix the workflows behind small businesses: how an inquiry gets answered, how staff get paid, how the numbers reach you. You can start with either one.

*(Developer: two groups side by side on desktop, stacked on mobile, with matching single-voice headings.)*

### Websites

**A custom site, from `[[$750]]`**
Designed for your business from scratch, on your own domain, in accounts you own. Checked for speed, accessibility, security and search basics before it goes live.

**A contact form that writes back**
Every inquiry lands in your inbox and in a spreadsheet you own, and the person gets an automatic reply right away. A personalized follow-up sequence and online booking are add-ons.

**Someone looking after it**
Site Care covers updates, monitoring and small changes after launch, if you want it.

**[See what's included →]** (→ /services#websites)

### Workflows & systems

**Follow-up that doesn't slip**
Every inquiry gets an owner, a useful reply and a clear path to a first appointment.

**Numbers you can see**
Owner dashboards for revenue, retention, staff performance and pay, from the tools you already use.

**Payments and staff pay**
Failed payments get flagged and owned. Pay follows your rules and gets checked before anyone is paid.

**Software that pulls its weight**
CRM setup and cleanup, automations, integrations, and custom tools when off-the-shelf doesn't fit.

**[See workflow work →]** (→ /services#workflows)

*Callout strip:* **Already on Zoho?** It's my deepest specialty. I fix underused and messy Zoho setups without starting over. **[See how →]** (→ /services#zoho)

---

**[Proof]**

## What clients said afterward

*(Developer: three testimonials from `testimonials.json` with the `home` placement, in this order, as a hairline-divided row; styling in STYLE-GUIDE.md §5. Each carries a mono "Systems project" label.)*

> "Grant was phenomenal. … He delivered everything exactly as we discussed, and now all the logistic guesswork is gone. It was worth the investment 5x over."
> **Jacob Rodriguez**, Owner, Hideout Fitness · *Personal training*

> "This app has completely streamlined our payroll process. What used to take hours now takes minutes, and the performance insights have been a game changer for motivating our team. Highly recommend."
> **Emily Mayot**, Owner, Orange County Therapy · *Therapy practice*

> "I got in touch with Grant and the first thing that got my buy-in was his ability to listen. … his solutions have alleviated my business stress AND have allowed me to 2x my employee base."
> **Monica Huston**, CEO/Founder, Irvine Family Counseling · *Group therapy practice*

*Case-study teaser 1:* **Hideout Fitness** · An owner dashboard that tracks retention, revenue and profit by coach and client, fed by a nightly sync from the studio's existing scheduling app. **[Read the project →]**

*Case-study teaser 2:* **Irvine Family Counseling** · A staff app, payroll submissions, an inquiry pipeline and performance dashboards for a 10-practitioner practice that had outgrown doing everything by hand. **[Read the project →]**

*Recent websites:* `[[WEBSITE CARDS: three cards (engineering firm, engineering firm, band), shown only after each site is live and the owner approves. Screenshot, one line, link to the case study.]]`
*Until the first one is live, show this line instead:* This site was built the same way I'll build yours.

*Proof Strip:*
**3 of 3** clients said the project met the goals set at kickoff · **5/5** on communication · **5/5** on handoff & training
<small>From client wrap-up surveys, 2024–2025. Three projects, three perfect scores. A small sample, I know. I'm working on making it bigger.</small>

---

**[How it works]** *(anchor: #how-it-works; component: `ProcessSteps`, variant `detailed`)*

*Eyebrow:* Scope it · Shape it · Ship it

## Same three steps, *website or workflow.*

Nothing starts until you've seen the plan and the price. It begins with a free 20-minute call: tell me what you need and what you use today, and I'll tell you straight whether I can help. **[Book a free 20-minute call →]**

**01 · Scope it.** Plan and price, before I build.
*Website:* a short brief, then a written plan and a fixed price.
*Workflow:* a fixed-fee Workflow Review, with written findings and a plan. **You can stop here.**

**02 · Shape it.** Built, then I try to break it.
*Website:* a private preview, one round of changes, then testing on your phone and mine.
*Workflow:* built in your tools where possible, and tested with safe sample data against checks agreed in advance.

**03 · Ship it.** Live, and the logins are yours.
*Website:* live on your domain, with the accounts in your name and 14 days of fixes.
*Workflow:* your team trained, the process written down, and 14 days of corrections.

*Proof line:* All three client wrap-up surveys so far rated handoff and training 5/5. *(Systems projects.)*

**[See how each step works →]** (→ /how-i-work)

---

**[Why work with me]**

## Why people hire me

**You work with me.**
Not an account manager or a junior team. The person on the call is the person doing the work.

**You see the price first.**
Fixed prices, agreed in writing before I start. No meter running in the background.

**You own it.**
The domain, the hosting account, the data and the logins are in your name from day one.

**I start with what you have.**
New software isn't always the answer. Often the fix is a setting, a process or a connection between tools you already pay for.

---

**[About teaser]**

*(Photo of Grant)*

## Hi, I'm Grant.

I've built business systems for small teams since 2024, starting with a group therapy practice that had outgrown doing everything by hand. Before Huston Logic, I led delivery for 21 client accounts at a Zoho consulting partner, in industries from healthcare to wholesale to local government. Now I build websites too. This one was first.

**[More about me →]**

---

**[Insights teaser]**

## Notes from the work

Plain-English articles on websites, follow-up, reporting and running a small team.

*(The latest three articles, as a hairline-ruled list.)*

**[Read Insights →]**

---

**[Closing CTA band]**

## Twenty minutes. *Worst case, you get one good idea.*

Tell me what's going on with your website or your workflow. If I'm not the right person, I'll tell you who is.

**[Book a free 20-minute call →]**  or  [send a quick note →]

*Microcopy:* Not a business, exactly? Bands and solo pros are welcome too.

---

### B1b. HOW I WORK

**SEO title:** How I Work | Scope It, Shape It, Ship It | Huston Logic
**Meta description:** One process for websites and workflow projects: a free 20-minute call, then Scope it, Shape it, Ship it. You see the plan and price before I build, and the logins are yours at the end.

---

*Eyebrow:* How I work

# You see the price before I build anything.

Every project, website or workflow, runs the same three steps. A free 20-minute call comes first. It isn't a step, because it costs nothing and commits you to nothing.

**[Book a free 20-minute call →]**

---

**[Step zero: the free call]**

## Step zero: a free 20-minute call

A real conversation, not a sales demo. Tell me what you need: a new site, a workflow that keeps breaking, or both. I'll ask what you use today and who'd own the result, then give you my honest take, including when a settings change, your software vendor's support team or a different specialist is the better bet.

---

**[The three steps]** *(component: `ProcessSteps`, variant `detailed`, with two columns per step: Website and Workflow. Stacks on mobile, Website first. Same icons at 56u, static.)*

## 01 · Scope it. Plan and price, before I build.

| Website | Workflow |
|---|---|
| After the call, you send me a short brief: what the site has to do, your words, photos and logo, and two or three sites you like. I send back a written plan and a fixed price. This step has no separate fee. | The Workflow Review. I look at one process and up to two tools, through an interview, a screen-share and a small sample of real data where it's safe and authorized. Then I rank what's worth fixing. It's a fixed fee, agreed before I start; I'll share it on the call. |
| *You get:* a page list, what each page does, what I need from you, the price and a launch window. | *You get:* written findings · a prioritized plan · a scoped quote for the fix, if one is worth building. The report is yours to keep, and the fee is credited in full if you hire me for the fix. |

*Callout (Workflow column):* **You can stop here.** Take the plan and run with it yourself, or put it on the shelf for later. If the honest answer is "you don't need a build," that's still a win.

## 02 · Shape it. Built, then I try to break it.

| Website | Workflow |
|---|---|
| I design and build the site and show it to you on a private preview link. You get one round of changes. Then I try to break it: phones and desktops, slow connections, keyboard-only use, and test inquiries through the form, plus automated accessibility, speed and security checks. | I build the fix, usually in the tools you already pay for, against acceptance tests agreed before I start. I test it with safe sample data before it touches your live system. Any change of scope is written down first. |
| *You get:* a preview link, one revision round, and a site that has passed its checks. | *You get:* a written scope and acceptance tests up front, and the build, tested. |

## 03 · Ship it. Live, and the logins are yours.

| Website | Workflow |
|---|---|
| The site goes live on your domain, with the domain, hosting and form accounts in your name. You get a short guide to what's where. For 14 days after launch, I fix anything that doesn't work as agreed. | I train the people who'll use it, write down how it works, and make sure someone on your side owns it. For 14 days after launch, I fix anything that doesn't work as agreed. |
| *You get:* the live site · every login · a handoff guide · 14 days of fixes. | *You get:* team training · documentation · a 14-day correction window · full ownership of your accounts, data and logins. |

*Proof line:* All three client wrap-up surveys so far rated handoff and training 5/5. *(Systems projects.)*

---

**[After Ship it]**

## After launch

Some clients want someone keeping an eye on things. Site Care covers a website's updates, monitoring and small changes. Care covers a workflow: monitoring, small changes, troubleshooting and a regular check-in. Both have a clear monthly scope, and neither is required. (→ /services#care)

I don't make 40-slide strategy decks. You get one useful improvement at a time.

---

**[Closing CTA]**

## Start with the free call.

Twenty minutes is enough to know which column you're in.

**[Book a free 20-minute call →]**

---

### B2. SERVICES

**SEO title:** Services | Custom Websites & Workflow Consulting | Huston Logic
**Meta description:** Custom websites from `[[$750]]` with a contact form that writes back, plus workflow consulting: follow-up, payments, reporting, CRM cleanup and automations. Fixed prices, agreed before I start.

---

*Eyebrow:* Services

# Websites and workflows, scoped and priced before I start.

Some people come to me for a website. Some come because work keeps slipping between their tools. The process is the same either way (→ /how-i-work), and you see the price before I build anything.

*Sub-nav (mono labels, sticky under the header):* Websites · Workflows · Care · FAQ

---

**[Section: Websites]** *(anchor: #websites)*

## Custom websites, from `[[$750]]`

Every site I build is designed from scratch for one business or band. No templates, and no page builder you're stuck with afterward.

AI does the slow parts of the build, so the price doesn't have to cover them. I design every page and check it myself before you see it.

**What `[[$750]]` includes**
- Up to 7 pages, designed around your brand and two or three sites you like
- A contact form that writes back: every inquiry goes to your inbox and to a spreadsheet you own, and the person gets an automatic reply right away
- Fast on phones and desktops, and checked for accessibility, security and search basics before launch
- Hosting set up in an account in your name, on your own domain
- One round of revisions, and 14 days of fixes after launch

**Bigger or unusual sites** get a fixed quote after the call.

**Payment:** 50% to start, 50% at launch.

**Add-ons:** a personalized follow-up sequence (emails in your voice, sent on a schedule after each inquiry) · online booking · a blog you can update yourself · extra pages · help writing the words · Site Care after launch. Each one is priced in the plan before I start.

**Who it's for:** small businesses, solo practices and bands. If people need to find you and get in touch, this is the place to start.

**What I need from you:** your words, photos and logo, two or three websites you like, and access to your domain. No words yet? I can write them with you.

**[Start a website →]** (→ /contact?topic=website)

*(Developer: hairline layout, no card or badge, single-voice heading.)*

---

**[Section: Workflows & systems]** *(anchor: #workflows)*

## Workflow consulting

Most of this work starts with one stubborn problem: a handoff that keeps failing, a report that eats a weekend, a system nobody trusts.

**Start with a Workflow Review** *(this is Scope it for a workflow; fixed fee, credited toward the fix)*
A focused look at one process and the tools involved (up to two), through an interview, a screen-share and a small sample of real data where it's safe and authorized. You get a concise written report:
- What's actually happening, and the likely cause
- What your current tools can already do (often more than you'd guess)
- A prioritized plan of practical recommendations
- A scoped quote for the fix, if a build makes sense

**You can stop here.** Implement the plan yourself, or hire me for the fix. If the honest answer is "you don't need a build," that's still a win. The fee is fixed and agreed before I start, and I'll share it on our call. If you hire me for the fix, it's credited in full toward that project.

**[Fix a workflow →]** (→ /contact?topic=workflow)

### Common fixes *(anchor: #fixes)*

**Inquiry-to-first-visit follow-up**
*For the gap between "hello" and the first appointment.*
I map what happens to an inquiry from the moment it arrives: who sees it, who owns it, how fast a useful reply goes out, and where people drop off before booking. Then I fix the gaps with clear ownership, routing, reminders and follow-up inside the tools you already use. The before and after are measured with your own numbers, not industry averages.
*Good fit if:* inquiries come from several places, your team shares intake, or you're not sure how many inquiries become first visits.
*Curious about AI-drafted replies?* I can pilot replies written in your business's voice, with a person approving every message before it goes out.

**Payment exception cleanup**
*Know what's actually been collected and what needs attention.*
Failed charges, outstanding balances and unmatched payments get flagged, assigned to someone and followed up on a routine. I configure the reminders and retries your payment tools support, then hand your team a simple recovery process. (Your team stays in charge of collection policy and talking to customers. This is systems work, not debt collection.)
*Good fit if:* you have memberships, packages or recurring billing, and "Successful" in one report doesn't always match the bank.

**Owner reporting & staff-pay reconciliation**
*See your numbers without the spreadsheet weekend.*
I pull the reports you rely on into one owner view, calculate staff pay from your approved rules, and reconcile it before anyone gets paid. Think revenue by practitioner or coach, retention, referral sources, sessions against targets. If your current software already does some of this, I use it.
*Good fit if:* pay depends on session type, rates or splits, or you make big decisions without numbers you trust.
*(I prepare and reconcile the numbers; I don't run payroll.)*

### Systems work *(anchor: #systems)*

**CRM setup, cleanup & rescue** *(anchor: #zoho)*
A CRM should run your day, not sit there as a contact list. I set up new CRMs, clean up duplicates and dead fields, rebuild pipelines that don't match how you really work, and fix automations that quietly stopped working. **Already on Zoho?** This is my deepest specialty. I rescue underused setups without starting over.

**Automations & integrations**
Connect the tools that should be talking to each other: website forms to your CRM, bookings to invoices, scheduling data to reports. I build in error alerts and a manual fallback, so a hiccup doesn't silently break your process.

**Custom business apps & dashboards**
When off-the-shelf software doesn't fit, I build focused internal tools: staff directories, payroll submissions with approvals, performance dashboards, review queues. They're sized to your team, with role-based access so people see what they should.

---

**[Section: Care]** *(anchor: #care)*

## After launch

**Site Care (websites)**
Updates, monitoring and small changes to your site, with a clear monthly scope. You keep every login either way.

**Care (workflows)**
For clients who want someone keeping an eye on a system after Ship it: monitoring, small changes, troubleshooting and a regular check-in, with a clear scope and no surprise invoices.

Both are optional, and I offer them only when there's a real need. Prices are in the plan, never sprung on you later.

---

**[What every project includes]**

## What every project includes

**Shape it**
- A written plan or scope, so you know what "done" means before I start
- Testing before anything touches your live site or system
- For workflows, the Review fee credited toward the project

**Ship it**
- A handoff guide, and training for the people who'll use it
- 14 days of fixes after launch for anything that doesn't work as agreed
- Ownership of your accounts, data and logins

*Pull quote under the lists:*
> "They delivered exactly what they promised!"
> **Jacob Rodriguez**, Hideout Fitness

---

**[Platforms]**

## Platforms I know well

I'm platform-agnostic. The right tool is the one that fits your business, and very often it's one you already have. **Zoho** is my deepest toolkit (CRM, Creator, Analytics, Books, Desk, Flow, Forms, Bookings and more). I've also worked with tools like QuickBooks Online, Trainerize, Mailchimp, Zapier, Shopify, Google Workspace and RingCentral. Websites are hosted on Cloudflare, in an account in your name.

*(Developer: a plain text list only. No logo wall implying partnerships.)*

---

**[What I don't do]**

## What I don't do (so you can find the right person)
Clinical, medical-coding or insurance-billing advice · debt collection · running payroll · 24/7 emergency support. If you need one of these, I'll point you somewhere useful.

---

**[FAQ]** *(anchor: #faq; accordion)*

## Questions people ask

**How much does a website cost?**
From `[[$750]]` for a custom site of up to 7 pages with a contact form that writes back. Bigger or unusual sites get a fixed quote after the call. Either way, the price is agreed in writing before I start, and you pay 50% to start and 50% at launch.

**Do you use AI?**
Yes, to build faster. I design, decide and check every page myself.

**Who owns the website?**
You do. The domain, the hosting account, the form and the logins are in your name from day one. If you stop working with me, the site stays yours.

**Where is it hosted?**
On Cloudflare, in an account set up in your name. `[[Typical yearly hosting and domain cost, once confirmed.]]`

**Can I edit it myself?**
With the blog add-on, you can write and edit articles yourself. Other changes are covered by Site Care, or quoted when you need them.

**How long does a website take?**
`[[Timeline, once the first three sites are done.]]`

**How much does workflow work cost?**
You get a fixed quote before any paid work starts. The Workflow Review has a set fee, which I'll share on our call, and it's credited toward the fix if you go ahead. No hourly meter running in the background.

**What if the Review shows I don't need a build?**
Then that's where it ends. You keep the report and save yourself the money and the headache. If the honest answer is "you don't need a build," that's still a win.

**Do I have to switch to Zoho?**
No. I'll work with what you have whenever it can do the job. Zoho is a strength of mine, not a sales target.

**We handle sensitive client or health information. Can you help?**
Yes, carefully. Before I touch any protected data, the right agreements go in place (like a Business Associate Agreement where required) and access controls get set up. I'll never ask you to send client records over email or a website form.

**What kinds of clients do you work with?**
Small businesses, solo professionals and creatives, from therapy practices and training studios to engineering firms and bands. If it involves a website or a messy process, I'm interested.

**Who actually does the work?**
I do. You'll work directly with me from the first call to the handoff.

**Do you work remotely?**
Yes, all of it can be done over video and screen-share. `[[If true: I'm based in Orange County and happy to meet in person locally.]]`

**What do you need from me?**
For a website: your words, photos and logo, two or three sites you like, and access to your domain. For a workflow: an hour or two of your time for the Review, access to the tools involved, and someone on your team who'll own the process afterward.

---

**[Closing CTA]**

## Bring the problem. The label can wait.

Website, workflow or both: the free call sorts out which.

**[Book a free 20-minute call →]**

---

### B3. PAST WORK

**SEO title:** Past Work | Websites & Systems Projects | Huston Logic
**Meta description:** Systems projects for a group therapy practice and a personal training studio, in the clients' own words, plus agency experience across 21 client accounts. Website case studies follow as each site goes live.

---

*Eyebrow:* Past work

# What I've built, and what the clients said.

Real projects, in my clients' own words. The website section is new, so it starts small.

*Small "How to read this page" box:*
- **Websites (2026):** designed, built and launched by me. Each appears only after it's live and the owner says yes.
- **Client systems projects (2024–2025):** scoped, built and supported by me.
- **Agency experience (2026):** delivered while employed at a Zoho consulting partner, often leading a team of developers. Client names withheld.

*Section nav (mono labels):* Websites · Systems projects · Agency experience

---

**[Section: Websites]** *(anchor: #websites; pattern is `[[DESIGN: website case study]]` for style guide v3. v2 allows screenshots only inside a 1px frame; a site needs a larger, image-led layout.)*

## Websites

*Until the first site is live, this section shows one line:* The first three sites are being built now, for two engineering firms and a band. Each one shows up here once it's live and the owner has said yes.

**Website case study template** *(one per site; repeat three times)*

`[[WEBSITE CASE STUDY 1: engineering firm. Business name (with permission), one-line summary, live URL, screenshots on phone and desktop.]]`
`[[WEBSITE CASE STUDY 2: engineering firm. Same fields.]]`
`[[WEBSITE CASE STUDY 3: band. Same fields.]]`

*Meta row (mono):* `[[business type]]` · `[[pages]]` · 2026

*Scope it · Shape it · Ship it at a glance* *(component: `CaseStudyPhases`, the Scoped / Shaped / Shipped strip)*
- **Scoped:** `[[what the site had to do, from the brief]]`
- **Shaped:** `[[what I built, and what I tested]]`
- **Shipped:** `[[launch date, what the owner now controls, what the form does]]`

*In their words:* `[[testimonial, word for word, once approved]]`

---

**[Section: Systems projects]** *(anchor: #systems)*

## Systems projects

**[Case study 1]**

### Personal training studio: owner reporting fed by a nightly sync

**Hideout Fitness** · Personal training · Owner plus a team of coaches · 2025

`[[SCREENSHOT: Hideout owner dashboard. Grant to supply; blur client and coach names]]`

*Scope it · Shape it · Ship it at a glance* *(component: `CaseStudyPhases`)*
- **Scoped:** the owner had no reliable view of attrition, retention by coach, or revenue and profit per client. His session data was locked in a scheduling app that couldn't sync in real time, and coach pay depended on three variables.
- **Shaped:** an owner app and dashboards, a nightly sync that tells cancellations from deactivated clients, and automatic coach-rate calculations.
- **Shipped:** handed over to the owner, the app's only user, with a quick review queue for the few sessions that need a human eye. Handoff and training rated 5/5 in his wrap-up survey.

*(Developer note: both case studies predate the named steps. The strip describes what happened in each phase; it doesn't claim a formal paid Review took place.)*

**The challenge**
The owner wanted a clear picture of his business: client attrition, new client generation, income, retention by coach, and revenue and profit per client. His scheduling lived in Trainerize, which couldn't sync data in real time. Coach pay also depended on several factors: the session type (four of them), how many clients were in the session, and the coach.

**What I built**
- A custom owner app and dashboards built around his existing scheduling system, without replacing it.
- A scheduled nightly sync that refreshes up to 60 days of session data.
- Logic for a tricky detail: when a session disappears from the scheduling data, the system works out whether it was cancelled or the client was deactivated, and flags unclear cases for a quick review. Dedicated screens keep that review to a few clicks.
- Automatic coach-rate calculations that re-check affected sessions every night when a session or coach changes.
- A review list that catches clients with sessions but no rate set, so nothing gets missed.

**In his words**
> "Grant was phenomenal. I gave him everything I wanted tracked from client attrition, client generation, income, retention rates per coach, revenue generated by each client, profit on each client, etc. He delivered everything exactly as we discussed, and now all the logistic guesswork is gone. It was worth the investment 5x over. I highly recommend!!!"
> **Jacob Rodriguez**, Owner, Hideout Fitness

`[[SCREENSHOT: session review queue or coach-pay view. Grant to supply; blur names]]`

**Results (client-reported, wrap-up survey):** goals met · delivered on time · 10/10 likely to recommend

---

**[Case study 2]**

### Group therapy practice: from "I do everything" to a team that runs on systems

**Irvine Family Counseling** · Group therapy practice · 10 practitioners · 2024–2025

`[[SCREENSHOT: clinician performance or referral dashboard. Grant to supply; blur clinician and client names]]`

*Scope it · Shape it · Ship it at a glance* *(component: `CaseStudyPhases`)*
- **Scoped:** the owner was handling most of the administration, supervision, policy work and her own clients herself, and most processes were manual.
- **Shaped:** a staff app with role-based access, twice-monthly payroll submissions with owner approval, a CRM inquiry pipeline and performance dashboards.
- **Shipped:** training sessions for every employee at handoff, then ongoing enhancements as the practice grew. Handoff and training rated 5/5.

**The challenge**
The owner was doing most of the work herself, from administration and supervision to policy and her own clients. Growth opportunities were piling up faster than she could act on them.

**What I built**
- **A staff app** with individual logins and role-based access. Admins see everything; clinicians see what they need. It includes an employee directory and profiles covering licenses, pay history, goals and whether each clinician is taking new clients.
- **Payroll submissions:** the app creates pay records for every clinician twice a month. Clinicians fill in their hours and submit, and the owner approves, all in one place.
- **Inquiry pipeline:** website inquiries flow straight into a CRM. The admin gets notified, the person inquiring gets a confirmation, and each inquiry moves through clear stages. Assigning a clinician notifies that clinician automatically.
- **Performance dashboards:** sessions, average rate and monthly revenue against targets for each clinician, quarterly trends, comparisons with company averages, and a referral dashboard that follows each inquiry from first contact onward.
- **Training** for every employee at handoff.

**In her words**
> "I got in touch with Grant and the first thing that got my buy-in was his ability to listen. He knew my complicated, out-of-the-box mindset, he knew what I was trying to say and he knew what solutions existed that could help me. … his solutions have alleviated my business stress AND have allowed me to 2x my employee base. … I truly recommend him for businesses on the cusp of growing to their next level. Grant will see you there as he saw me there."
> **Monica Huston**, CEO/Founder, Irvine Family Counseling

**Results (client-reported):**
- The practice grew from 5 to 10 employees. In Monica's words: "This investment had to happen to grow from a 5 to a 10 employee business."
- The dashboards get used "a few times a day."
- "Based on numbers, I made business decisions to expand."

`[[SCREENSHOT: staff app or inquiry pipeline. Grant to supply; blur names]]`

---

**[Testimonial: OC Therapy]**

> "This app has completely streamlined our payroll process. What used to take hours now takes minutes, and the performance insights have been a game changer for motivating our team. Highly recommend."
> **Emily Mayot**, Owner, Orange County Therapy

---

**[Proof strip]** *(same as Home)*

---

**[Agency experience]** *(anchor: #agency)*

## Before Huston Logic: leading projects at a Zoho consulting partner

In 2026 I worked at a Zoho consulting partner, first as a developer and then as a business systems consultant. I led delivery for **21 client accounts**, often directing a bench of developers. A few snapshots (client names withheld):

- **Disability services provider (healthcare):** led the team that built an automated pipeline from the provider's clinical system into reporting. It runs three times a day and feeds the monthly compliance reports.
- **Newly formed equipment distributor:** took parts operations from plan to live. The operations lead was soon running orders through to invoice himself, and field-service dispatch was in use about three weeks after scoping began.
- **Interior design firm:** designed a quote-to-cash flow connecting booking deposits, quotes, invoices and purchase orders, while keeping the firm's existing accounting software.
- **B2B food wholesaler:** turned a CRM the team used as a contact list into a daily sales tool, with reorder alerts, lead temperature and revenue against target. The owner reported higher CRM use and said the project met his main objectives.
- **Cleaning services company:** replaced hand-tracked vendor scoring with a system that captures bid response times and post-job survey scores automatically.
- **Trade show organizer:** redesigned a CRM that needed reworking every year into one that rolls over cleanly each season.
- **Benefits brokerage:** designed the CRM data model and the HIPAA groundwork, including coordinating the software vendor's Business Associate Agreement and marking protected fields. I also directed a help-desk build with 13 ticket layouts.
- **Behavioral health program:** moved intake and case tracking from forms and spreadsheets into a CRM, with portal access so caseworkers could work in the system without paid seats.

<small>These projects were delivered as part of a team at a former employer; my role on each is described accurately above. Industries also included HR outsourcing, B2B marketing, real estate, municipal government and nonprofit housing.</small>

---

**[Closing CTA]**

## This page has room for your project.

**[Book a free 20-minute call →]**

---

### B4. ABOUT

**SEO title:** About Grant Huston | Huston Logic
**Meta description:** Grant Huston builds custom websites and fixes the workflows behind small businesses, solo pros and bands. Zoho specialist, platform-agnostic, and the one person doing the work from the first call to the handoff.

---

*Eyebrow:* About

# Hi, I'm Grant. I like messy problems.

Specifically, the kind that live between your website, your inbox and your spreadsheet.

*(Photo)*

**The short version**
I'm the founder of Huston Logic and, for now, the whole team. I build custom websites, and I fix the workflows behind small businesses: follow-up that doesn't slip, numbers you can see, staff pay that adds up, and software that finally earns its subscription fee.

**How I got here**
In 2024 I started building systems for small businesses. My first big project was a group therapy practice that had outgrown doing everything by hand. I built the team a staff app, payroll submissions, an inquiry pipeline and dashboards, and the practice went on to grow from 5 to 10 people. Next came a personal training studio whose owner wanted real numbers on his coaches and clients, without giving up the scheduling app his team already used.

In 2026 I joined a Zoho consulting partner as a developer and moved into a consulting role within a few months. There, I led delivery for 21 client accounts: a Medicaid disability services provider, an interior design firm, a newly formed distributor, a wholesaler, a municipal government and more, often directing a team of developers. I learned a lot about what makes projects succeed, and about what happens when a business gets a system that's bigger than its problem.

So I started Huston Logic to do the work I like most: close to the owner, focused on the real problem, and sized to the business.

**Why websites too**
A website is where most of my clients' inquiries start, and the contact form is the first workflow a business has. So I build those too, starting with this site. AI does the slow parts of the build, so the price doesn't have to cover them. I design every page and check it myself before you see it. I've spent my career where software meets business, as an application developer, business analyst and software consultant. Checking what AI builds is the same work, done faster.

**What working with me is like**
Every project runs the same three steps: **Scope it, Shape it, Ship it.** In practice:
- **I listen first.** Before I suggest anything, I make sure I understand how your business actually works.
- **You see the price before I build.** The plan says what's included, what isn't, and what it costs.
- **I try to break it before you see it.** Then I fix what broke.
- **The logins are yours.** Your team is trained, the handoff is written down, and the accounts are in your name.
- **I tell you the truth.** If a Workflow Review shows you don't need a build, I'll say so.

*Pull quote:*
> "Grant listened and understood my needs, repeated them back to me in a more articulate manner than I voiced them"
> **Monica Huston**, CEO/Founder, Irvine Family Counseling

**What I bring**
- Website design and build, on fast hosting in accounts you own
- Zoho, deeply: CRM, Creator, Analytics, Books, Desk, Flow, Forms and the rest of the suite
- Integrations and automations across many other tools
- Dashboards and reporting people actually use
- Requirements, process mapping, testing and training
- Experience with healthcare and other sensitive data, where the agreements and access controls come first
- `[[Certifications, e.g. CAPM / CSM, only if current and verified. Otherwise delete this line.]]`

**Off the clock**
I also play blues guitar and write songs, which turns out to be decent training for this work: listen first, keep time, and make the parts fit together. `[[One personal line: where you live, what you're into.]]` `[[Optional: one line on why you like building for bands and other creatives.]]`

**[Book a free 20-minute call →]**

*Small box:* **Zoho partner agencies:** need an experienced, US-based consultant for overflow delivery, scoping or configuration? **[Let's talk →]** (→ /contact?topic=partner)

---

### B5. INSIGHTS (blog index)

**SEO title:** Insights: Websites, Follow-Up & Systems for Small Businesses | Huston Logic
**Meta description:** Plain-English articles on websites, inquiry follow-up, reporting, payments and getting more from the software you already pay for. Written for owners of small businesses and independents.

---

*Eyebrow:* Insights

# Notes from the work.

Plain-English advice for owners of small businesses and independents: websites that answer people, keeping new clients from slipping through, getting more from the software you already pay for, and seeing your numbers clearly. No made-up statistics.

*Category filter (mono text labels, active one underlined):* All · Websites · Systems & Software · Leads & Follow-Up · Money & Reporting · Growing a Team · Tool Tips

*Empty-state copy (for categories without posts yet):* Nothing here yet. It's on the list. Got a question you'd like answered? **[Ask me →]**

*Newsletter: not in V1.* *(Bottom CTA instead:)* **Rather talk it through?** [Book a free 20-minute call →]

---

### B6. ARTICLE TEMPLATE (applies to every post)

1. Category label (mono) · reading time
2. **Title** (H1)
3. **Dek** (one sentence on what the reader will get)
4. Author line: Grant Huston · Published [date] · Last reviewed [date]
5. **The short version**: a 3–4 bullet summary box
6. Body (H2/H3, short paragraphs, examples labeled "Example" or "From a real project (anonymized)")
7. **Try this this week**: a callout box with one concrete exercise
8. **Sources**: only if outside facts are cited; original sources, linked
9. Author box: photo, two lines, link to About
10. CTA box: "Want a second pair of eyes on this? [Book a free 20-minute call →]"
11. Related articles (two)

*Editorial rules: no invented statistics; label hypothetical examples; anonymize client details unless you have permission; show a "last reviewed" date; retire or update outdated posts instead of quietly editing them.*

---

### B7. CONTACT

**SEO title:** Contact | Book a Free 20-Minute Call | Huston Logic
**Meta description:** Need a website, or help with a workflow? Book a free 20-minute call or send a quick note. You get an automatic reply right away and Grant's own reply within one business day.

---

*Eyebrow (the one pun on the site, repeated on the 404):* Huston, we have a problem.

# Good. Tell me about it.

Two ways to start, and both are free. Send a note and you'll get one automatic reply right away, then a real one from me.

**[Left column: Book a call]**

### Book a 20-minute call
Pick a time that works. Tell me what you need and what you use today, and I'll tell you whether there's a sensible next step.
*(Scheduler embed / button: **[Pick a time →]**)*

**[Right column: Send a note]**

### Or send a quick note

| Field | Type | Required | Label / placeholder |
|---|---|---|---|
| What do you need? | radio | Yes | A website · Help with a workflow · Both · Not sure. Prefilled from `?topic=website` (A website) or `?topic=workflow` (Help with a workflow) |
| Name | text | Yes | "Your name" |
| Email | email | Yes | "Best email" |
| Business or band name | text | No | "Business or band name (optional)" |
| What's going on? | textarea | Yes | Placeholder swaps with the answer above. A website: "e.g. A site for my band with show dates and a booking form." Help with a workflow: "e.g. New inquiries come in from three places and nobody's sure who follows up." Both or Not sure: "e.g. Our site is old, and inquiries from it get lost." |
| What do you use today? | text | No | A website: "e.g. Squarespace, a Facebook page, or nothing yet." Help with a workflow: "e.g. SimplePractice, QuickBooks, Google Sheets, Zoho… or 'not sure'." |
| Current website | url | No | "Current website (optional)" |
| How did you hear about Huston Logic? | select | No | Referral · Google · LinkedIn · Article · Other |
| *(hidden)* topic | hidden | n/a | `website`, `workflow` or `partner`, from the URL |

*Under textarea:* Please don't include client or patient details, account numbers or passwords. Anything sensitive gets handled the right way, later.
*Button:* **Send it over →**
*Validation errors:* "Pick the closest one. 'Not sure' counts." · "Please add your name." · "That email doesn't look quite right." · "A sentence or two is plenty, but I do need something to go on."
*Partner variant (when topic=partner):* the "What do you need?" field is hidden, and the heading above the form reads "Zoho partner? Tell me about the work and your timeline."

**[What happens next]**

### What happens next
1. **An automatic reply** reaches you right away, so you know it arrived. Then I read your note myself and reply within one business day (Monday to Friday).
2. **Step zero: a free 20-minute call** about what you need and the tools involved.
3. **If there's a fit,** you get a written plan and price for a website, or a short written scope for a Workflow Review. If not, I'll point you somewhere useful.

*Direct email line:* Prefer email? info@hustonlogic.com

---

### B7b. /contact/thanks

# Got it, thanks [First name].

That's step zero started. Your automatic reply is on its way (check spam the first time), and I'll write back myself within one business day. Want to skip the back-and-forth? **[Pick a time now →]**

Curious what happens after the call? [Scope it · Shape it · Ship it →] (→ /how-i-work)
While you wait: [What's included in a website →] (→ /services#websites) · [How a Workflow Review works →] (→ /services#workflows)
Or read: [Before You Buy Another App, Ask These Six Questions →]

*(Auto-reply email, sent by the form Worker; plain text, from info@hustonlogic.com:)*
> Subject: Got it, thanks
> Hi [First name], your note reached me. I read every message myself and will reply within one business day. If it's easier to talk, you can pick a time here: [scheduler link]. — Grant, Huston Logic

---

### B8. 404 PAGE

# Huston, we have a problem.
This page doesn't exist, or it moved without telling anyone. (Ironic, I know.)
**[Back to home →]** · **[Book a free call →]**

---

### B9. PRIVACY (short V1, review before launch)

**Title:** Privacy Policy | Huston Logic
Huston Logic ("I") collects only what you send through the contact form or scheduling tool (your name, email, what you need, your business or band name if you give it, and your message) and uses it to reply to you and to discuss potential work. The form sends you one automatic reply. I don't sell or share your information, except with the services that run this site (hosting, email delivery, a spreadsheet I own, scheduling and analytics), which process it on my behalf. The site uses privacy-friendly analytics that don't use advertising cookies. To have your information deleted, email info@hustonlogic.com. Last updated `[[date]]`.
*`[[Have this checked against the tools you actually use; it isn't legal advice.]]`*

---

### B10. FOOTER (every page)

*(Component: `Footer`; `band` background. Order, top to bottom:)*
- Wordmark: Huston Logic
- Tagline: Custom websites and workflows, from hello to handled.
- Brand line: Grant Huston · `[[Based in Orange County, CA]]` · Working with clients anywhere
- Links: How I work · Websites · Workflows · Past work · About · Insights · Contact
- info@hustonlogic.com · [LinkedIn](https://www.linkedin.com/in/granthuston/)
- Zoho partners: need overflow help? (→ /contact?topic=partner)
- Legal line (mono): Privacy · © 2026 Huston Logic

---

## C. Testimonial and proof inventory

### C1. Summary (status as of Nov 9, 2026, per Grant)

| ID | Source file | Person / business | Grant's work? | Status |
|---|---|---|---|---|
| T1 | Testimonial – Hideout Fitness.pdf (Oct 20, 2025) | Jacob Rodriguez, Hideout Fitness | Yes (Consulting Work, Project #2, Jan–Apr 2025) | **Approved.** "Kurt" was a slip for "Grant," and Jacob confirmed it |
| T2 | Testimonial – OC Therapy.pdf (Dec 8, 2025) | Emily Mayot, Orange County Therapy, A Licensed Clinical Social Worker Inc. | Yes | **Approved** by Emily. Title confirmed: Owner (Nov 14) |
| T3 | Feedback Form IFC.docx (testimonial + wrap-up answers) | Monica Huston, CEO/Founder, Irvine Family Counseling | Yes (Consulting Work, Project #1, Mar 2024–Apr 2025) | **Approved.** Consent was given for publication. No relationship disclosure needed |
| P1 | Consulting Work (Google Doc) | Grant's own project descriptions | Yes | **Publish**, with client names (approved clients above) |
| P2 | Agency experience record | Employer projects, Jan–Oct 2026 | Grant's role is labeled per task | **Publish projects and outcomes, with no client names and no agency name.** Never present them as Huston Logic client work |
| P3 | Aggregate survey scores (T1–T3) | n/a | n/a | **Publish** |
| P4 | Screenshots of client work | n/a | n/a | **Placeholder.** Grant will supply them; blur client, patient and employee names before publishing |

**Keep on file:** each client's consent, plus Jacob's confirmation that he meant "Grant," saved with the source files. That way you can show it if anyone ever asks.

**Website clients (2026, not yet published):**

| ID | Client | Status | Needed before anything is published |
|---|---|---|---|
| W1 | `[[Engineering firm 1]]` | Free site, in progress | One-page agreement signed · hours logged per step · case study · testimonial with permission · referral ask |
| W2 | `[[Engineering firm 2]]` | Free site, in progress | Same |
| W3 | `[[Band]]` | Free site, in progress | Same |

### C2. Published wording (verbatim from source)

**T1 · Jacob Rodriguez, Hideout Fitness** (survey, Oct 20, 2025)
- Full testimonial (Past Work): "Grant was phenomenal. I gave him everything I wanted tracked from client attrition, client generation, income, retention rates per coach, revenue generated by each client, profit on each client, etc. He delivered everything exactly as we discussed, and now all the logistic guesswork is gone. It was worth the investment 5x over. I highly recommend!!!"
- Homepage cut: "Grant was phenomenal. … He delivered everything exactly as we discussed, and now all the logistic guesswork is gone. It was worth the investment 5x over."
- Short lines (Services pull quote, optional elsewhere): "They delivered exactly what they promised!" · "The organization they brought to my business logistics!"
- Scores: recommend 10/10 · satisfaction 5 · goals met: Yes · communication 5 · handoff/training 5 · on time · value 5
- "5x" is Jacob's opinion. Show it only inside his quote, never as a claim of yours.

**T2 · Emily Mayot, Orange County Therapy** (survey, Dec 8, 2025)
- Testimonial (Home + Past Work): "This app has completely streamlined our payroll process. What used to take hours now takes minutes, and the performance insights have been a game changer for motivating our team. Highly recommend."
- Also available: "Customer Service and attention to detail."
- Scores: 10/10 · all 5s · goals met · on time

**T3 · Monica Huston, Irvine Family Counseling** (wrap-up form, original testimonial text)
- Homepage cut: "I got in touch with Grant and the first thing that got my buy-in was his ability to listen. … his solutions have alleviated my business stress AND have allowed me to 2x my employee base."
- Past Work cut: "I got in touch with Grant and the first thing that got my buy-in was his ability to listen. He knew my complicated, out-of-the-box mindset, he knew what I was trying to say and he knew what solutions existed that could help me. … his solutions have alleviated my business stress AND have allowed me to 2x my employee base. … I truly recommend him for businesses on the cusp of growing to their next level. Grant will see you there as he saw me there."
- Wrap-up answers used on the site:
  - About pull quote: "Grant listened and understood my needs, repeated them back to me in a more articulate manner than I voiced them"
  - Past Work results: "This investment had to happen to grow from a 5 to a 10 employee business." · "Based on numbers, I made business decisions to expand." · dashboards used "a few times a day"
- **Don't claim time savings for IFC.** Monica wrote that the dashboard "didn’t cut my workload down or save me time. It ADDED value". The time-savings quote belongs to Emily (T2).


### C3. Placement
- **Homepage (in order):** T1 (Hideout) → T2 (OC Therapy) → T3 (IFC), each labeled "Systems project", then the two case-study teasers, the Recent websites row (once W1–W3 are live) and the Proof Strip.
- **Past Work:** W1–W3 in Websites; T1 and T3 inside their case studies; T2 as a standalone testimonial.
- **Services:** the short T1 pull quote under the Shape it and Ship it lists in "What every project includes."
- **About:** the T3 wrap-up pull quote under "What working with me is like."
- **Never** present a systems testimonial as website proof.

### C4. Going forward
Add a testimonial and permission step to every project wrap-up (the Toolkit's case-study permission template). Record the exact approved text, where it may appear, and the date.

---

## D. Blog launch content

### D1. Categories
1. **Websites:** what a small-business or band site needs, who owns what, and what the contact form should do
2. **Systems & Software:** getting more from what you already pay for
3. **Leads & Follow-Up:** inquiry to first visit, handoffs, response
4. **Money & Reporting:** payments, staff pay, dashboards, owner numbers
5. **Growing a Team:** handoffs, onboarding, processes that don't live in your head
6. **Tool Tips:** platform-specific how-tos (Zoho and others) for existing users and search traffic

### D2. Article roadmap (priority order)
| # | Title | Category | Why it matters | Status |
|---|---|---|---|---|
| 1 | **Before You Buy Another App, Ask These Six Questions** | Systems & Software | Captures the core positioning; useful to every visitor | **Complete:** `before-you-buy-another-app.md` |
| 2 | **Where New Clients Slip Through: Mapping Your Inquiry-to-First-Visit Handoff** | Leads & Follow-Up | Feeds the inquiry service; strong fit for wellness teams | Outline below |
| 3 | **Your Dashboard Should Answer a Question** | Money & Reporting | Shows off the IFC and Hideout experience; feeds the reporting service | Outline below |
| 4 | Does "Successful" Mean the Payment Was Collected? | Money & Reporting | Payment-exception service; from the Toolkit topic list | Backlog |
| 5 | What Faster Inquiry Replies Can (and Can't) Promise | Leads & Follow-Up | Honest take on the AI and speed hype; from the Toolkit | Backlog (cite CL-001 caveats) |
| 6 | Appointment Reminders: What the Research Says, and What It Doesn't | Leads & Follow-Up | Credible sources already vetted (CL-004/006/007) | Backlog |
| 7 | Automating Staff Pay Without Automating Mistakes | Money & Reporting | Staff-pay service | Backlog |
| 8 | Signs Your CRM Has Become a Junk Drawer | Systems & Software | CRM cleanup and Zoho rescue | Backlog |
| 9 | How to Hand Off a New System So Your Team Actually Uses It | Growing a Team | Differentiator | Backlog |
| 10 | When a Spreadsheet Is the Right Answer | Systems & Software | Personality, honesty | Backlog |
| 11 | What to Have Ready Before You Hire a Systems Consultant | Growing a Team | Bottom-of-funnel; feeds the fit call | Backlog |
| 12 | Five Gaps Quietly Costing Your Practice Money: a Self-Assessment | Money & Reporting | Future interactive lead tool (five-gap scorecard) | Future |
| 13 | What Your Contact Form Should Do After Someone Hits Send | Websites | The base site's main feature, explained; links both lines | Backlog (write before launch if time allows) |
| 14 | Who Should Own Your Website's Logins (You) | Websites | Ownership is a differentiator; useful to anyone hiring a web designer | Backlog |
| 15 | What a Band Website Needs, and What It Doesn't | Websites | Speaks to creatives; draws on the band case study once it's live | Backlog (after W3) |

### D3. Article 2 outline: "Where New Clients Slip Through"
- **Dek:** A one-hour exercise to find out what really happens between "I'd like to book" and a first appointment.
- **Hook:** Most owners know roughly how many inquiries they get. Far fewer know how many become a first visit, or where the rest went.
- **Sections:** (1) List every door an inquiry can come through (web form, phone, email, Instagram, referral partners). (2) For the last 30 days, count inquiries, first replies, bookings and attended first visits. (3) Find the gaps: no owner, slow first reply, mismatch with available capacity (who actually has room?), booking friction, no-shows. (4) Fix ownership before you buy tools. (5) Choose one number to watch, such as "every inquiry has an owner within one business day."
- **Real example (Irvine Family Counseling):** the practice's flow: the website form feeds the CRM, the admin is notified, the inquirer gets a confirmation, a clinician is assigned and notified automatically, and stages are tracked through to the referral dashboard.
- **Caution box:** "More inquiries only help if someone has room to see them." Use the CL-009 wording with its caveat, or skip the statistic entirely.
- **Sources:** none required. If you cite response-time research, use the Evidence Register's CL-001 caveats and the original sources.

### D4. Article 3 outline: "Your Dashboard Should Answer a Question"
- **Dek:** Why most small-business dashboards get ignored, and how to build one your team checks without being asked.
- **Sections:** (1) Start with a decision, not a chart ("Can I afford to hire another coach?"). (2) Define each number in writing: what counts, which period, which source. (3) Reconcile it against something you already trust, like the bank or a payroll total. (4) Show people their own numbers next to their targets. It motivates without nagging. (5) Decide who refreshes it and when, and show a "data as of" date.
- **Real-project examples (anonymized, with permission):** a training studio owner tracking retention and profit by coach and client; a therapy practice where each clinician sees sessions, average rate and revenue against target, and the owner says the numbers gave her the confidence to expand.
- **Sources:** none required.

### D5. Launch article (complete)
Delivered as a separate, publish-ready file: **`content/insights/before-you-buy-another-app.md`**.

---

## E. Development handoff (Claude Code)

### E1. Stack (fast V1, easy to maintain)
- **Next.js** (current stable) + **TypeScript** + **Tailwind CSS**, built as a static export and served by **Cloudflare Workers static assets** (Worker project `huston-site`). Not Pages, not OpenNext. The repo (`ghuston/huston-tech-website`) is the source of truth for versions and config; this section states intent.
- **Form endpoint:** a small Worker script handles `POST /api/contact`, because a static export has no server routes (E6).
- **MDX/Markdown** content in `/content` (articles with frontmatter; testimonials and case studies as JSON/MD).
- Fonts via `next/font` (Inter Tight, Newsreader, Inter, IBM Plex Mono).
- **Motion:** CSS keyframes plus one small `IntersectionObserver` hook, already in `design-v2/`. No animation library. Spec in STYLE-GUIDE.md §7.
- **Pipeline:** every change goes through the 3-gate, 12-step pipeline. The "Protect main" ruleset requires `check`, `a11y`, `lighthouse`, `dependency-review` and code-scanning results. These checks are what "checked by hand" leans on, alongside Grant's own review (A1).
- No CMS in V1; Grant edits content files with Claude Code. Client sites that buy the blog add-on get a Git-based CMS.

### E2. Structure
```
app/
  layout.tsx            (Header, Footer, fonts, default metadata, JSON-LD Organization)
  page.tsx              (Home)
  how-i-work/page.tsx
  services/page.tsx
  past-work/page.tsx
  about/page.tsx
  insights/page.tsx     (index + ?category= filter)
  insights/[slug]/page.tsx
  contact/page.tsx      (reads ?topic= to preselect "What do you need?")
  contact/thanks/page.tsx
  privacy/page.tsx
  not-found.tsx
  sitemap.ts  robots.ts  opengraph-image.tsx
worker/
  contact.ts            (POST /api/contact: validate, email Grant, append to Sheet, auto-reply, redirect)
components/  (v2 components in design-v2/src/components/huston; DoorBand replaces ReviewBar)
design-v2/   (STYLE-GUIDE.md, reference/, src/: the design source of truth until v3)
content/
  insights/*.md
  testimonials.json
  site.ts               (name, tagline, email, scheduler URL, LinkedIn, location, step labels
                         and one-liners, websitePrice: "[[$750]]", doors: titles, lines,
                         buttons and topics: single source of truth)
```

### E3–E4b. Design system, components and motion

**The build follows STYLE-GUIDE.md v2** (`design-v2/STYLE-GUIDE.md`, `design-v2/src/styles/huston.css`, the components in `design-v2/src/components/huston/`): bone `#F6F4EE`, ink `#29332D`, rust `#994D34`, band `#E8E9E0`, hairlines `#C0C2B4`; Inter Tight, Newsreader, Inter and IBM Plex Mono; the hero and the three-step diagram as the only animated moments.

**Where v2 and this plan disagree, copy follows Section B and layout follows v2 until v3.** v2 still contains Revision 6 copy (the hero, the three two-voice H2s, step names and lines, the Review band, the header link and the footer brand line). Don't copy those from the guide.

**Interim rules until style guide v3** (each is a `[[DESIGN: …]]` item in E9):
- **Supporting line:** a mono caption directly under the subhead.
- **Two-door band:** the v2 band background and top rule, split into two equal halves by a 1px vertical `rule`, each with a title (Inter 500, 36u), a line (Inter 26u) and a primary button under the text. `id="hello"`. Stacks on mobile, website door first.
- **Header:** six text links; the last is "Say hello ↘" (→ /#hello).
- **Icons:** `LineIcon` names change from find/fix/flick to scope/shape/ship. Geometry and animations are unchanged.
- **Case-study strip:** labels Scoped / Shaped / Shipped.
- **Website case studies:** v2 framed screenshots until v3 adds an image-led pattern.

**Style guide v3 (not this round).** Grant will bring inspiration sites; v3 is built from them. The change list is in E9 (Design decisions).

### E5. Testimonial data
`content/testimonials.json`. Render items where `approved` is `true`, filtered by placement. Add `"line": "systems"` to each existing item, so the Home row can label them and website testimonials (`"line": "website"`) can be added later through the same approval step.
```json
[
  {
    "id": "T1-hideout",
    "quoteShort": "Grant was phenomenal. … He delivered everything exactly as we discussed, and now all the logistic guesswork is gone. It was worth the investment 5x over.",
    "quoteLong": "Grant was phenomenal. I gave him everything I wanted tracked from client attrition, client generation, income, retention rates per coach, revenue generated by each client, profit on each client, etc. He delivered everything exactly as we discussed, and now all the logistic guesswork is gone. It was worth the investment 5x over. I highly recommend!!!",
    "name": "Jacob Rodriguez",
    "role": "Owner",
    "business": "Hideout Fitness",
    "industry": "Personal training",
    "source": "Client wrap-up survey, Oct 20, 2025",
    "placements": ["home", "past-work"],
    "caseStudy": "hideout-fitness",
    "line": "systems",
    "approved": true
  },
  {
    "id": "T1b-hideout-short",
    "quoteShort": "They delivered exactly what they promised!",
    "name": "Jacob Rodriguez",
    "role": "Owner",
    "business": "Hideout Fitness",
    "source": "Client wrap-up survey, Oct 20, 2025",
    "placements": ["services"],
    "line": "systems",
    "approved": true
  },
  {
    "id": "T2-octherapy",
    "quoteShort": "This app has completely streamlined our payroll process. What used to take hours now takes minutes, and the performance insights have been a game changer for motivating our team. Highly recommend.",
    "name": "Emily Mayot",
    "role": "Owner",
    "business": "Orange County Therapy",
    "industry": "Therapy practice",
    "source": "Client wrap-up survey, Dec 8, 2025",
    "placements": ["home", "past-work"],
    "line": "systems",
    "approved": true
  },
  {
    "id": "T3-ifc",
    "quoteShort": "I got in touch with Grant and the first thing that got my buy-in was his ability to listen. … his solutions have alleviated my business stress AND have allowed me to 2x my employee base.",
    "quoteLong": "I got in touch with Grant and the first thing that got my buy-in was his ability to listen. He knew my complicated, out-of-the-box mindset, he knew what I was trying to say and he knew what solutions existed that could help me. … his solutions have alleviated my business stress AND have allowed me to 2x my employee base. … I truly recommend him for businesses on the cusp of growing to their next level. Grant will see you there as he saw me there.",
    "name": "Monica Huston",
    "role": "CEO/Founder",
    "business": "Irvine Family Counseling",
    "industry": "Group therapy practice",
    "source": "Project wrap-up feedback",
    "placements": ["home", "past-work"],
    "caseStudy": "irvine-family-counseling",
    "line": "systems",
    "approved": true
  },
  {
    "id": "T3b-ifc-listening",
    "quoteShort": "Grant listened and understood my needs, repeated them back to me in a more articulate manner than I voiced them",
    "name": "Monica Huston",
    "role": "CEO/Founder",
    "business": "Irvine Family Counseling",
    "source": "Project wrap-up feedback",
    "placements": ["about"],
    "line": "systems",
    "approved": true
  }
]
```
Render quotes exactly as stored. Don't let the component "fix" punctuation or capitalization.

### E6. Contact, auto-reply and scheduling
- **Scheduler:** a single URL in `site.ts`, set to a 20-minute "Fit call" with a buffer. Zoho Bookings (running your own business on it doubles as a demo) or Calendly/Cal.com. It asks only for name, email and one optional question. Embed it on /contact.
- **Topic prefill:** `/contact?topic=website` preselects "A website"; `?topic=workflow` preselects "Help with a workflow"; `?topic=partner` shows the partner variant. The door buttons on Home and the Services section buttons use these links.
- **Form (new build work):** `POST /api/contact` to the Worker in `worker/contact.ts`, with schema validation, a honeypot field, and Cloudflare Turnstile or simple rate limiting. The Worker:
  1. emails Grant the submission;
  2. appends a row to a Google Sheet Grant owns (the same flow the base website sells);
  3. sends the sender the automatic reply in B7b;
  4. redirects to `/contact/thanks`.
- **Email-sending service (new):** the email to Grant and the auto-reply need a transactional email service (Resend or Postmark) with an API key stored as a Worker secret, and a sending domain with SPF, DKIM and DMARC passing before launch. This is new work for the pipeline and is noted in the Operations Guide.
- **Later (nice to have):** also push the submission to your CRM (Zoho CRM web-to-lead or webhook) with `source=website` and the "What do you need?" answer, so your own pipeline is the demo.

### E7. SEO, accessibility and quality essentials
- Per-page `title` and `description` exactly as in Section B; canonical URLs; Open Graph images generated with `next/og` in brand style (bone background, two-voice headline).
- `sitemap.xml`, `robots.txt`; submit to Google Search Console.
- JSON-LD: `ProfessionalService` sitewide (name, URL, areaServed, founder; `makesOffer` for the two lines, with no price until `[[$750]]` is confirmed); `Person` on About, with `sameAs` pointing to https://www.linkedin.com/in/granthuston/; `BlogPosting` on articles.
- One H1 per page; logical heading order; descriptive link text; alt text on all meaningful images.
- **WCAG 2.2 AA:** contrast per tokens; visible focus rings (2px `rust` outline + offset); skip-to-content link; labeled fields with inline `aria-live` errors; the "What do you need?" radios as a `fieldset` with a `legend`; 44×44px tap targets; keyboard-operable menu and accordion; `prefers-reduced-motion`.
- Performance: Lighthouse ≥ 90 on mobile across all four categories (enforced by the `lighthouse` check); no layout shift from fonts or embeds; the scheduler script loads lazily.
- Analytics: Cloudflare Web Analytics or Plausible (cookieless). Events: `door_click` (website / workflow), `cta_book_call` (with location), `contact_submit` (with the "What do you need?" answer), `scheduler_open`, `article_cta_click`.

### E8. Responsive behavior
See STYLE-GUIDE.md §8. Desktop scales the mockup proportionally (`--u`); below 768px it stacks:
- **Header:** the wordmark and "Menu"; the menu lists all six links.
- **Hero:** on a phone the H1's first line wraps to two lines and the second fits on one, so the H1 runs three lines (measured in the v3 reference at 390px). Check that the eyebrow fits at 390px; fallback eyebrow in E9.
- **Hero:** one full-width "Book a free call →" button.
- **Diagram:** hairline rows, each with the icon on the left.
- **Two-door band:** stacks, website door first, each with a full-width button.
- **Optional sticky mobile CTA:** it hides while the door band is in view.

### E9. What Grant must provide or decide (placeholders until then)

The site can be built and previewed with every placeholder in place. Each `[[…]]` renders as a visible highlighted placeholder in development and **fails the production build** if any remain (a grep check in CI).

**Facts and assets to supply**
1. **`[[$750]]`:** confirm the starting price after the free sites' hours are logged (D37). It appears in the Home meta, the website door, the Home "What I do" group, the Services meta, heading, list and FAQ. The base now covers up to 7 pages, so watch whether the 6–8 hour estimate holds.
2. **`[[Typical yearly hosting and domain cost, once confirmed.]]`** (Services FAQ).
3. **`[[Timeline, once the first three sites are done.]]`** (Services FAQ).
4. **Scheduler URL** for the 20-minute call (`site.ts`).
5. **Photos:** a headshot plus one or two candid working shots.
6. **Client screenshots:** four placeholders across the two systems case studies (blur client, patient and employee names).
7. **Website case studies:** `[[WEBSITE CASE STUDY 1–3]]`, the `[[WEBSITE CARDS]]` on Home, and their fields (business type, pages, Scoped / Shaped / Shipped lines, testimonial). Each needs the owner's permission. Client names `[[Engineering firm 1]]`, `[[Engineering firm 2]]` and `[[Band]]` stay out of the repo until then.
8. **Facts to confirm:** `[[Based in Orange County, CA]]` and the in-person FAQ line; the personal line (`[[One personal line: …]]`); the optional creatives line; any current certifications.
9. **Privacy:** `[[date]]`, and a check against the tools actually used.
10. A one-business-day reply commitment you're comfortable keeping.

**Design decisions (style guide v3, built from Grant's inspiration sites)**
11. `[[DESIGN: placement]]`: a first-screen slot for the supporting line (interim: mono caption under the subhead).
12. `[[DESIGN: two-door band]]`: replace v2 §5's one-title, one-button Review band with two doors (interim rules in E3).
13. `[[DESIGN: website case study]]`: an image-led portfolio pattern for website case studies and the Home cards.
14. The AI-default look: decide which of these to keep, based on the inspiration sites: cream with a serif and a rust accent, hairlines and zero radius, mono caps eyebrows, middle dots, trailing arrows, the big-number proof strip, tinted near-black.
15. The full v3 change list (beyond 11–14): update the hero copy in §4 and the content-differences table; replace the three two-voice H2s in §3; rename the steps and lines in §5 and §7, and the icons to scope/shape/ship; six header links ending "Say hello ↘", with the band anchor `id="hello"`; the Scoped / Shaped / Shipped strip; the new footer tagline and brand line; contact form changes (radio group, optional business field); check the eyebrow at 390px (fallback: "Websites and workflows" alone) and the H1's second line on phones.

**Resolved (kept for the record)**
- Name: **Huston Logic, final** (Nov 14; D41, superseding D32). One setting in `site.ts`.
- Email: **info@hustonlogic.com**. Before launch it must receive mail, and the form's sending service must pass SPF, DKIM and DMARC (F).
- LinkedIn: **https://www.linkedin.com/in/granthuston/**.
- Base price scope: **up to 7 pages** (D42).
- Website payment terms: **50% to start, 50% at launch** (D42).
- Titles: **Jacob Rodriguez, Owner; Emily Mayot, Owner.**
- Background (About): "I've spent my career where software meets business, as an application developer, business analyst and software consultant. Checking what AI builds is the same work, done faster."
- Musician (About): "I also play blues guitar and write songs, which turns out to be decent training for this work: listen first, keep time, and make the parts fit together."
- Step names: **Scope it · Shape it · Ship it** (D40; resolves D33 and the Revision 6 step-3 question).
- Publishing a price: **yes, "from `[[$750]]`"** (D37). The Workflow Review fee stays unpublished (voice rule 7).
- AI wording: **"AI-accelerated, checked by hand"** (D39).
- Hero, doors, H2s, tagline and header link: Grant's final lines (Nov 14).
- No connector arrows; geometric line art (Revision 5).

---

## F. Launch checklist

**1. Essential before launch**
- [ ] Domain, DNS, business email (SPF/DKIM/DMARC passing), and the email-sending service set up for the form
- [ ] `site.ts` filled in (email, scheduler, LinkedIn, location, `websitePrice`); every `[[placeholder]]` resolved or removed
- [ ] All pages built with Section B copy, including `/how-i-work`; no client names or agency name in the agency snapshots
- [ ] Three approved testimonials live, labeled "Systems project", with correct names and titles; consent records saved
- [ ] Screenshots supplied and blurred, or their placeholders removed; website case studies shown only with permission
- [ ] Contact form tested end to end on desktop and phone: each topic link preselects the right answer; Grant's email, the Sheet row, the auto-reply and the thanks page all work; spam protection works; the scheduler books
- [ ] Launch article published; Insights index live
- [ ] Privacy page, favicon, OG image, 404
- [ ] Titles and metas, sitemap, robots, Search Console verified
- [ ] Accessibility pass (keyboard, contrast, screen-reader spot check) and Lighthouse ≥ 90 mobile
- [ ] Step labels come only from `site.ts`: the compact and detailed blocks, How I work, Services, Contact, all case studies and the thanks page read Scope it · Shape it · Ship it, and the strip reads Scoped / Shaped / Shipped
- [ ] **Old wording sweep:** a search for `Find it`, `Fix it`, `Flick it`, `Found`, `Flicked`, `side door`, `Starter Website`, `Workflow Review ↘`, `AI-powered` and `id="review"` returns nothing in the site source
- [ ] **Visual QA:** the first screen matches the v2 references wherever v2 still applies, and the interim rules in E3 elsewhere
- [ ] **Motion QA (STYLE-GUIDE.md §7):** the hero reveal and the diagram each play once; reduced motion and no-JS show the static end state; arrows nudge on hover and focus; CLS stays at 0
- [ ] Final claims check: the only price is `[[$750]]` (confirmed); no real client data in images; no "we/our team"; no multipliers; no agency comparisons
- [ ] **Do the numbers and wording match everywhere?**
  - three steps (step zero is the call, not a fourth step)
  - 20-minute call; automatic reply right away, Grant's reply within one business day
  - 14 days of fixes after launch, for both lines
  - "5/5 handoff & training" and "3 of 3", labeled as systems projects
  - 21 client accounts
  - the Review fee credited toward the fix
  - the stop-point line worded identically on Home, How I work and Services
  - the long AI line appears exactly twice (Services, About)

**2. Important shortly after launch (weeks 1–4)**
- [ ] Publish the first two website case studies that are approved, then articles #2 and #3
- [ ] Add website inquiries to your own CRM pipeline, with the "What do you need?" answer as a field
- [ ] LinkedIn profile and banner aligned to Huston Logic, using the tagline
- [ ] Google Business Profile if serving locally
- [ ] A standard testimonial and case-study permission step in every project wrap-up (the Toolkit template)
- [ ] Ask Emily whether there's enough for a short Orange County Therapy case study, and whether she still wants help with her website
- [ ] Compare each free site's logged hours with the `[[$750]]` assumption before confirming the price
- [ ] Use the same three steps in proposals, Drive folders, invoices and CRM stages (Section G)

**3. Future enhancements**
- [ ] Interactive five-gap self-assessment (lead tool)
- [ ] Podcast/audio and transcripts in Insights
- [ ] Industry pages (therapy practices, training studios, bands and other creatives, Zoho rescue)
- [ ] Quantified case studies with measured before/after baselines
- [ ] Zoho partner credential or badge, only if formally earned
- [ ] Optional newsletter once publishing is regular
- [ ] Spot illustrations for articles and case studies, built from the `LineIcon` family

---

## G. Using the steps in delivery

Use the same labels and numbering everywhere, so a client sees one story from the website to the final invoice. The `01/02/03` prefixes keep things in order in folders and lists. Labels stay plain: they print on invoices.

**Proposal sections**
- Where you are now (from our call)
- 01 Scope it: the plan *(website: pages, content, what I need from you; workflow Review proposal: what I'll look at, the sample, what you'll receive)*
- 02 Shape it: what I'll build (scope, exclusions, acceptance tests or preview and revision round, your inputs)
- 03 Ship it: how it's handed off (accounts in your name, training or handoff guide, 14 days of fixes)
- Price and timeline (for workflows, the Review credit shown as its own line; for websites, add-ons listed separately)
- Next step

**Drive folder structure (one folder per client, named `[Client] – [YYYY]`)**
- `00 Intake`: call notes and the intake template (website or workflow version)
- `01 Scope`: the website brief and plan, or the Review notes, safe samples and report
- `02 Shape`: scope/SOW, change requests, build notes, test log, preview links
- `03 Ship`: handoff guide, training materials, runbook, acceptance sign-off, access-review record, testimonial consent
- `99 Admin`: agreements, a BAA if any, invoices

*Follow your Operations Guide on sensitive data: no PHI, client records or credentials in these folders. Client logins live in the client's own accounts or password manager, never in Drive.*

**Invoice line items**
- Website: `01 Scope it: website plan` (no charge) · `02 Shape it: website build: 50% to start` · `03 Ship it: launch: 50% balance` · add-ons as separate lines · `Site Care: [month]`
- Workflow: `01 Scope it: Workflow Review: [process]` (fixed fee, due before work) · `02 Shape it: [project]: deposit` · `Credit: Workflow Review [Review ID] (applied once)` · `03 Ship it: acceptance and handoff: balance` · `Care: [month]`

*Website terms are 50% to start and 50% at launch.*

**CRM pipeline stages** (one pipeline, with a `Line` field: Website / Workflow / Both)
`0 · New inquiry` → `0 · Call booked` → `0 · Call held (qualified)` → `01 Scope it · Plan or Review proposed` → `01 Scope it · Review in progress (paid)` *(workflow only)* → `01 Scope it · Decision point` → `02 Shape it · Building (deposit paid)` → `02 Shape it · Preview or acceptance` → `03 Ship it · Launched and handed off` → `03 Ship it · 14-day fixes` → `Closed · Complete`

Use closing reasons rather than extra stages: `Stopped after Review (success)`, `DIY from plan`, `Deferred`, `Not a fit / referred`, `Lost`. That keeps the Review-to-build rate and the website close rate easy to report (A8). Track Site Care and Care as a flag on the account.

*This is marketing guidance, not legal advice.*
