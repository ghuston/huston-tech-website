# Secrets and settings for the forms and the site editor

Every secret and public setting the contact form, the other forms and the site editor use, in one place. **Names and places only,
never values.** The site owner sets every secret personally, in their own Terminal or in the Cloudflare and Google dashboards.
Claude, CI and the repo never see them, and nothing here should be pasted into chat, a pull request, an issue or a log.

## Where a submission is saved on this site

The contact form (`worker/contact.ts`) and every other form (`POST /api/forms/<id>`, `worker/forms.ts`) save the same way:

1. **The Pipeline app** (`https://pipeline.hustonlogic.com/intake`), production only, while `INTAKE_SECRET` is set.
2. **The Google Sheet** when the app is not set up, did not take it, or the request is a preview. The Worker signs in to Google as
   a service account and writes through the Sheets API. The contact form writes the `Submissions` tab (previews: `Preview`);
   every other form writes the `Forms` tab (previews: `Forms preview`). The names are `contact.sheetTabs` in `site.config.ts`.
3. **The notification email** to the site's own address, always.

This site uses the service-account writer (`contact.sheetWriter` is `"service-account"`). The Apps Script writer in the template is
not used here; `docs/apps-script/contact-sheet.gs` is kept as reference only.

`wrangler.jsonc` lists four names under `secrets.required` (`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `GOOGLE_SERVICE_ACCOUNT_KEY`,
`GOOGLE_SHEET_ID`), and a deploy fails while one is missing. `INTAKE_SECRET` is optional until Grant moves it into that list.

## Worker secrets

| Name | What it is | Needed by | Production | Preview |
| --- | --- | --- | --- | --- |
| `RESEND_API_KEY` | Resend API key, "Sending access" for the site's domain only. Sends the notification, the automatic reply and the download email. | Always | `npx wrangler secret put RESEND_API_KEY` | `npx wrangler preview base-config secret put RESEND_API_KEY` |
| `TURNSTILE_SECRET_KEY` | The secret key of the site's Cloudflare Turnstile widget. | Always | `npx wrangler secret put TURNSTILE_SECRET_KEY` | `npx wrangler preview base-config secret put TURNSTILE_SECRET_KEY` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | The whole service-account JSON key file. | The Sheet (the fallback, and every preview) | `npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY < path/to/key.json` | `npx wrangler preview base-config secret put GOOGLE_SERVICE_ACCOUNT_KEY < path/to/key.json` |
| `GOOGLE_SHEET_ID` | The Sheet ID (between `/d/` and `/edit` in its URL). | The Sheet | `npx wrangler secret put GOOGLE_SHEET_ID` | `npx wrangler preview base-config secret put GOOGLE_SHEET_ID` |
| `INTAKE_SECRET` | The shared secret the Worker sends to the Pipeline app in the `X-Intake-Secret` header. Make it long and random. Must be the same value as the app's copy of it. | The Pipeline app (production only) | `npx wrangler secret put INTAKE_SECRET` | Not used: a preview never posts to the app |
| `GITHUB_APP_PRIVATE_KEY` | The private key file (`.pem`) of the site's GitHub App, for the site editor. | Only when `editor.enabled` is true | `npx wrangler secret put GITHUB_APP_PRIVATE_KEY < path/to/key.pem` | Never: the editor is off on previews |

`INTAKE_SECRET` is also set on the Pipeline app copy, with the same value. The Worker never sends it to a browser.

## Bindings (not secrets)

A binding is a resource that Cloudflare attaches to the Worker by name. Nothing is typed in for a binding, so it is not a secret.
The owner's uploads (docs/EDITING.md, "Uploads") add no secret. They add these two bindings, and `npm run sync:config` writes
both into `wrangler.jsonc` only when `editor.enabled` and `editor.uploads.enabled` are both `true`.

| Name | What it is | Needed by | Set by |
| --- | --- | --- | --- |
| `UPLOADS` | The site's private R2 bucket for the owner's upload inbox, named `<workerName>-uploads`. Not public, no custom domain. | `editor.uploads.enabled` | `npx wrangler r2 bucket create <workerName>-uploads`, then `npm run sync:config` (docs/EDITING.md, steps h and k) |
| `IMAGES` | The Cloudflare Images binding. The Worker uses it to turn uploaded photos into WebP. It has no key. | `editor.uploads.enabled` | `npm run sync:config`. Images must be available on the account. |

Run each command from the repo folder. It asks for the value with hidden input, so the value never appears on screen or in your
shell history.

- **Previews do not share production secrets.** Set the same names for previews with the `preview base-config` commands, with the
  same values. A preview copies the base secrets **when it is created**, so set them before pushing a branch; later changes do not
  reach existing previews.
- To fix one existing preview, also set the secret on it: `npx wrangler preview secret put <NAME> --name <branch-name>` (this
  creates a new deployment of that preview).
- List names only, never values: `npx wrangler secret list` (production), `npx wrangler preview base-config secret list` (new
  previews), `npx wrangler preview secret list --name <branch-name>` (one preview).
- Each `secret put` creates a new production version (a row in Deployments). If it fails with "latest version of your Worker isn't
  currently deployed", use the dashboard instead: Workers & Pages, your Worker, Settings, Variables and Secrets.
- Previews write to the Sheet's `Preview` and `Forms preview` tabs and email only the site's own address, so preview secrets can be
  the same as production ones. A preview never posts to the Pipeline app.

## The Sheet's tabs

The Sheet is shared as Editor with the service account only. Forms add no new secret. Before the first other form can save to
the Sheet, add the two tabs `Forms` and `Forms preview` (the names are `contact.sheetTabs.forms` and `formsPreview` in
`site.config.ts`) with this header row in row 1 of each:

`Received (UTC) | Form | Name | Email | Answers | Mode`

The contact form's tabs `Submissions` and `Preview` are unchanged. Until the Pipeline app is connected (`INTAKE_SECRET` set), the
Sheet is the only place a form's answers are saved besides the email, so add the tabs before turning a form on.

## Public settings (not secrets)

| Name | What it is | Where |
| --- | --- | --- |
| `contact.turnstileSiteKey` | The Turnstile widget's **site key**. It ships in the page, so it is public by design. The matching secret key is the Worker secret above. | `site.config.ts` |
| `NEXT_PUBLIC_SITE_URL` | The site's public address, used for canonical URLs, Open Graph, the sitemap and JSON-LD. A build variable, not a secret. | `.env.example` shows the name; set it in the Cloudflare build settings. Falls back to `domain.url` in `site.config.ts`. |
| `contact.rateLimitIds` | `{ production, preview }`, two whole numbers written as strings, unique per site in its Cloudflare account. Register them in `docs/HOSTING.md`. The other forms count on the same pair. | `site.config.ts`, then `npm run sync:config` |
| `contact.pipelineUrl` | The Pipeline app copy's `https` address (no path). Both the contact form and the other forms post to `<pipelineUrl>/intake`. | `site.config.ts` |
| `forms` | The caps for the forms an owner adds: `maxForms`, `maxFields`, `maxAnswerChars`, `maxBodyBytes`. | `site.config.ts` (owner-only: a chat change can never raise them) |

The site editor's other settings are not secrets. The App ID, the installation id, the Access team name and AUD tag, the KV namespace ids, the rate-limit id and the upload bucket name (`editor.uploads.bucket`) live in the `editor` block of `site.config.ts`. Setup is in [docs/EDITING.md](EDITING.md).

`NEXT_PUBLIC_*` variables are readable by anyone who visits the site. Never put a secret in one.

## Local testing values (published by Cloudflare, not secrets)

Cloudflare publishes Turnstile test keys. They are safe to use locally and to write in docs:

| Value | Meaning |
| --- | --- |
| Site key `1x00000000000000000000AA` | Always passes. The form uses it on localhost. |
| Secret key `1x0000000000000000000000000000000AA` | Always passes. Use as `TURNSTILE_SECRET_KEY` for `wrangler dev`. |
| Secret key `2x0000000000000000000000000000000AA` | Always fails. Use it to see the "couldn't verify" error. |

The README's "Local test of the Worker" section has the full `wrangler dev` command. In development mode the Worker sends no email
and writes no row, so the other secrets can be dummy values such as `x`.

## Never commit

- `.dev.vars` and `.dev.vars.*` (wrangler's local secrets file) and every `.env*` file except `.env.example`. They are git-ignored.
  If a command would stage one, stop.
- Service-account key files (`*.json` downloaded from Google Cloud), API keys, or the Pipeline app's shared secret.
- The GitHub App private key file (`*.pem`) downloaded from GitHub. Delete it once `GITHUB_APP_PRIVATE_KEY` is set.
- Real values in any doc, test, comment or pull request. Tests use obviously fake values and a mocked `fetch`.
- Anything sensitive in a `NEXT_PUBLIC_*` variable.
