# Launch checklist

Source: the Huston Logic project file `template-launch-verification-checklist.md` (written Nov 17, 2026), sections 1 and 5. Section A and a few lines in B, C, D and E were changed on 2026-11-24 for managed hosting (`docs/PROCESS.md` rule 13). Each row keeps a proof. This repo's copy is the truth; client repos follow it.

Nothing on this list is optional unless it says so, and nothing is ticked without proof. Every client site gets a ticked copy, with the date and the proof, in the client's `03 Ship` folder.

Owner key: **G** = Grant · **C** = client (on the call, signed in) · **Bot** = Claude Code PR · **Auto** = CI / `build:launch`

Where items run: A1–A8 and D5 on the onboarding call. C7, D6–D8 and the D9 website link at cutover. D4 comes free from the template. E at handoff. F after launch.

---

## 1. Checklist

### A. Accounts and ownership (onboarding call)

| # | Item | Owner | Done means (proof) |
|---|---|---|---|
| A1 | Domain registered in the client's name; auto-renew on; registrar lock on | C | Screenshot of registrar page |
| A2 | The domain's nameservers at the registrar point to a zone for the domain in Huston Logic's Cloudflare account | C + G | The zone shows Active in Grant's Cloudflare; the registrar page shows the two Cloudflare nameservers |
| A3 | Mailboxes stay the client's (Workspace or existing host) | C | Client sends and receives a test email |
| A4 | Resend is in Huston Logic's account, with the client's domain added as a sending domain; API key straight into Worker secrets | G | Resend shows the domain Verified |
| A5 | Turnstile widget in Huston Logic's Cloudflare account | G | Widget listed; preview hostname covered |
| A6 | The form destination follows the routing rule (`docs/PROCESS.md` rule 15): the client's Pipeline app copy if they use it (`contact.destination` "pipeline", `INTAKE_SECRET` set on the copy and on the site); another tool they name (not built yet: queue it for Grant and use the Sheet meanwhile); otherwise the Google Sheet with the Apps Script writer, Grant as editor. The notification email goes to the client's inbox in every case | C + G | A test lead appears in the app or a test row appears in the Sheet, and the test email arrives |
| A7 | Uptime monitoring in Huston Logic's account, with the client as a second alert contact | G | Monitor green; test alert received |
| A8 | The client keeps only the registrar and email logins; every other login (GitHub, Cloudflare, Resend, Turnstile, monitoring) is Huston Logic's | C + G | Client confirms on the call; the list of the client's logins is in the handoff guide |

### B. Email you can trust

| # | Item | Owner | Done means (proof) |
|---|---|---|---|
| B1 | SPF, DKIM and DMARC (`p=none` to start) pass; the records are added in the zone in Huston Logic's Cloudflare | G | Gmail "Show original" shows SPF, DKIM and DMARC all PASS |
| B2 | Form notification and auto-reply land in the inbox (Gmail + Outlook) | G | Both test inboxes, not spam |
| B3 | DMARC `p=none` → `p=quarantine` after 2–4 weeks of clean reports | G | DNS record changed; date logged (post-launch, see F) |

### C. The site itself

| # | Item | Owner | Done means (proof) |
|---|---|---|---|
| C1 | No `[[placeholders]]` left | Auto | `build:launch` passes |
| C2 | Contact form end to end on desktop and phone: notification, the contact lands in its destination (the app, the Sheet or the other tool), auto-reply, thanks page, Turnstile | G | All five seen; test lead or test row deleted |
| C3 | Lighthouse ≥ 90 mobile; accessibility pass (keyboard, contrast, screen-reader spot check) | Auto + G | CI report; spot-check notes |
| C4 | Unique title and meta description on every page; favicon; OG image; 404; privacy page | Bot | Spot-check 3 pages in view-source |
| C5 | HTTPS everywhere; `www` → apex (or the reverse) redirects once | G | Both URLs land on the canonical one |
| C6 | Old host's DNS records all copied into the zone in Huston Logic's Cloudflare before the nameservers change (MX, TXT, CNAME), including any `google-site-verification` TXT | G | Record-by-record check against the screenshot |
| C7 | **Old URLs redirect.** Every URL in the old site's sitemap 301s to its new page (Wix paths like `/about-us`, `/services-1`, `/post/...` change). Without this, Google drops the old pages and the client loses whatever ranking they had | Bot + G | Script run over the old URL list: every one returns 301 → 200 |

### D. Search and discovery

| # | Item | Owner | Done means (proof) |
|---|---|---|---|
| D1 | `robots.txt` allows crawling and points to the sitemap; no `X-Robots-Tag: noindex` header on production | Bot | Live `/robots.txt`; `curl -sI` of the homepage |
| D2 | `sitemap.xml` lists every public page | Bot | Live `/sitemap.xml` matches the page list |
| D3 | Canonical tag on every page | Bot | View-source spot check |
| D4 | Structured data: `Organization` JSON-LD on the homepage only, generated from config (name, URL, logo, description, email only if the site already shows it, founder name and title only if the site already shows them). No address unless it's a real staffed location; no review/rating markup for own testimonials | Bot | validator.schema.org (Fetch URL) on the live homepage: 0 errors; view-source shows 1 `ld+json` |
| D5 | **Google Search Console**: Domain property, verified by DNS TXT; client is Owner, Grant is Full user. First check whether the client already has a property (Wix's SEO setup often creates one); if so keep it (it holds their history) and add Grant. The TXT record goes in the zone in Huston Logic's Cloudflare. If that zone is not live yet, add it at the old host; C6 copies it at cutover. Never delete an existing `google-site-verification` record (Workspace or Wix may use it) | C + G | "Ownership verified" |
| D6 | Sitemap submitted in Search Console (after cutover), using the **full URL** | G | Status "Success" |
| D7 | Homepage URL Inspection → Request indexing (after cutover), once | G | Request sent; date logged |
| D8 | **Bing Webmaster Tools**: import from Search Console, then **submit the sitemap by hand** (the import doesn't carry it) | G | Site listed; sitemap row shows |
| D9 | **Google Business Profile**, only if the business is eligible: it must meet customers in person during its stated hours (at its place, or by travelling to them). Online-only businesses are not eligible. Storefront: show address. Travels to customers: service-area business, address hidden, service areas named. Never a PO box, mailbox or unstaffed virtual office. If the client already has a profile, don't make a new one; just change the website link at cutover. Client is Owner, Grant is Manager | C + G | Profile verified; category, hours, services, website link filled |
| D10 | Bing Places: import from Google Business Profile | G | Listing claimed |
| D11 | Analytics, optional: Cloudflare Web Analytics. If on, the privacy page says so | G | Dashboard shows visits; privacy sentence present |

### E. Handoff

| # | Item | Owner | Done means (proof) |
|---|---|---|---|
| E1 | Handoff guide lists what Huston Logic holds and what the client holds (every account, who owns it, how to log in, who to call), and says the client can ask for it all to be moved (see `docs/OFFBOARDING.md`) | G | Doc in `03 Ship` |
| E2 | Walkthrough done (screen share) | G + C | Date logged |
| E3 | Access review: who has access to what is listed, Grant's access included; client knows how to remove it | G | Record in `03 Ship` |

### F. After launch

| When | Item | Owner | Done means (proof) |
|---|---|---|---|
| Day 3–7 | Search Console Pages report and URL Inspection: homepage and main pages indexed; anything "not indexed" explained or fixed; old URLs show as redirected, not 404. Bing sitemap shows URLs discovered | G | Screenshot |
| Day 1–14 | 14-day fixes window; uptime monitor quiet | G | Fix list closed |
| Day 14–30 | DMARC → `p=quarantine` (B3) | G | DNS record |
| Day 30 | First Search Console performance check; send the client 3 lines on what people searched to find them | G | Email sent |
| Day 30+ | Registrar transfer (if moving), email billing moved, old host cancelled, in that order | G + C | Old host closed |

---

## 2. Exact clicks (proven on hustonlogic.com, Nov 17, 2026)

"Client" steps are done on the call with the client signed in.

**D4 check (any site):**
1. `validator.schema.org` → **Fetch URL** tab → enter the homepage URL → **Run test**. Pass = 0 errors (warnings OK).
2. Homepage → Cmd+Option+U (view-source) → Cmd+F `ld+json` → exactly 1 match.
3. Preview link for a PR: if the Cloudflare bot comment doesn't show, go PR → **Checks** tab → **Workers Builds** → Details; or Cloudflare dashboard → **Workers & Pages** → the Worker → **Deployments** → newest entry for the branch.

**D5 Search Console:**
1. `search.google.com/search-console`, signed in as the account that will own it (the client's business Google account).
2. Property dropdown (top left) → **Add property**.
3. Use the **Domain** box on the LEFT. Type the bare domain (`example.com`, no `https://`). Not the "URL prefix" box on the right.
4. If it verifies instantly, done. If it shows a TXT record: **Copy** → DNS host (Cloudflare: zone → **DNS** → **Records** → **Add record**, Type TXT, Name `@`, paste into Content, **Save**) → back to Search Console → **Verify** (retry after 2 minutes if not found).
5. Never delete an existing `google-site-verification` TXT.
6. Client sites: Settings → **Users and permissions** → **Add user** → Grant's email, permission **Full**.

**D6 sitemap:**
1. Left menu → **Sitemaps** → "Add a new sitemap".
2. Type the **full URL** (`https://example.com/sitemap.xml`). Just `sitemap.xml` gives "Invalid sitemap address" on a Domain property.
3. **Submit**. "Couldn't fetch" for a minute is normal; refresh once.

**D7 request indexing:**
1. Top search bar → paste the homepage URL → Enter.
2. "URL is not on Google / Discovered – currently not indexed" is normal for a new site.
3. Click **Request indexing** once → wait 1–2 min → **Got it**. Don't repeat it.

**D8 Bing:**
1. `bing.com/webmasters` → sign in with the same Google account.
2. **Import** → **Google Search Console** → Continue → allow → select the site → **Import**.
3. Left menu → **Sitemaps** → **Submit sitemap** → full sitemap URL → **Submit**. "Pending" for a while is normal.
