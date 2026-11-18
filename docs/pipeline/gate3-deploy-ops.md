# Gate 3: deploy and operations, on Cloudflare

Gate 3 is everything that happens after the owner merges: Cloudflare Workers Builds deploys `main`,
other branches get preview URLs, UptimeRobot watches the live site, and the rollback runbook is the
emergency brake. The repo holds `wrangler.jsonc` and `public/_headers`; the rest lives in the
Cloudflare and UptimeRobot dashboards, which this handbook cannot read. Dashboard facts below are
taken from the README (the owner read them on 2026-11-12) and from PR 53's post-merge steps, and are
marked **UNVERIFIED (dashboard)** because no file or command confirms them.

Back to the [map](./README.md). Previous gate: [gate2-ci.md](./gate2-ci.md). The contact Worker
that rides along with every deploy is in [contact-form.md](./contact-form.md).

## The files

```
wrangler.jsonc               the Worker: static assets from out/, worker/contact.ts on /api/*, secret names, rate limit, previews
public/_headers              Cloudflare response headers for static files (CSP, HSTS, noindex on preview hosts); copied into out/
.github/dependabot.yml       weekly grouped dependency updates with a 7-day cooldown
README.md                    "Deploy to Cloudflare Workers", "Monitoring", "Rollback runbook", "Launch checklist"
```

## How a deploy happens

From `AGENTS.md` and the README: merging a pull request into `main` deploys the site automatically
through Cloudflare Workers Builds. Other branches get preview URLs (Cloudflare Worker Previews,
configured by the `previews` block in `wrangler.jsonc`). **Never run `wrangler deploy` by hand**:
the `guard-bash` hook blocks `wrangler deploy`, `wrangler publish` and `wrangler versions upload`,
directly or through an npm script. `output: "export"` in `next.config.ts` means there is no Node
server at runtime; the only server code is the contact Worker on `/api/*`, which wrangler bundles at
deploy time.

### Workers Builds settings (UNVERIFIED (dashboard); README, read by the owner 2026-11-12)

| Setting | Value |
|---|---|
| Worker name | `huston-site` |
| Production branch | `main` |
| Build command | `npm run build` (to become `npm run build:launch` at launch, so a build with unresolved placeholders cannot go live) |
| Deploy command | `npx wrangler deploy` (run by Workers Builds, never by hand) |
| Root directory | `/` |
| Build variables | `NODE_VERSION=22` is the only one set. `NEXT_PUBLIC_SITE_URL` is **not set**, so the site origin is the default in `src/content/site.ts`; PR 53 says to make sure it is not set to anything else. |

The build image's npm was 10.9.2 when PR 34 was written, which is the lower bound of
`engines.npm` (`>=10.9.2 <11`).

What `npm run build:launch` adds (`package.json`): `npm run check:placeholders && next build`.
`scripts/check-placeholders.mjs` fails while any `[[placeholder]]` remains in `src/content/` or
`src/app/`, while any of `email`, `schedulerUrl`, `linkedInUrl`, `turnstileSiteKey` in
`src/content/providers.ts` is `null`, or while `decisionsConfirmed.lineArtStyle` in
`src/content/site.ts` is `false`.

### The merge-commit check

Each merge to `main` also shows a "Workers Builds: huston-site" check on the merge commit. A failed
production build leaves the previous version live and sends **no email**; that red check is the
only signal (README "Monitoring"). Cloudflare's documented route for an alert is a Queue plus a
small Worker posting to a Slack or Discord webhook; it has not been built.

## `wrangler.jsonc` (verbatim)

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "huston-site",
  // The contact form Worker. It runs only for /api/* (run_worker_first); every page and file is served from ./out.
  "main": "./worker/contact.ts",
  "compatibility_date": "2026-11-11",
  "assets": {
    "directory": "./out",
    "not_found_handling": "404-page",
    "run_worker_first": ["/api/*"]
  },
  "vars": { "SITE_ENV": "production" },
  // Names only. Values are set with `wrangler secret put` (README, "Contact form").
  "secrets": {
    "required": ["RESEND_API_KEY", "TURNSTILE_SECRET_KEY", "GOOGLE_SERVICE_ACCOUNT_KEY", "GOOGLE_SHEET_ID"]
  },
  "ratelimits": [{ "name": "CONTACT_RATE_LIMIT", "namespace_id": "1001", "simple": { "limit": 5, "period": 60 } }],
  // Invocation logs would store request metadata; the Worker's own log lines hold no personal data.
  "observability": { "enabled": true, "logs": { "invocation_logs": false } },
  // Worker Previews (branch previews) do not inherit the settings above, so they are repeated here.
  // Preview secrets are separate: `wrangler preview base-config secret put`.
  "previews": {
    "vars": { "SITE_ENV": "preview" },
    "ratelimits": [{ "name": "CONTACT_RATE_LIMIT", "namespace_id": "1002", "simple": { "limit": 5, "period": 60 } }]
  }
}
```

Line by line:

- **`assets.directory: "./out"`** is the Next.js static export. **`not_found_handling: "404-page"`**
  serves `out/404.html` with a 404 status (PR 5).
- **`run_worker_first: ["/api/*"]`** is the only reason the Worker ever runs. Every other path is
  served straight from the assets, so the site is still a static site with one API route.
- **`secrets.required`** lists names only; a deploy fails while one is missing. Values are set with
  `wrangler secret put` (commands in [contact-form.md](./contact-form.md#secrets-by-name)).
- **`ratelimits`** binds Cloudflare's rate-limiting API as `CONTACT_RATE_LIMIT`: 5 requests per 60
  seconds per key (the Worker keys on the visitor's IP). Previews get their own namespace id so
  preview traffic does not share a bucket with production.
- **`observability`**: Workers Logs on, invocation logs off, because invocation logs would store
  request metadata and the Worker's own log lines hold no personal data.
- **`previews`**: Worker Previews do not inherit the top-level `vars` or bindings, so what a preview
  needs is repeated here with `SITE_ENV: "preview"`. The block was first added empty in PR 7 because
  Cloudflare's preview build failed with "Your Wrangler configuration is missing a `previews` block
  to run this command"; Cloudflare's docs say the block is required but may be empty.
- After changing this file, regenerate the Worker's types:
  `npx wrangler types worker/worker-configuration.d.ts` (`AGENTS.md`).
- `wrangler.jsonc` is one of the five "ask" files: every edit shows an approval prompt.

The installed wrangler is 4.160.1 (exact-pinned devDependency). `wrangler preview` and its
`secret` and `base-config` subcommands exist in it and are labelled "open beta".

## Previews

- Workers Builds deploys every non-`main` branch (including Dependabot's) to a Worker Preview and
  comments on the PR with the URL. The comment on PR 16 shows the shape: a branch-level URL
  `<branch-slug>-huston-site.<account>.workers.dev` that always points at the latest preview
  deployment, and a per-deployment URL `<deployment-id>-huston-site.<account>.workers.dev`.
- **Preview secrets are separate from production** and are copied from the Preview base config
  **when the preview is created**. Set the four secrets on the base config before pushing a branch;
  an existing preview is fixed with `wrangler preview secret put <NAME> --name <branch>`, which
  creates a new deployment of that preview. Full commands in
  [contact-form.md](./contact-form.md#secrets-by-name).
- The Worker treats any `*.workers.dev` host other than `huston-site.<account>.workers.dev` as a
  preview even if `SITE_ENV` says production (`worker/env.ts`, `resolveMode`), so a misconfigured
  preview can never email a visitor or write to the `Submissions` tab.
- `public/_headers` adds `X-Robots-Tag: noindex` to `https://:version.:subdomain.workers.dev/*`
  (and the older `*.pages.dev` pattern) so preview hosts stay out of search results. Cloudflare also
  adds `noindex` to preview URLs itself (PR 7). Whether the `_headers` host pattern actually matches a
  real preview URL was never confirmed (PR 7: "I haven't confirmed that against a real preview
  URL"). **UNVERIFIED**.
- Preview URLs are public by default; Cloudflare Access could restrict them. Not done.
- The Turnstile widget must list the account's `<account>.workers.dev` hostname for the form to work
  on a preview; error 110200 on a preview means it is not covered (README).

## `public/_headers` (verbatim)

```
# Cloudflare response headers (Pages and Workers static assets).
# https://developers.cloudflare.com/pages/configuration/headers/
# https://developers.cloudflare.com/workers/static-assets/headers/
# Next.js static export emits inline bootstrap scripts, so script-src needs 'unsafe-inline'.
# Tighten (hashes or nonces) if the hosting setup ever allows it. Update frame-src/script-src/connect-src
# when a scheduler or form provider is added.
# https://challenges.cloudflare.com (script-src, frame-src): Cloudflare Turnstile on the contact form.
# The form posts to the same-origin Worker (/api/contact), so connect-src and form-action stay 'self'.
# These headers apply to static files only; the Worker sets its own headers on /api/* responses.

/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

# Keep Cloudflare preview/production *.pages.dev URLs out of search results.
https://:project.pages.dev/*
  X-Robots-Tag: noindex

# Same for *.workers.dev worker and preview URLs.
https://:version.:subdomain.workers.dev/*
  X-Robots-Tag: noindex
```

Workers static assets honours `_headers` (100 rules max) and `_redirects` (none here) from the
assets directory root; neither applies to responses the Worker generates, which is why
`worker/contact.ts` sets its own security headers on `/api/*` (PR 5, README).

## Custom domains and the www redirect

These are the owner's post-merge steps from PR 53, written for the launch. None is a file in the
repo. Step 4 below is as practised on this domain (owner-confirmed 2026-11-15); the rest is the PR 53
plan and is **UNVERIFIED (dashboard)**.

1. **Build command.** Workers & Pages, `huston-site`, Settings, Builds, Build configuration, Edit:
   change `npm run build` to `npm run build:launch`. Save, then Retry deployment (or push any
   commit). The build fails if any placeholder is left.
2. **Custom domains.** Workers & Pages, `huston-site`, Settings, Domains & Routes, Add, Custom
   domain. Add the apex, then `www.`. The domain must be a zone in the same Cloudflare account;
   Cloudflare creates the DNS records and certificates.
3. **Turnstile hostnames.** Turnstile, the contact widget, Settings, Hostnames: add the apex and
   `www.` (keep the existing ones for previews). Without this the live form returns "That didn't go
   through".
4. **www to apex redirect.** A Worker custom domain cannot redirect, so it is a zone rule. As
   practised (owner-confirmed 2026-11-15):
   1. Select the zone, Rules, Redirect Rules, Create rule, and pick the template **"Redirect from
      WWW to root"**. It is a 301 from `www.<domain>` to the apex, keeping the path (the template
      fills in the equivalent of `concat("https://<domain>", http.request.uri.path)`, preserve query
      string). Deploy.
   2. **Add a proxied `AAAA` record: name `www`, content `100::`** (orange cloud on). `100::` is a
      dummy address that is never contacted. It is needed because no `www` record existed; without
      any `www` DNS record the name does not resolve, the request never reaches Cloudflare, and the
      redirect rule never runs. The proxy (orange cloud) is what lets the rule answer.
5. **UptimeRobot.** Edit the existing monitor's URL from the `workers.dev` address to the apex.
6. **Smoke test.** Open the apex and the www address (should land on the apex), send a real test
   note through the form, confirm the Sheet row, the email to the owner and the automatic reply.

PR 53 also recorded why no code change was needed: the Worker has no hard-coded hostname allowlist
(the origin check uses the request's own origin and Turnstile is checked against the request
hostname), nothing noindexes the real domain (`robots.txt` allows all; only `/contact/thanks` and the
404 carry a page-level noindex), and production mode applies to every host except `*.workers.dev`
hosts other than `huston-site.*`.

## Rollback runbook (README, practised 2026-11-13)

A rollback points the live site at an older version within about a minute. It changes nothing in
Git: `main` still contains the bad commit, and the next merge to `main` redeploys `main`'s HEAD over
the rollback. Use it when a deploy broke the live site and it must be fixed now.

**Roll back.** Cloudflare dashboard, Workers & Pages, `huston-site`, Deployments. Pick an older row
that was a real production deployment (match its time to the merge time of the PR; never a preview).
Three-dot menu, **Rollback**. Read the dialog, add a message, confirm. The Active deployment card
switches to the older version (the move is recorded under View rollout history; the Deployments list
itself does not gain a row).

**Roll forward.** On the newer row you rolled back from, the same menu item is labelled **Promote
version**. Read the dialog and confirm.

**Check the live site after each move** with `curl -sI https://<site>/`: HTTP 200; the `etag`
changes after a rollback and returns to its old value after rolling forward; the
`/_next/static/chunks/...` files named in the page's HTML change and then return too. Practised on
2026-11-13 (rolled back from the PR 35 deploy to the PR 25 deploy, then forward): both checks moved
and returned exactly.

**The contact Worker and rollbacks.** A version holds its code, config and static files together, so
a rollback moves the form and its Worker as one. Rolling back to a version from before the Worker
gives the old form that sends nothing, which is consistent. `curl -s -X GET https://<site>/api/contact`
returns `{"error":"method_not_allowed"}` (405) while the Worker is live. Cloudflare's rollback docs
don't say whether secret values roll back with a version, so never delete or rename a secret while
older versions may still be needed. Each `wrangler secret put` adds a version to the Deployments
list; keep picking rows by merge time.

**Do not click:** Delete (the Worker), Disconnect (breaks auto-deploys), Split versions (gradual
deployment), Retry build, or any change to the build command, deploy command or production branch.

**Bad merge: recovery sequence**

1. Freeze: merge nothing else.
2. Roll back to the last good production version and check the live site.
3. Revert the bad merge on a new branch (`git revert -m 1 <merge-sha>`) and open a PR. Every lock
   applies (`check`, `a11y`, `lighthouse`, `dependency-review`, code scanning), so allow about 6
   minutes; the rollback holds meanwhile.
4. The owner merges the revert. Workers Builds then deploys `main`'s HEAD (the revert), which
   replaces the rollback.
5. In Deployments, confirm a new Workers Builds deployment is Active and the live site is good. Then
   fix forward in a new PR.

If a production build itself fails, nothing is deployed and the old version stays live, so no
rollback is needed.

## Monitoring: UptimeRobot (README; UNVERIFIED (dashboard))

- An UptimeRobot Free monitor checks the production URL every 5 minutes and emails the owner when it
  gets an error response (anything other than 2xx or 3xx), a timeout or no answer. It only sees the
  public HTTP response; no token or secret is involved.
- Tested on 2026-11-13: a temporary monitor pointed at a page that does not exist (a 404) went Down
  and sent the alert email, then was deleted. The production monitor was never broken on purpose.
- When the custom domain goes live: edit the monitor's URL (three-dot menu, Edit) to the apex, then
  re-run the test (temporary monitor on a 404 page, wait for the Down email, delete it).
- Failed deploys have no alert (see "The merge-commit check" above).

## Dependabot (`.github/dependabot.yml`, verbatim)

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    cooldown:
      default-days: 7
    groups:
      actions:
        patterns: ["*"]

  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    cooldown:
      default-days: 7
    groups:
      npm:
        patterns: ["*"]
        update-types: ["minor", "patch"]
    # Major bumps are not grouped. These are ignored for now (Dependabot version
    # updates only; security updates still come through):
    # - typescript, eslint, typescript-eslint: `npm run check` rejects TypeScript 7
    #   ("typescript-eslint does not support TS 7.0", seen on PR #16).
    # - @types/node: types should match Node 22 (CI and Cloudflare build).
    # Revisit when typescript-eslint supports TypeScript 7.
    ignore:
      - dependency-name: "typescript"
        update-types: ["version-update:semver-major"]
      - dependency-name: "eslint"
        update-types: ["version-update:semver-major"]
      - dependency-name: "@types/node"
        update-types: ["version-update:semver-major"]
      - dependency-name: "typescript-eslint"
        update-types: ["version-update:semver-major"]
      - dependency-name: "@typescript-eslint/*"
        update-types: ["version-update:semver-major"]
```

- **7-day cooldown** (PR 15): Dependabot waits 7 days after a release before proposing it, matching
  the repo rule that tooling must be at least 7 days old when added. Applies to version updates only;
  security updates are not delayed.
- **Minor and patch only in the npm group** (PR 18): Dependabot PR 16 bundled TypeScript 7.0 and a
  new ESLint major into one group and `check` failed with "typescript-eslint does not support
  TS 7.0". PR 16 was closed; after PR 18 merged, Dependabot opened PR 19 with the four minor/patch
  updates, which merged. The `ignore` list is version updates only; security updates still open PRs.
- Dependabot PRs get a preview deployment like any other branch, and `dependency-review` runs on
  them.
- Dependabot's npm version is "untested" against `engine-strict` (PR 34). **UNVERIFIED** whether a
  Dependabot-written lockfile passes CI's `npm ci`; PR 19 merged after PR 34, so at least one did.

## Launch checklist (README, current state)

The README's launch checklist is the owner's list for going live; the pipeline parts of it are: set
`NEXT_PUBLIC_SITE_URL` to the final domain; set `email`, `schedulerUrl`, `linkedInUrl`,
`turnstileSiteKey` in `src/content/providers.ts` (done in PR 53); `npm run check:placeholders` passes
(done in PR 53); contact form tested end to end on the live domain with SPF, DKIM and DMARC all PASS
in Gmail's "Show original"; scheduler wired (a link, so no CSP origin was needed); submit
`sitemap.xml` to Google Search Console.
