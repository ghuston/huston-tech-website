# Offboarding a client site

How a site that Huston Logic hosts moves to the client. Code and hosting go to the client's own GitHub and Cloudflare. After the handover, Huston Logic's liability ends. This runbook records the steps and the handover date. It does not set contract terms; those are in the client's agreement.

**Status: Not yet rehearsed.** Run it once on a test site before the first real client uses it, then change this line to the rehearsal date and result.

## Who does each step

- **G** = Grant (Huston Logic).
- **C** = the client, signed in on their own accounts. Grant only watches or helps on a screen share.

Never paste a secret, key or password into chat, a pull request or a document. The client types secret values into Terminal or the dashboard themselves.

## What the client needs ready

Have these before the handover date:

- A GitHub organisation or account for the code.
- A Cloudflare account, in the client's name.
- Their domain registrar login. The domain stays registered in their name, with auto-renew on and the registrar lock on.
- A Resend account, in their name, for the sending domain.
- A Google account for the contact Sheet and the Apps Script, if the site uses the `apps-script` writer. The Sheet belongs to this account.
- An UptimeRobot account, in their name, for the uptime monitor.
- Their mailboxes on the domain (Google Workspace or their existing host), unchanged.

## Steps

### 1. Agree the handover date and a quiet window

- **Owner:** G and C.
- **What:** Pick the handover date and a quiet window, when the site gets the fewest contact form messages. Tell the client what will happen and when. A day before the handover, lower the TTL (time to live, how long resolvers cache a record) on the DNS records of the zone, for example to 300 seconds, so the change in step 6 takes effect quickly.
- **Done means:** The date, the window and the TTL change are written in the client's `03 Ship` folder. The client has confirmed in writing that they got the plan.

### 2. Move the repo to the client's GitHub

- **Owner:** G, then C accepts.
- **What:** In the repo on GitHub, open Settings, then Danger Zone, then Transfer. Enter the client's organisation. The client accepts the transfer in their GitHub account. Repo-level settings may not move with the repo, so check each one in the new owner's repo:
  - Re-create the "Protect main" ruleset from `docs/ruleset-protect-main.json`. It needs the four required checks (`check`, `a11y`, `lighthouse`, `dependency-review`) and the "Require code scanning results" rule (CodeQL). Do not rename the jobs.
  - Turn on "Allow auto-merge" in the repo's settings.
  - Check the branch, secrets and Actions settings against the old repo.
- **Done means:** The repo shows under the client's organisation. The ruleset is active on `main` with all four checks and CodeQL. "Allow auto-merge" is on. A test pull request shows the checks running.

### 3. The client creates their Cloudflare account

- **Owner:** C.
- **What:** The client signs up for Cloudflare with their own email and sets up the account. Grant is not invited to it.
- **Done means:** The client shows the account name on screen. Grant is not a member of it.

### 4. Create the Turnstile widget in the client's account

- **Owner:** C creates the widget. G makes the pull request.
- **What:**
  1. In the client's Cloudflare, open Turnstile and create a widget in Managed mode. Add the hostnames: the domain (it covers its subdomains), and the account's `<account>.workers.dev` address (for the preview hosts). Check the list in `docs/pipeline/gate3-deploy-ops.md`.
  2. Copy the new **site key** into `contact.turnstileSiteKey` in `site.config.ts`. The site key is public.
  3. Run `npm run sync:config` and commit the result through a pull request (a normal branch, all checks, the owner merges).
  4. The **secret key** is not written anywhere in the repo. It goes into the Worker in step 5.
- **Done means:** The widget is listed in the client's Turnstile with the domain and the workers.dev hostname. The pull request with the new site key is merged.

### 5. Recreate the Worker in the client's account

- **Owner:** C runs the commands, or G on a screen share with C.
- **What:**
  1. Connect Workers Builds to the repo in the client's GitHub organisation. One GitHub account can point to only one Cloudflare account, so the connection must be made from the client's account. Use these settings, as in the README ("Deploy to Cloudflare Workers"):
     - Production branch `main`.
     - Build command `npm run build`. Use `npm run build:launch` once the site is final, so a build with unresolved placeholders cannot go live.
     - Deploy command `npx wrangler deploy`. Workers Builds runs it. Nobody runs it by hand.
     - Root directory `/`.
     - Build variables: `NODE_VERSION=22`, and `NEXT_PUBLIC_SITE_URL` set to the final domain.
  2. Check that the Worker name matches `name` in `wrangler.jsonc`.
  3. Set new rate-limit ids in `contact.rateLimitIds` in `site.config.ts`. Ids must be unique in the client's account, so any two whole numbers work there; they no longer have to follow the register in `docs/HOSTING.md`. Run `npm run sync:config`, and commit through a pull request.
  4. Set every name under `secrets.required` in `wrangler.jsonc` for production and for previews. Use the names from `docs/SECRETS.md`:
     - Production: `npx wrangler secret put <NAME>`.
     - Previews: `npx wrangler preview base-config secret put <NAME>`.
     Set the previews before the first preview is created, because a preview copies the base secrets when it is made.
  5. Secrets to set: `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` for every site. Then, by `contact.destination` in `site.config.ts`: `INTAKE_SECRET` for `"pipeline"`; or, for `"sheet"`, `SHEET_WEBHOOK_URL` and `SHEET_WEBHOOK_SECRET` for the `apps-script` writer, or `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID` for the `service-account` writer (`contact.sheetWriter` says which).
  6. Resend: the client creates their own Resend account, adds their domain, and makes a new API key with sending access for that domain only. The new key goes straight into `RESEND_API_KEY` with `wrangler secret put`.
  7. Destination:
     - `apps-script` (this repo's default): the Sheet and the Apps Script already belong to the client's Google account. Check that `SHEET_WEBHOOK_URL` and `SHEET_WEBHOOK_SECRET` are set and match the Script Property `SHEET_SECRET`. Reuse the same web app, or deploy it again from the client's account and set the new URL.
     - `service-account`: check `GOOGLE_SHEET_ID` and `GOOGLE_SERVICE_ACCOUNT_KEY`. The Sheet must still be shared with the service account as Editor.
     - `"pipeline"`: the Pipeline app copy keeps running where it is (it is already in the client's own Cloudflare account). Set `INTAKE_SECRET` on the new Worker to the same value the copy holds. If nobody knows it, set a new one on both the copy and the Worker.
  8. Secret values are typed by C into the hidden prompt. They are never pasted into chat.
- **Done means:** `npx wrangler secret list` in the client's account shows every name under `secrets.required` (names only). The preview for the pull request in step 4 works and sends a test note. The Worker is listed under the client's Cloudflare Workers.

### 6. Move the DNS zone

- **Owner:** G exports and imports the records. C changes the nameservers at the registrar.
- **What:**
  1. In Huston Logic's Cloudflare, open the zone, then DNS, then Records. Export the records.
  2. In the client's Cloudflare, add the domain as a new zone. Import the exported records.
  3. Compare the records one by one against the export. Check these with extra care:
     - MX records (mail).
     - SPF (the root TXT record). It must be the one Google Workspace needs. Do not add Resend to it.
     - DKIM (`google._domainkey` and any other DKIM record), and `resend._domainkey`.
     - DMARC (`_dmarc`).
     - The Resend records: CNAME `send` and CNAME `rsend`, both "DNS only". Do not add an MX or SPF record on `send`.
     - Any `google-site-verification` TXT record (Search Console). Never delete one.
  4. Add the custom domains to the Worker in the client's account: Workers & Pages, the Worker, Settings, Domains & Routes, Add, Custom domain. Add the apex and `www`. Then add the `www` to apex redirect rule and the proxied `AAAA` record `www` with content `100::`, as in `docs/pipeline/gate3-deploy-ops.md`.
  5. C changes the nameservers at the registrar to the two nameservers that the client's zone shows. Wait until the zone shows **Active**.
- **Done means:** The zone is Active in the client's Cloudflare. The registrar shows the client's nameservers. A record-by-record check of the list in 3 is ticked, with the date, in the `03 Ship` folder.

### 7. Check the live site

- **Owner:** G, with C.
- **What:** Run these checks on the live domain:
  1. Pages load over HTTPS: `curl -sI https://<domain>/` returns 200.
  2. `www` and the apex each land on one address. The `www` address redirects once to the apex.
  3. `curl -s https://<domain>/robots.txt` allows crawling and names the sitemap.
  4. `curl -sI https://<domain>/` does not send `X-Robots-Tag: noindex`.
  5. `curl -s -X GET https://<domain>/api/contact` returns `{"error":"method_not_allowed"}` (405). The Worker is live.
  6. Send one test note through the form on desktop and phone. The note arrives at its destination (the lead in the Pipeline app, or the Sheet row under the production tab), the notification email reaches the client's address, and the automatic reply arrives. Delete the test row afterwards.
  7. Send and receive a test email on the domain's mailboxes. Gmail "Show original" shows SPF, DKIM and DMARC all PASS on the notification and the reply.
  8. The client's UptimeRobot monitor points to `https://<domain>/` and is green. The client set it up in their own account.
- **Done means:** Every check above is ticked with its result and date in the `03 Ship` folder. If one fails, do not go on to step 8. Use "If something goes wrong" below.

### 8. Remove Huston Logic's access

- **Owner:** G, with C confirming.
- **What:** Remove Grant's access in each place. Do this only after step 7 passes.
  - GitHub: remove Grant from the client's organisation.
  - Cloudflare: remove Grant from the client's account. In Huston Logic's own account, leave the old zone and the old Worker in place until step 10.
  - Resend: the sending domain and the API key in Huston Logic's Resend account are removed or revoked. Do this only after the client's key works (step 7).
  - Turnstile: remove the old widget in Huston Logic's account.
  - UptimeRobot: remove Grant as an alert contact, if the client did not keep him.
  - Search Console and Google Business Profile: the client may keep Grant as a user. Otherwise remove him.
  - Google Sheet: remove Grant as editor. Remove the Apps Script from Huston Logic's access if it was shared.
  - Hand the client a list of what they now own: the domain, the repo, the Cloudflare account, the Worker, the Turnstile widget, the Resend account, the Sheet and Apps Script, the uptime monitor, and any Search Console and Business Profile listings.
- **Done means:** The client confirms in writing that the list was received. A screenshot or note shows Grant is removed from each place above.

### 9. Record the handover date

- **Owner:** G.
- **What:** The handover date is the date Huston Logic's liability ends. Write it in two places:
  1. The "Offboarded sites" table in `docs/HOSTING.md`, through a pull request.
  2. The client's `03 Ship` folder.
  Release the site's rate-limit ids in the "Rate-limit ids" table of the same file, in the same pull request.
- **Done means:** The row is in the table with the handover date. The `03 Ship` folder has the date. The rate-limit ids are marked released.

### 10. After a week: clean up

- **Owner:** G.
- **What:** One week after the handover, if nothing has broken, delete the old Worker and the old zone in Huston Logic's Cloudflare. Note the deletion in the same row of the table in `docs/HOSTING.md`.
- **Done means:** The old Worker and old zone are gone. The table row has the date of the deletion.

## If something goes wrong

- **Keep the old zone and the old Worker untouched until step 10.** They are the way back. If the new zone or the new site fails, the client changes the nameservers at the registrar back to the old Cloudflare nameservers. The old zone must still exist for that to work.
- **Mail stops.** Check the MX, SPF, DKIM and DMARC records in the new zone against the old export. Fix the record, then check again with "Show original".
- **The form fails.** Check the Worker secrets with `npx wrangler secret list` (names only). Check the Turnstile hostnames. Error 110200 on a preview means the Turnstile widget does not cover that host.
- **The site breaks after the move.** Use the rollback runbook in the README ("Rollback runbook"). It works in the client's Cloudflare the same way. Pick the last good production deployment, never a preview. Do not delete or rename a secret while older versions may still be needed.
- **Do not delete anything** (the old zone, the old Worker, a secret, an old `google-site-verification` record) until step 10 and the owner's sign-off.
