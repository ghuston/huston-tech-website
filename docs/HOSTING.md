# Hosting register

Rate-limit ids are explained below. This site's own setup is in the README ("Deploy to Cloudflare Workers").

## Rate-limit ids

Rate-limit bindings with the same `namespace_id` in one Cloudflare account share their counters, even across Workers
(Cloudflare docs, "Rate Limiting" binding). So every site has its own ids. They are two whole numbers written as
strings: `contact.rateLimitIds` `{ production, preview }` in `site.config.ts` (`npm run sync:config` copies them into
`wrangler.jsonc`). `npm run check:config` refuses a missing pair, a pair with the same number twice, and a site that
still uses the template's 1001 and 1002. The site editor has its own id, `editor.rateLimitId` in `site.config.ts`, a whole number written as a string. Once the editor is on, `npm run check:config` also refuses the template's 1003 on a real site.

Forms add no rate-limit id. Each form counts on the site's existing contact pair, with its own key per form, so one visitor gets the same limit on each form.

**To give a new site its ids:** take the next three free ids in a row below, starting at 2001, 2002 and 2003 (the first two for the contact form, the third for the editor), then add a row in the same PR.

| Site | Production | Preview | Editor | Notes |
|---|---|---|---|---|
| The site template | 1001 | 1002 | 1003 | Only for the template itself. A site made from it must change them. |
| Huston Logic (this site, Worker `huston-site`) | 2101 | 2102 | 2103 (editor off) | Taken. The editor's id is reserved and not bound while `editor.enabled` is false. |
| Pipeline app copies | picked at install | picked at install | | The Pipeline app picks its own ids when a copy is installed. Do not assign them here. |

Other sites in the same Cloudflare account must not reuse 2101, 2102 or 2103.

## Upload storage and Images

Only a site with `editor.uploads.enabled` true has these (setup in [docs/EDITING.md](EDITING.md), steps h to l). This site has it off.

- **One private R2 bucket per site**, named `<workerName>-uploads` (`editor.uploads.bucket` in `site.config.ts`). Nothing
  is shared between sites, so one site's bug cannot reach another's files. Create it with `npx wrangler r2 bucket create`.
- **R2 is billed per Cloudflare account.** The free allowance is 10 GB-months of storage, 1 million writes and 10 million
  reads a month, for all sites together. Past that: $0.015 per GB-month, $4.50 per million writes and $0.36 per million
  reads. No egress fees. Each site's inbox is capped at 200 MB, so a full site costs at most $0.003 a month past the free tier.
- **Images is shared by the account.** The Free plan includes 5,000 unique transformations a month for all sites together.
  A photo takes 2 to 5, so that is about 1,000 to 2,500 photos a month. Past the limit the Free plan refuses and charges
  nothing. The paid plan is $0.50 per 1,000 beyond 5,000.
- **Workers**: uploads run on the existing Workers Paid plan ($5 a month in total). No change.

The full cost note is in [docs/EDITING.md](EDITING.md), "What uploads cost".

## Offboarded sites

When a client site is moved out, add a row with the handover date and release the site's ids in the table above in the same PR.

| Site | Handover date | Ids released |
|---|---|---|
| (none yet) | | |
