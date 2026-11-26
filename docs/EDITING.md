# The site editor

For Huston Logic and for the site owner. The first half says what the editor does. The second half is the setup for one site, and the message for adding it to a client site that already exists.

## What it is

- The site owner changes their own pages by chatting with their own AI app, such as Claude. They sign in once, connect the AI app to the site, and ask for changes in plain words.
- Nothing runs an AI on Huston Logic's side. The owner's AI app does the talking. The site's own Worker does the checking and the writing. A Worker is the small program on Cloudflare that also runs the contact form.
- The AI app talks to the Worker through MCP. MCP is a standard way for an AI app to use tools that live somewhere else. Here the tools read the site and propose changes.
- Each change is written to the site's repository on GitHub as a pull request. The repository is the folder of code and pages for the site. A pull request is a proposed change that joins the site only after its checks pass.
- The editor is off by default. It is turned on for one site with `editor.enabled` in `site.config.ts`, after the setup below.
- The editor works only on the live domain. Previews and local runs do not offer it, so no preview can hold the key that writes to GitHub.
- The owner can upload photos and PDFs on the owner page, then ask their AI app to use them. See Uploads below.

## How a change goes live

1. **Ask.** The owner asks in plain words, for example "Change Friday hours to 9 to 3."
2. **Read the list.** The AI proposes the change. Nothing changes yet. The change list is built by code. It shows the old and new words, block by block, and the AI must show it exactly as it comes back.
3. **Say yes.** The AI publishes only after the owner says yes to that list.
4. **Preview (optional).** The AI can push the change to a preview copy of the site. The preview link is reported as ready only when the preview shows the change.
5. **Publish.** The Worker creates a branch named `change/owner-<id>` and opens a pull request titled "change: <summary>". It turns on auto-merge with squash, which merges the change as one commit once the checks pass. If GitHub says the pull request can merge at once, the Worker merges it directly.
6. **Checks.** The same required checks as any change run: `check`, `a11y`, `lighthouse` and `dependency-review`. CodeQL also runs. The change-scope check and the change report run too, but do not block yet (see Known limits).
7. **Merge and deploy.** Merging into `main` deploys the site through Cloudflare Workers Builds.
8. **Live.** Each build writes its commit to `/site-version.json`, along with `drafts`: `true` when the build includes draft items (any build that is not the production build), `false` for production. When that file names the merge commit or a later one, the change is live.

To check, the owner asks "is it live yet?" The AI asks the Worker, which answers with one of these words:

- `checking`: the pull request is open and the checks are still running.
- `stuck`: a check failed. The owner page and the answer say which one.
- `going live`: merged, but the deploy has not reached the site yet. After 30 minutes the answer adds that this is taking longer than usual and that Huston Logic can see it.
- `live`: the site shows the change.
- `stopped`: the pull request was closed without merging.

The first time a change is seen live, the Worker stores the time. Later answers say "live N minutes after your yes".

## Collections, business details, brand and the notice

Besides page text, the owner can ask for these by chat. Each one goes through the same steps as a page change: the list, the yes, the optional preview, then publish. Limits are the ones the site checks.

- **Blog posts.** A post has a title (up to 90 characters), a summary (up to 170), a date, an optional updated date, an optional photo (3:2 shape) and a body. The body is paragraphs, headings, bullet or numbered lists, quotes and photos. A post has no tables and no embedded videos. A new post is saved as a draft unless the owner says to publish. Posts can be published, archived and restored. The address of a post is its slug (lowercase words joined by hyphens, 1 to 60 characters). A slug cannot change later. Each post is at `/blog/<slug>`, listed newest first on `/blog` (10 to a page), and in the feed at `/blog/feed.xml`.
- **Post lists on a page.** The latest posts block shows the newest few, as cards or as a list. The post index block belongs on the blog page only.
- **Videos.** A title (up to 90 characters), a YouTube or Vimeo address, an optional caption (up to 200) and a date. The video list block shows the newest. A video plays only after a visitor presses play.
- **Podcast episodes.** A title, a Spotify or Apple Podcasts episode address, an optional summary (up to 300) and a date. The episode list block shows the newest. An episode plays only after a visitor presses play. The compact look has a link instead of a player.
- **Testimonials.** A quote (up to 600 characters), the name of the person who said it (required), an optional role and business, and an order number. The AI app writes a testimonial only from a quote and a named source that you give in the chat. It never invents one.
- **Team members.** A name, a role, an optional bio (up to 400 characters), an optional photo (4:5 shape) and an order number. The AI app needs a name and a role from you.
- **Business details.** A name, a phone number, an email address, an address (up to four lines), opening hours for each day (or closed), an optional hours note and social links. Social links can be Instagram, Facebook, LinkedIn, YouTube, TikTok, X, Pinterest or Threads, up to eight in all. The header and footer show them. Hours read as, for example, "Monday to Thursday, 9 am to 5 pm", on a 12-hour clock. A placeholder phone number or email gets no link.
- **Brand colors.** The owner can change two colors: the brand color (green in the template) and the accent color (rust in the template). The other companion colors are worked out from the brand color. The background and text colors stay as the design has them. See the brand guardrails below.
- **Fonts.** The owner can choose a display font (headings), a body font and an accent font (italic only) from the list the site offers. Display: Outfit, Manrope, Sora, DM Sans, Plus Jakarta Sans, Fraunces. Body: Inter, Source Sans 3, Work Sans, Nunito Sans, Figtree, Lora. Accent: Newsreader, Fraunces, Lora, Playfair Display.
- **Logo.** An image the owner uploads (JPEG, PNG, WebP or iPhone HEIC) can replace the business name in the header. It must be at least 160 pixels wide and 80 pixels tall, with a shape between 1:1 and 6:1. It shows 40 pixels tall in the header and 36 in the footer. An SVG logo is a build by Huston Logic (see Lane 3 in [EDITING-LANES.md](EDITING-LANES.md)).
- **The site notice.** One short line (up to 120 characters) above the header on every page, with an optional link and an optional last day. The last day is included. The change list judges it in the site's time zone (`business.timeZone` in `site.config.ts`), and the change list says "Shows through <date>; it comes down at the first publish after that date." "Take it down" empties the notice. A notice has no close button.

### Brand guardrails

- The site checks 20 pairs of text or control colors and the backgrounds they sit on. Text needs a contrast of at least 4.5 to 1. Large text, icons, focus rings and control edges need at least 3 to 1. Every pair must pass after a brand change.
- If a color would make text hard to read, the change is refused. The refusal names the pair that fails, its ratio, and the nearest shade that passes. The AI app offers that shade.
- Fonts come only from the list above. Any other font is a build by Huston Logic.
- A brand change (colors, fonts or logo) cannot be published until a preview has been made of that exact proposal. The AI app gives the preview link first, then asks for the yes.
- Spacing, shape and motion are not settings. Huston Logic sets them.

## Uploads

Photos and PDFs can be sent to the site from the owner page. Uploads need the one-time setup in "Set up uploads on one site" below. They stay off until that setup is done.

**What the owner does.** Open `https://[[Site domain]]/owner` on a phone. In "Your uploads", choose one or more photos or PDFs. Each file shows its progress, and each finished photo appears as a thumbnail. Rename a file with Rename. Remove a file with Remove, and the page asks first.

**What happens to a photo.** Any normal phone photo works, including iPhone HEIC. JPEG, PNG and WebP work too. The site keeps a web-ready WebP file: at most 1600 pixels on the long side and at most 450 KB. Camera and location data are removed. The original is never kept. The owner never has to resize or convert a photo.

**What happens to a PDF.** Visitors download a PDF; it never opens inside the site. A PDF that holds a script, a form action or an attached file is refused, and the message says how to save it again as a plain PDF. Document properties, such as the author, are kept.

**The private inbox.** An upload is not public. It is not in the site's repository until a proposal that uses it is previewed or published. A preview link can show it to anyone who has that link.

**Expiry.** An upload that is not used is removed after 30 days. The list shows "Removed in N days". A file that is already on the site shows "On your site".

**How the AI uses an upload.** Ask in plain words, for example "use the three photos I just uploaded". The AI app lists the uploads, looks at each photo, and then proposes a change that uses them. Every photo needs a description of what it shows. The description is shown in the change list. If the AI cannot write a good description, it asks you. The change list also says when a photo will be trimmed to fit its section. If the top or the bottom matters, say so, and the AI sets where the photo focuses.

**Refusals.** Each refusal says what to do, in plain words.

| What you upload | What happens |
| --- | --- |
| A video | Refused. Put the video on YouTube or Vimeo, then ask for it by its link. |
| A GIF | Refused. For a still photo, upload it as a JPEG. For a video, use YouTube or Vimeo. |
| A file that can carry code (SVG, HTML or other text) | Refused. Upload a photo or a PDF instead. |
| Any other type (for example AVIF) | Refused. Only JPEG, PNG, WebP, iPhone HEIC and PDF are accepted. |
| Too big | Refused. The limit is 20 MB for a photo and 10 MB for a PDF. |
| The inbox is full | Refused. The inbox holds 200 MB. Remove files you no longer need. |
| The daily limit is reached | Refused. The default is 50 files a day. Try again tomorrow. |
| Damaged | Refused. Export or save the file again. |
| The monthly photo allowance is used up | Photos are refused until the allowance is available again. PDFs still work. Huston Logic is told. |

## Forms

A form collects details from visitors, such as a quote request, a booking request or a newsletter sign-up. The owner asks for a form by chat. A form goes through the same steps as any change: the list, the yes, the optional preview, then publish.

### What works now

- **Add a form.** Ask in plain words. The AI app proposes the form. The change list shows every field, the button text and the thank-you message. Say yes only to the full list.
- **Place a form on a page.** A page can hold one form. The form shows where its block sits on the page.
- **Change a field.** Change a field's label, its help text, a dropdown's options or its error message.
- **Make a field optional or required.**
- **Add a consent box.** A box that asks if the visitor agrees to be contacted or to terms. It is never ticked when the form opens.
- **Change the thank-you.** The thank-you message replaces the form on the page. A form has no thanks page of its own.
- **Archive and restore.** Archiving takes the form off every page in the same change, and the change list says which pages changed. Nothing is deleted. The form's file is kept, so it can be restored.
- **Offer a file to download.** Upload a PDF on the owner page, then ask for a form that emails the file to the visitor after they submit it. Read "How strong a download gate is" first.

### Sayings the editor is tested with

These are the owner's own words. Each one has a test. The last one is refused.

- "Add a quote request form to the Services page with name, email, phone, project type as a dropdown, and a message."
- "Make phone optional."
- "Add a checkbox asking if we can email them updates."
- "Add a form on the home page: fill it out to get the Buyer's Checklist PDF I just uploaded."
- "Change the thank-you message on the quote form."
- "Remove the newsletter form." The form is archived, not deleted. Its place on each page is removed in the same change.
- "Add a field for their credit card number." Refused. The AI app says why: a website form is not a safe place for card numbers. The answers sit in email and in a spreadsheet as plain text. Payments need a payment provider, and Huston Logic builds that (see Lane 3 in [EDITING-LANES.md](EDITING-LANES.md)).

### Field types

Every form uses one of these seven types. There is no other type.

| Type | What the visitor gives | Limits |
| --- | --- | --- |
| Short text | One line. It can be marked as the visitor's name, organization or website, so the browser can fill it in. | Up to 300 characters (200 by default) |
| Long text | Several lines | Up to 5,000 characters (2,000 by default) |
| Email | An email address. Every form has exactly one, and it is always required. | 254 characters |
| Phone | A phone number of 7 to 20 digits. Digits, spaces and `+ ( ) - .` only. | 30 characters |
| Dropdown | One choice from 2 to 20 options. It shows as a menu, or as buttons. | Each option up to 80 characters |
| Checkbox | Yes or no. If it is required, it must be ticked. | Label up to 300 characters |
| Consent | Yes or no, to agree to be contacted or to terms. It is never ticked when the form opens. | Label up to 300 characters |

A form has up to 12 fields. A site has up to 10 live forms. These are the template's defaults and are set in `site.config.ts`, which the owner cannot change by chat. No field can carry a starting value.

### Personal data rules

- **Refused.** Card numbers and security codes, bank account details, government ID numbers (such as a social security number, a passport number, a driver's licence number or a tax ID), and passwords and PINs. The AI app will not add these fields.
- **Warned.** Health words, such as health, medical, diagnosis, medication, allergy and disability. The change list shows a warning. The site is not set up for health details, so the AI app suggests asking for them on a call. The AI app proposes such a field only if the owner insists after the warning.
- **Consent is never ticked.** No consent box or checkbox starts ticked.
- **New kinds of personal data.** When a form collects something no live form collected before, such as postal addresses, the change list ends with a note that the privacy page should say so. The AI app offers a privacy page edit in the same change. You decide whether to accept it.

### Where the answers go

- **The same place as the contact form.** The answers are saved to the Pipeline app or to the Google Sheet, whichever the site uses (`contact.destination`). The owner sets nothing up for a new form.
- **The Sheet.** Other forms use two more tabs, `Forms` and `Forms preview`. Every form uses one header row: `Received (UTC) | Form | Name | Email | Answers | Mode`. The answers sit in one cell, one line for each field, with checkboxes shown as Yes or No. A very long answers cell is cut, and the email has every answer.
- **The Pipeline app.** The message starts with the form's name, then the answers.
- **The notification email.** The owner gets an email with every answer, as the contact form does.
- **The visitor.** The visitor sees the thank-you message only when the answers reached the owner. A form that cannot save shows an error and keeps what the visitor typed.

### How strong a download gate is

A download form asks for an email address before it sends a link. It is not a lock.

- The link goes to the visitor's email only after the answers reached the owner. The browser never gets the link.
- Anyone who has the link can download the file, at any time, forever. They can pass it on.
- The file sits at a public address on the site. It is not linked from any page, but it is not hidden.
- Never put anything private or paid-for in a download form. If the file must stay private or be sold, ask Huston Logic. That is a larger build with signed, expiring links.

### The contact form stays Huston Logic's

The contact form is set up by Huston Logic, and the owner cannot change it by chat. Its fields feed fixed Sheet columns and the Pipeline message. Ask Huston Logic to change it. Destinations, recipients and secrets are never chat changes.

When a form is added, the editor also rewrites one generated file, `src/forms/registry.generated.ts`, in the same change. The Worker reads its list of forms from that file, so a submission is judged against the form the site was built from.

## What is protected

- **Owners only.** Only the emails in `editor.ownerEmails` in `site.config.ts` can sign in or connect an AI app. Cloudflare Access (a sign-in gate that emails a one-time code) and the Worker both check this on every visit to `/owner`.
- **Limited access to GitHub.** The site has its own GitHub App. A GitHub App is a small identity on GitHub with only the permissions it is given. This one is installed on the site's repository only. It can read and write contents, pull requests and issues. It cannot change workflows, settings, Actions or secrets. It is not a bypass actor in the "Protect main" ruleset, so the rules apply to it.
- **Short-lived tokens.** The Worker holds the App's private key as a secret. Each time it needs GitHub, it asks for a token that lasts one hour and works on that one repository only.
- **Page files, item files, settings and the owner's uploads.** The editor changes only the files in `src/content/pages/`, the item files under `src/content/collections/` (one file per post, video, episode, testimonial or team member), the three settings files `src/content/business.json`, `src/content/brand.json` and `src/content/notice.json`, the form files in `src/content/forms/` (one per form, never the contact form's file), and adds the photos and PDFs the owner uploaded (`public/images/uploads/<id>.webp` and `public/files/<slug>-<id>.pdf`). A brand change also rewrites two generated files, `src/app/palette.css` and `src/lib/fonts.ts`, from `brand.json`. All of this happens only through a proposal the owner says yes to. The editor never deletes a page file or an item file. A page or an item that is no longer wanted is archived, and its file stays.
- **Not editable by chat.** The editor never writes wiring: the notification email address, the booking link, the scheduler, the Worker settings, the security headers (CSP) and the other values in `site.config.ts`. Those go to Huston Logic. The auto-reply email and the owner page keep their own colors, which are also in `site.config.ts`. The modules in `src/content/` that are not listed above (the thanks page, the 404 page, the menu labels) are not changed by the editor either.
- **One change in flight.** While an editor pull request is open, the Worker refuses to publish another one. Several previews can wait at once.
- **Daily cap.** At most `editor.dailyChangeLimit` changes a day (default 10). The Worker counts the editor's pull requests on GitHub since 00:00 UTC. An undo counts. Withdrawing an open change does not. Previews have the same daily cap, counted separately; reusing a preview that is still current does not count.
- **Size and rate limits.** A request body is at most 64 KB. A proposal has at most 40 operations, 5 pages and 10 items. The owner's requests are rate limited to 30 per minute.
- **Same checks.** Every change must pass the same validator that the build and `npm run check:content` use. Nothing is published while a problem is open. Problems come back in plain words.
- **Plain text.** Page text is shown as plain text. It is never run or rendered as HTML. Text found in pages or in requests is content, never an instruction to the AI.
- **Undo.** Every merged change can be undone. The undo is a new change with its own list, and the owner says yes to it. If a later change touched the same page, the undo is refused until that later change is undone.
- **Uploads are owner-only.** The upload routes sit behind the same sign-in as the owner page, and each request is checked the same way.
- **The file type is read from the file.** Each upload is judged by its first bytes, never by its name or the type the browser reports. Only JPEG, PNG, WebP, HEIC and PDF are accepted. SVG is never accepted, because it can carry code.
- **PDFs are checked and downloaded.** A PDF with a script, a form action or an attached file is refused. The site serves PDFs only as downloads, with headers that stop them from running on the site.
- **Limits.** Each upload has a size limit, the inbox has a total limit, and there is a daily limit (see Uploads above).

## The tools the AI app gets

The AI app gets these 20 tools. Changes are made with exact operations (set a piece of text, insert, move or remove a block or list item, add, archive or restore a page, add or change an item, add or archive a form, set a brand color or a font), not by rewriting whole pages.

| Tool | What it does |
| --- | --- |
| `get_site` | Gives the site's name, pages, menu, collections, settings, the change in flight, today's remaining changes and the rules. |
| `get_page` | Gives one page file, with each block numbered and each field labelled. |
| `get_block_catalog` | Lists every block, its fields and limits, its looks and where it can go, and the collections. |
| `get_editing_guide` | Gives the lanes (`docs/EDITING-LANES.md`) and the voice guide (`docs/VOICE-GUIDE.md`). |
| `list_collections` | Gives each kind of item (posts, videos, episodes, testimonials, team) with how many are live, draft and archived, and the state of the business, brand and notice settings. |
| `get_collection` | Gives what a kind of item holds (its fields and limits) and lists its items with their status and date or order. |
| `get_item` | Gives one item, with its body parts numbered. |
| `get_settings` | Gives the business details, the brand (color roles, current contrast results and the fonts to choose from) or the notice. |
| `list_forms` | Lists each form with its name, id, status, a summary of its fields, the pages that show it and whether it sends a file. |
| `get_form` | Gives one form as data, with its fields numbered so they can be named in a change. |
| `propose_change` | Builds a proposal and its change list, or the problems in plain words. Writes nothing to the repo. |
| `preview_change` | Pushes the proposal to a preview branch, with no pull request, and gives the preview link. |
| `publish_change` | Opens the change after the owner's yes. Refused if the site has moved, a change is open or the daily cap is reached. |
| `get_change_status` | Says whether a change is checking, stuck, going live, live or stopped, with times. |
| `list_recent_changes` | Lists the last 10 changes and their status. |
| `undo_change` | Makes a new proposal that puts back what an earlier change replaced. |
| `request_feature` | Records a request the library cannot do as a GitHub issue, and gives the owner the lane wording. |
| `list_uploads` | Lists the owner's photos and PDFs, newest first, with id, name, size, dates and whether each is already on the site. |
| `view_upload` | Shows a small preview picture of a photo, or the facts about a PDF. The AI looks at each photo before using it. |
| `remove_upload` | Deletes an upload from the inbox. Only when the owner asks. Refused while a waiting proposal uses it. |

### The operations

`propose_change` takes a list of these. Nothing changes until the owner says yes.

| Operation | What it does |
| --- | --- |
| `set`, `insert_item`, `remove_item` | Change one value, or add or remove one list item. Each takes exactly one target: a `page` (such as `/hours`), an `item` (such as `posts/new-inspection-service`), `settings` (`business`, `brand` or `notice`), or a `form` (such as `quote-request`, with pointers under `/name`, `/fields`, `/button`, `/thanks` and `/download`). |
| `add_item` | Adds a post, video, episode, testimonial or team member. Its status is `draft` or `live`. |
| `set_item_status` | Sets an item to `draft`, `live` or `archived`. Nothing is deleted. |
| `add_form` | Adds a new live form with its fields, button, thank-you and optional file. The contact form cannot be added or changed. |
| `set_form_status` | Sets a form to `live` or `archived`. Archiving also removes the form's block from any page in the same change. Nothing is deleted. |
| `set_brand_color` | Sets the brand color or the accent color, and works out the companion colors from it. It is refused if text would become hard to read. |
| `set_font` | Sets a display, body or accent font from the curated list. |

On the `brand` settings, only `/logo` can be set with `set` (colors and fonts have their own operations). An item's `status` cannot be set with `set`; use `set_item_status`. A proposal touches at most 5 pages and 10 items. The page operations (`insert_block`, `move_block`, `remove_block`, `add_page`, `archive_page` and `restore_page`) are as before.

## The owner page

The owner signs in at `https://[[Site domain]]/owner`. The page is plain HTML. It loads one small script, which shows upload progress. The upload form works without that script too: a single file always works, and several files post in one request. The signed-in email is shown in the header. Below it, the page has five sections, in this order:

- **Waiting for your yes.** Each proposal with its change list, a "Review and publish" button and its preview link. Publish and Discard are on the confirmation page. The confirmation page shows the thumbnails of the proposal's new photos beside the change list.
- **Your uploads.** A form to choose photos or PDFs, with the limits in one line. Below it, a grid of uploads, newest first, each with a thumbnail (PDFs show a document tile), its name, kind and size, the "On your site" tag when it is used, and "Removed in N days". Each upload has Rename and Remove. See Uploads above.
- **Recent changes.** Each change with its status (a labelled tag such as "Live" or "Stuck") and times. A change that is still checking or stuck has a "Withdraw change" button. A change that is going live or live has an "Undo change" button. A stopped change has none.
- **Connect your AI app.** The connector address is `https://[[Site domain]]/mcp`, with the steps for Claude and a general line for other apps.
- **What you can change.** A line that tells the owner to ask their AI app "What can I change on my site?"

Review and publish, Withdraw and Undo all go to a confirmation page that shows the change list before anything happens.

## Speed

These are measured on real runs of GitHub Actions, on 2026-11-24 and 2026-11-25:

| Job | Run 45715310996 (pages-as-blocks PR) | Run 45554919104 (docs PR) |
| --- | --- | --- |
| check | 30 s | 38 s |
| change-scope | 35 s | 20 s |
| change-report | 1 min 47 s | 38 s |
| a11y | 2 min 2 s | 1 min 54 s |
| lighthouse | 4 min 9 s | 4 min 1 s |
| CodeQL workflow | about 1 min 10 s | about 50 s |
| Dependency review | about 10 s | about 7 s |
| Whole CI workflow | 4 min 12 s | 4 min 3 s |

Lighthouse sets the pace. It checks 6 pages, three runs each.

**Expected yes-to-live for a content change today:** about 4 to 5 minutes of checks, a few seconds for auto-merge, then the Cloudflare deploy. The deploy is not measured yet, because no editor change has gone live. The Worker records each real yes-to-live time. A proposal to make content changes faster is in [docs/proposals/content-fast-lane.md](proposals/content-fast-lane.md).

## Known limits

- **The AI app passes on the yes.** The Worker cannot prove that the owner said yes. A careless or misled AI could publish. The change is still content only, it passes every check, it shows on the owner page, it can be undone, and it counts against the daily cap. The AI is told never to publish without a yes to the exact list. A later setting could require the owner to press Publish on the owner page instead.
- **Removing an owner takes a deploy.** The owner list ships with the Worker, so a removal takes effect at the next deploy, which is minutes. To cut access at once, also remove the person from the Access policy.
- **Preview links are not confirmed yet.** The link is computed from the branch name. The tool reports a preview ready only when the link shows the change. If it cannot confirm the link, it says the preview is still building, or that the link could not be confirmed, and gives the link anyway. Grant checks the first one.
- **The change-scope check is not a required check yet.** It runs on every editor change and is strict on them, but it does not block a merge. Grant decides whether it becomes required (see [docs/proposals/content-fast-lane.md](proposals/content-fast-lane.md)).
- **The editor works on the live domain only.** The first real try happens on the live domain, not on a preview.
- **The status needs the deploy to name its commit.** `scripts/finish-build.mjs` takes the commit from Cloudflare's build variables. If they are not set, `/site-version.json` shows no commit, and the status never says `live`. It says "merged, going live; I can't confirm yet" instead.
- **No real connection has been tested yet.** Step g below is the first test.
- **Owners and settings are not chat tasks.** The owner list and the other `editor` settings are changed in `site.config.ts` by Huston Logic. A new block is a build by Huston Logic (see [EDITING-LANES.md](EDITING-LANES.md), Lane 3).
- **Orientation depends on Cloudflare Images.** Photos are turned upright by Cloudflare Images before the camera data is dropped. This is checked on the first real site. If a phone photo comes out sideways, the fix is a rotation in the Worker, which Huston Logic makes.
- **Some PDF names are not seen.** The PDF scan does not read compressed object streams, so a name inside a compressed part of a PDF is not checked. The download headers are the protection for that case.
- **One photo size.** Each photo is one file at most 1600 pixels wide or tall. It can look a little soft on large retina screens. A second, larger size is a later build.
- **An undo keeps the files.** Undoing a change puts the page back, but the photos and PDFs it added stay in the repository.
- **The monthly photo allowance is shared.** It belongs to the Cloudflare account, so every site on that account uses the same allowance.
- **Two places keep their own colors.** The automatic reply email (`contact.emailColors`) and the owner page (`editor.pageColors`) are set in `site.config.ts`. A brand change by chat does not change them. Huston Logic updates them.
- **The social share image keeps its font.** The generated share image (OG image) always uses its bundled Outfit font, whatever display font the site uses. Its lettering can differ from the page headings.
- **A rename does not reach everything.** Changing the business name in chat changes the header, the footer, the logo's text and the RSS feed's title. It does not change the page titles, and it does not change the signature of the automatic reply email. The owner changes page titles page by page.
- **An expired notice stays up until the next publish.** The site checks the notice's last day when it builds. So an expired notice comes down only on the first build after a publish of anything.
- **Drafts depend on Workers Builds naming its branch.** Production builds only through Workers Builds, so a build outside it counts as "not production" and includes drafts. `/site-version.json` shows `drafts: true` for such a build, and the build log says "Drafts included (not a production build)". Never deploy by hand.
- **Brand changes need preview links.** A preview of a brand change needs the site's preview address set up (`workersSubdomain` in the editor block of `site.config.ts`). Without it the editor refuses a brand proposal up front, before anything is drafted, and says that Huston Logic can make the change.
- **A list shows only live items.** A video list, episode list, testimonials or team block is left off the page until one item in it is live. The change list says so. The blog index shows its own empty text instead.
- **Spotify may need a second press.** Browsers limit autoplay inside a frame from another site, so a Spotify episode may need a second press to start.
- **Not in this version.** Tags or categories, post search, scheduled publishing, comments, authors other than the site, a notice with a close button, a 24-hour clock, owner-set background or text colors, and SVG logos by chat. For forms: payments, calendar bookings, visitor file uploads, multi-step forms, conditional fields, hidden fields, and changes to the contact form or to where answers go.
- **Testimonials are not checked for truth.** The check can confirm the fields are there. It cannot confirm that the client said the quote. The AI app is told never to write one without the quote and the name from the owner.
- **New forms need the Sheet script updated first.** Until the Apps Script in each site's Sheet is updated and the `Forms` and `Forms preview` tabs exist, a new form's answers do not reach the Sheet. The owner's email says so ("Sheet: NOT saved"), and it has every answer. Huston Logic makes this update (see the setup notes in the README's "Contact form" section).
- **A visitor without JavaScript cannot send a form.** The form still shows every field and the button. Below the button it gives the owner's email address to write to. Sending needs JavaScript, because the human check (Turnstile) runs in the browser.

## Set up the editor on one site

These steps are for whoever holds the site's Cloudflare and GitHub accounts. Each step says what it does and why. Put the values in the places named here, and never in chat, a pull request or a log.

### a. Create the GitHub App

**What it does:** creates the small GitHub identity that opens the owner's pull requests, with only the permissions the editor needs. **Why:** if its key ever leaked, only this one repository is at risk.

1. In GitHub, open the `huston-logic` organization. Go to Settings, Developer settings, GitHub Apps, then New GitHub App.
2. Set the name to `[[Site name]] editor`. Set the homepage URL to `https://[[Site domain]]`. Under Webhook, untick "Active". The editor does not need GitHub to call it.
3. Under Repository permissions, set exactly these. Leave every other permission at "No access".
   - Contents: Read and write
   - Pull requests: Read and write
   - Issues: Read and write
   - Checks: Read-only
   - Metadata: Read-only
   Do not set Workflows, Administration, Actions or Secrets.
4. Under "Where can this GitHub App be installed?", choose "Only on this account".
5. Create the App. Note the **App ID**, shown on the App's page. It goes in `site.config.ts` in step e.
6. Under Private keys, choose Generate a private key. A `.pem` file downloads. Keep it for step b only.
7. Install the App from its Install App page. Choose the account, then "Only select repositories", and pick this site's repository and no other.
8. Note the **installation id**. It is the number at the end of the URL of the installation's settings page. It goes in `site.config.ts` in step e.
9. Note the **bot login**. It is the App's slug (the name in its public address, `github.com/apps/<slug>`) followed by `[bot]`, exactly, for example `my-site-editor[bot]`. It goes in `site.config.ts` in step e. The editor refuses to publish when the pull request's author does not match it, and tells the owner the settings don't match.

### b. Store the private key as a Worker secret

**What it does:** puts the key where only the Worker can read it. **Why:** the key must never sit in the repo.

From the repo folder, run:

```bash
npx wrangler secret put GITHUB_APP_PRIVATE_KEY < path/to/key.pem
```

Then delete the `.pem` file. Set this for **production only**. Never set it for previews, because the editor is off on previews. The secret is listed in [docs/SECRETS.md](SECRETS.md).

### c. Create two KV namespaces

**What it does:** creates two storage areas for the editor. KV is Cloudflare's key-value store. **Why:** `OAUTH_KV` holds the AI app's sign-in tokens, stored as hashes. `EDITOR_KV` holds drafts of proposals and the first time each change was seen live.

```bash
npx wrangler kv namespace create OAUTH_KV
npx wrangler kv namespace create EDITOR_KV
```

Each command prints an id of 32 characters. Copy both. They go in `site.config.ts` in step e. The ids are not secrets.

### d. Set up the sign-in gate (Cloudflare Access)

**What it does:** Access is Cloudflare's sign-in gate. It emails a one-time code to the owner before `/owner` opens. **Why:** only the listed owners can reach the owner page, and the Worker checks the same sign-in on every request.

1. In the Cloudflare dashboard, open Zero Trust, then Access, then Applications. Choose Add an application, then Self-hosted.
2. Set the application name to `[[Site name]] owner`. Set the domain to `[[Site domain]]` and the path to `owner`. This covers `/owner` and everything under it.
3. Under login methods, choose One-time PIN.
4. Add one policy. Its action is Allow, and its Include rule lists the owner emails and nobody else. These must match `editor.ownerEmails` in `site.config.ts`.
5. Save. Copy the **Application Audience (AUD) tag** shown for the application. It goes in `site.config.ts` in step e. It is not a secret.
6. Note the **team name**. It is the part of the team's address before `.cloudflareaccess.com`. It goes in `site.config.ts` in step e.
7. Do not protect `/mcp`, `/oauth` or `/.well-known`. The AI app signs in through the site's own OAuth sign-in (a standard way to let an app act for a user without sharing a password). Those paths must stay open to the AI app.

### Before you turn the editor on

The editor publishes nothing, and says so, until the repository has these two things. Set them in step f and check them before turning `enabled` on in step e.

- The "Protect main" ruleset with its required checks (`check`, `a11y`, `lighthouse` and `dependency-review`). Without required checks the editor never merges a change.
- **Allow auto-merge** turned on in the repository settings. Without it the editor stops the pull request and says auto-merge is off.

### e. Fill in the editor block and turn it on

**What it does:** gives the Worker the values it needs. **Why:** every value is set in one place, `site.config.ts`, and checked by the build.

Open `editor` in `site.config.ts` and fill in:

- `enabled`: `true`, last, once everything else is set.
- `ownerEmails`: the owners' emails, the same list as the Access policy.
- `access.teamDomain` and `access.aud`: the team name and the AUD tag from step d.
- `github.owner`, `github.repo`, `github.appId`, `github.installationId` and `github.botLogin`: from step a. `owner` is `huston-logic`. `repo` is the site's repository name.
- `workersSubdomain`: the part before `.workers.dev` in the account's workers.dev address. The Worker uses it to build preview links.
- `kv.oauth` and `kv.editor`: the two ids from step c.
- `rateLimitId`: the next free id in the Editor column of [docs/HOSTING.md](HOSTING.md). For the next new site it is `"2003"`.
- `dailyChangeLimit`: only if it should not be 10.

While `enabled` is `false`, nothing is checked. Once it is `true`, `npm run check:config` names each value that is still missing. Then run:

```bash
npm run sync:config
```

It writes the editor's paths, bindings and secret name into `wrangler.jsonc`. Commit the result, open a pull request and merge it.

### f. Set the repository

**What it does:** sets three things in the site's GitHub repository. **Why:** each one is needed for the editor to work.

- Settings, General: turn on **Allow auto-merge**. Publishing turns on auto-merge, which needs this setting.
- Labels: create a label named `owner-request`. Requests the AI cannot fill are filed as issues with this label.
- Watch the repository: choose Watch, then All activity. Owner requests and stuck changes then reach Grant by notification.

### g. Test it

**What it does:** runs one real change from start to finish. **Why:** the tests use fake GitHub and fake storage, so the first real run is the real test.

1. Open `https://[[Site domain]]/owner` and sign in with your email code.
2. Connect the AI app. In Claude: Settings, Connectors, Add custom connector. Paste `https://[[Site domain]]/mcp`, then choose Connect, sign in with the email code, and choose Allow. For another AI app, use the same address and its own steps for a custom connector.
3. Ask for one small text change, such as a heading. Read the list the AI shows, then say yes.
4. Ask "is it live yet?" and wait for `live`. Open `https://[[Site domain]]/site-version.json`. It should name the merge commit. If it shows no commit, see Known limits.
5. Ask for a preview of one change, and open the preview link. It should show the change.
6. Ask "undo that" and say yes to the new list.
7. Check that `https://[[Site domain]]/blocks` is a 404 on the live site.

Write down the time between the yes and `live`. That is the first real yes-to-live measurement.

## Set up uploads on one site

These steps are the uploads part of the setup. Do them after steps a to g, because uploads need the editor on. Like steps a to g, each step says what it does and why, and no value goes in chat, a pull request or a log. Uploads add no secret.

### h. Create the private R2 bucket

**What it does:** creates the storage area for the owner's uploads. R2 is Cloudflare's file storage. **Why:** each site gets its own bucket, so one site's files never sit in another site's storage.

From the repo folder, run this, with `<workerName>` replaced by the Worker name in `site.config.ts` (`workerName`):

```bash
npx wrangler r2 bucket create <workerName>-uploads
```

Leave the bucket private. Do not turn on public access and do not add a custom domain.

### i. Add the expiry rule

**What it does:** tells R2 to delete a file 31 days after it was written. **Why:** unused uploads expire after 30 days in the Worker. This rule is the backstop if the Worker's own sweep misses a file.

Run this, with `<bucket>` set to the bucket name from step h (flags checked against Wrangler's own help on 2026-11-25; `expire-inbox` is the rule's name):

```bash
npx wrangler r2 bucket lifecycle add <bucket> expire-inbox --expire-days 31
```

### j. Check that Cloudflare Images is on the account

**What it does:** makes sure the Images service is available. Images is Cloudflare's image service. **Why:** the Worker uses it to turn phone photos into web-ready WebP. The Free plan is enough. The Images binding needs no key, so there is no secret to set.

In the Cloudflare dashboard, open Images for the account and check that it is available.

### k. Turn uploads on in site.config.ts

**What it does:** names the bucket and switches uploads on. **Why:** `npm run sync:config` writes the bucket and the Images binding into `wrangler.jsonc`. It writes them only when both `editor.enabled` and `editor.uploads.enabled` are `true`.

Open `editor.uploads` in `site.config.ts` and set:

- `bucket`: the bucket name from step h, `<workerName>-uploads`.
- `enabled`: `true`. `editor.enabled` must already be `true` (step e).

Then run:

```bash
npm run sync:config
```

Commit the result, open a pull request and merge it.

### l. Test it

**What it does:** runs real files through the upload path from a phone. **Why:** the tests use fake storage and a fake Images service, so the first real run is the real test.

1. Open `https://[[Site domain]]/owner` on a phone. Upload an iPhone photo that was taken in portrait (HEIC). Check that it shows upright as a thumbnail on the owner page.
2. Upload a PDF. Once it is used on a page, check that the page's download button or link downloads it.
3. Upload a video from a phone. Check that it is refused with the message that points to YouTube or Vimeo.
4. Ask your AI app for a gallery on a page, using the photos you uploaded. Read the list, say yes, and check that the photos show upright in the published gallery.

### What uploads cost

These figures come from the design spec (`docs/superpowers/specs/2026-11-25-uploads-and-photos-design.md`).

- **R2 storage** is shared by all sites on the Cloudflare account. Each month the account gets 10 GB-months of storage, 1 million writes and 10 million reads free. Deletes are free. Past that: $0.015 per GB-month of storage, $4.50 per million writes and $0.36 per million reads. No egress fees. Only converted files are kept (at most 450 KB each, plus a 30 KB preview), never originals, and each site's inbox is capped at 200 MB. A full site costs at most $0.003 a month past the free tier.
- **Images** on the Free plan include 5,000 unique transformations a month per account, shared by all sites. Each photo takes 2 to 5 (the web file, the preview, and up to 3 retries for size), so that is about 1,000 to 2,500 photos a month before the limit. Past the limit the Free plan refuses (error 9422) and charges nothing. The paid plan is $0.50 per 1,000 beyond 5,000.
- **Workers**: uploads run on the existing Workers Paid plan ($5 a month in total). No change.
- **Result**: next to nothing per site, and $0 at the expected volume of tens of photos per site a month.

## Add the editor to an existing client site

Use this for a site built from the template that does not have the editor yet. Paste the message below into a Claude Code session in the client's repo. It is a process run, so it works in one branch and one pull request, like the other runs in [docs/PROCESS.md](PROCESS.md). Keep it separate from any other change.

```text
This is an autonomous process run named "Site editor". Work from the editor sections of docs/EDITING.md in the
huston-logic/site-template repo (fetch it from GitHub; do not guess the steps). Read CLAUDE.md, AGENTS.md and
docs/PROCESS.md in this repo first.

Port these from huston-logic/site-template, as they are: worker/index.ts, the whole worker/editor/ folder, the whole
worker/uploads/ folder, the editor block of site.config.ts (including editor.uploads), scripts/config-rules.mjs,
scripts/finish-build.mjs, scripts/content-lane.mjs (only with the content fast lane, docs/proposals/content-fast-lane.md),
the bot-author rule in scripts/check-change-scope.mjs (and its test), the photo blocks (src/blocks/library/photo-text and
src/blocks/library/gallery), src/components/hl/Photo.tsx, public/images/examples/, src/content/files.ts,
scripts/pdf-check.mjs, the PDF and scope check changes in scripts/change-scope-rules.mjs and scripts/check-change-scope.mjs
(and their tests), tests/a11y/owner-page.spec.ts, docs/VOICE-GUIDE.md and docs/EDITING.md.
Merge, do not replace, anything in AGENTS.md, README.md and package.json that the client's repo has changed.

Keep editor.enabled false. Keep editor.uploads.enabled false and do not create a bucket. Do not set any editor value that
needs an account: the App ID, the installation id, the Access team and AUD, the KV ids, the bucket name and the
workers.dev subdomain. Do not create a GitHub App, a KV namespace, an R2 bucket or an Access application, and do not set
any secret. Leave the [[placeholders]] in docs/VOICE-GUIDE.md as they are, and list them in the pull request.

The one new runtime dependency is @cloudflare/workers-oauth-provider, pinned exactly to 1.2.4. It is allowed in this
run. Check it is at least 7 days old (npm view @cloudflare/workers-oauth-provider time), that dependency-review passes,
and flag it in the summary.

Run npm run check:fast on each commit and npm run check before the pull request. If either fails, stop and show the
exact error.

Open one pull request on a branch named feat/site-editor. Its description starts with a "Needs your eyes" line that lists
every change to AGENTS.md, README.md, package.json and site.config.ts.

Under Needs Grant in docs/STATUS.md, list the setup steps a to g in docs/EDITING.md, in order.

Stop, queue the item and continue with the other work on any of these, as CLAUDE.md says: secrets or credentials, DNS,
accounts or money, sending real email, deleting user data, lowering a threshold or a required check, or any owner-only
path (.claude/hooks, .claude/agents, .claude/skills, .claude/settings*.json, .github/workflows). For an owner-only
change, write the proposed file to the scratchpad and list it for Grant to copy in by hand.

END OF BRIEF
```

## Add uploads to a site that already has the editor

Use this for a site that already runs the editor (`editor.enabled` is `true`) and does not have uploads yet. It is a process run, like the editor port above, and keeps uploads off until Grant's setup steps h to l are done.

```text
This is an autonomous process run named "Uploads and photos". Work from the uploads sections of docs/EDITING.md in the
huston-logic/site-template repo (fetch it from GitHub; do not guess the steps). Read CLAUDE.md, AGENTS.md and
docs/PROCESS.md in this repo first.

This site already has the site editor. Port these from huston-logic/site-template, as they are: the whole worker/uploads/
folder, worker/index.ts and the whole worker/editor/ folder, the editor block of site.config.ts (including editor.uploads),
scripts/config-rules.mjs, the photo blocks (src/blocks/library/photo-text and src/blocks/library/gallery),
src/components/hl/Photo.tsx, public/images/examples/, src/content/files.ts, scripts/pdf-check.mjs, the scope check changes
in scripts/change-scope-rules.mjs and scripts/check-change-scope.mjs (and their tests), the shared block rules in
src/blocks/validate.ts, src/blocks/schema.ts and src/blocks/definitions.ts, and docs/EDITING.md. Regenerate docs/BLOCKS.md and
docs/blocks.json with npm run blocks:catalog. Merge, do not replace, anything in AGENTS.md, README.md, package.json and
site.config.ts that the client's repo has changed.

Keep editor.uploads.enabled false. Do not create an R2 bucket, do not set the bucket name, and do not create or change any
Cloudflare Images setting. Do not set any secret. No new dependency is expected; if one seems needed, stop and list it.

Run npm run check:fast on each commit and npm run check before the pull request. If either fails, stop and show the
exact error.

Open one pull request on a branch named feat/uploads. Its description starts with a "Needs your eyes" line that lists
every change to AGENTS.md, README.md, package.json and site.config.ts.

Under Needs Grant in docs/STATUS.md, list the setup steps h to l in docs/EDITING.md, in order.

Stop, queue the item and continue with the other work on any of these, as CLAUDE.md says: secrets or credentials, DNS,
accounts or money, sending real email, deleting user data, lowering a threshold or a required check, or any owner-only
path (.claude/hooks, .claude/agents, .claude/skills, .claude/settings*.json, .github/workflows). For an owner-only
change, write the proposed file to the scratchpad and list it for Grant to copy in by hand.

END OF BRIEF
```

## Add collections and brand settings to an existing client site

Use this for a site that already runs the site editor and does not have collections yet. It adds blog posts, videos, podcast episodes, testimonials, team members, business details, brand settings and the site notice. It is a process run, so it works in one branch and one pull request, like the runs above. Keep it separate from any other change.

```text
This is an autonomous process run named "Collections and brand settings". Work from the collections and brand sections
of docs/EDITING.md in the huston-logic/site-template repo (fetch it from GitHub; do not guess the steps). Read CLAUDE.md,
AGENTS.md and docs/PROCESS.md in this repo first.

This site must already have the site editor (see "Add the editor to an existing client site" above). If it does not,
stop and say so.

Port these from huston-logic/site-template, as they are:
- the whole src/collections/, src/brand/ and src/settings/ folders, with their *.test.ts files
- src/lib/build-target.ts, content-files.ts, collections.ts, settings.ts, drafts.ts, site-content.ts, blog.ts, feed.ts,
  chrome-view.ts, and their tests; also src/lib/routes.ts, pages.ts, page-files.ts, metadata.ts, site-organization.ts and
  organization-jsonld.ts
- the new block folders under src/blocks/library/: latest-posts, post-index, video-list, episode-list, testimonials, team
  and business-details (each with its definition, component, example and tests); src/blocks/list-format.ts and
  src/blocks/audio-player.ts; the shared block rules in src/blocks/schema.ts, validate.ts and embeds.ts
- the blog pages: the whole src/app/(site)/blog/ folder, and src/app/og.png/route.tsx
- src/app/palette.css (generated: sync:config rewrites it, see below)
- src/content/business.json, brand.json, notice.json, the whole src/content/collections/ folder (one example item per
  kind), src/content/pages/blog.json, src/content/blog.ts and src/content/players.ts
- worker/editor/ (the whole folder), worker/config.ts and worker/index.ts (each with one new line for the email and owner
  page colors), and worker/contact.test.ts
- the scripts this run changed: sync-config.mjs, config-rules.mjs, check-placeholders.mjs, make-example-photos.mjs,
  finish-build.mjs, blocks-catalog.mjs, check-content.mjs, check-content.test.mjs, check-change-scope.mjs,
  change-scope-rules.mjs, change-report.mjs, brand-files.test.mjs, and their tests. If the template's main changes a
  script not on this list, port it too and list it in the pull request.
- tests/a11y/ (the routes the accessibility check reads) and lighthouserc.cjs (the audited routes only; no threshold changes)
- docs/EDITING.md, docs/EDITING-LANES.md, docs/CHANGE-SCOPE.md, docs/BLOCKS.md and docs/blocks.json (regenerate the last two
  with npm run blocks:catalog)

Merge, do not replace:
- AGENTS.md, README.md and package.json: keep the client's own changes and add the template's.
- site.config.ts: keep the client's values. Remove theme, brand.logo, owner.phone and contact.linkedInUrl. Move the
  client's colors and fonts from theme into src/content/brand.json (the 13 colors, the three fonts and the logo if it has
  one, which must be null or an upload). Move the client's public phone number, LinkedIn link, public email, address and
  hours into src/content/business.json (LinkedIn becomes a social entry). The notification address (contact.siteEmail)
  stays in site.config.ts. Add business.timeZone (the client's IANA zone, such as
  "America/Chicago"; if the zone is not known, keep "UTC" and list it in the pull request), contact.emailColors and
  editor.pageColors. Give both the same values as brand.json, because nothing keeps them in step.
- A client font that is not on the curated list in src/brand/fonts.ts cannot go in brand.json. Stop on that item, and
  list it in the pull request. Huston Logic adds fonts.
- src/app/hl.css: take out the palette lines (the colors now come only from src/app/palette.css). Keep the client's own
  tokens and motion.
- src/blocks/definitions.ts, src/blocks/components.tsx, src/components/layout/ (Header, Footer, HeaderNav, Logo, Notice,
  SiteChrome) and src/app/layout.tsx: keep the client's design, and add only the new blocks, the logo, business details and
  the notice wiring.

Then run npm run sync:config. It writes src/app/palette.css, src/lib/fonts.ts and public/_headers from brand.json and
site.config.ts. Then run npm run check:config. Commit the generated files with the rest.

Keep editor.enabled as it is. Do not set any value that needs an account. Do not change the editor's Access or GitHub
settings.

Do not invent a post, a testimonial, a quote, a team member, a statistic or a result. Keep the example items and
src/content/pages/blog.json in place with their [[placeholders]], and list every placeholder in the pull request. Do not
delete an example item; Grant decides which to remove.

No new dependency is expected; if one seems needed, stop and list it.

Run npm run check:fast on each commit and npm run check before the pull request. If either fails, stop and show the
exact error.

Open one pull request on a branch named feat/collections-and-brand. Its description starts with a "Needs your eyes" line
that lists every change to AGENTS.md, README.md, package.json and site.config.ts.

Under Needs Grant in docs/STATUS.md, list the placeholders left in place, the time zone if it was not given, and the
fonts or settings Huston Logic must still add.

Stop, queue the item and continue with the other work on any of these, as CLAUDE.md says: secrets or credentials, DNS,
accounts or money, sending real email, deleting user data, lowering a threshold or a required check, or any owner-only
path (.claude/hooks, .claude/agents, .claude/skills, .claude/settings*.json, .github/workflows). For an owner-only
change, write the proposed file to the scratchpad and list it for Grant to copy in by hand.

END OF BRIEF
```

## Add forms and downloads to an existing client site

Use this for a site that already runs the site editor and does not have forms yet. It is a process run, so it works in one branch and one pull request, like the runs above. Keep it separate from any other change. It adds no form on its own: the owner adds forms by chat afterwards.

```text
This is an autonomous process run named "Forms and downloads". Work from the forms sections of docs/EDITING.md in the
huston-logic/site-template repo (fetch it from GitHub; do not guess the steps). Read CLAUDE.md, AGENTS.md and
docs/PROCESS.md in this repo first.

This site must already have the site editor (see "Add the editor to an existing client site" above). If it does not,
stop and say so.

Port these from huston-logic/site-template, as they are:
- the whole src/forms/ folder with its *.test.ts files, src/content/forms.ts, and the whole src/content/forms/ folder
  (it holds the contact form's file, contact.json; do not change that file)
- the form block (src/blocks/library/form/, with its definition, component, example and tests) and the shared form
  components it uses
- worker/forms.ts and worker/forms.test.ts, worker/contact.ts, worker/messages.ts, worker/config.ts, worker/index.ts,
  worker/tsconfig.json and the whole worker/editor/ folder, with their tests
- the scripts this run changed: sync-config.mjs, config-rules.mjs, check-content.mjs, blocks-catalog.mjs,
  change-scope-rules.mjs, check-change-scope.mjs, change-report.mjs, and their tests
- docs/apps-script/contact-sheet.gs
- docs/EDITING.md, docs/EDITING-LANES.md, docs/CHANGE-SCOPE.md, docs/SECRETS.md and docs/HOSTING.md; regenerate
  docs/BLOCKS.md and docs/blocks.json with npm run blocks:catalog

Merge, do not replace:
- AGENTS.md, README.md and package.json: keep the client's own changes and add the template's.
- site.config.ts: keep the client's values. Add the forms caps (forms.maxForms, maxFields, maxAnswerChars and
  maxBodyBytes, with the template's values) and the two tab names in contact.sheetTabs (forms "Forms", formsPreview
  "Forms preview"). Do not change the client's contact.rateLimitIds, contact.destination, contact.sheetWriter or any
  recipient.
- If the client's contact form has changed, keep its markup and its tests as they are. If porting the form view would
  change how the contact form looks or behaves, stop and list it in the pull request.

Then run npm run sync:config. It writes src/forms/registry.generated.ts and wrangler.jsonc. Then run npm run check:config.
Commit the generated files with the rest.

Do not create a form, do not set any value that needs an account, and do not change any Cloudflare, Google or GitHub
setting. Do not set any secret. Forms add no rate-limit id: they use the contact pair in site.config.ts.

No new dependency is expected; if one seems needed, stop and list it.

Run npm run check:fast on each commit and npm run check before the pull request. If either fails, stop and show the
exact error.

Open one pull request on a branch named feat/forms-and-downloads. Its description starts with a "Needs your eyes" line
that lists every change to AGENTS.md, README.md, package.json and site.config.ts.

Under Needs Grant in docs/STATUS.md, list in order: update the Apps Script in the client's Sheet from
docs/apps-script/contact-sheet.gs, add the tabs "Forms" and "Forms preview" with the header row
Received (UTC) | Form | Name | Email | Answers | Mode, and deploy a new version of the same web app. Set the script
properties TAB_FORMS and TAB_FORMS_PREVIEW only if the tab names differ. A Pipeline site needs no Sheet step.

Stop, queue the item and continue with the other work on any of these, as CLAUDE.md says: secrets or credentials, DNS,
accounts or money, sending real email, deleting user data, lowering a threshold or a required check, or any owner-only
path (.claude/hooks, .claude/agents, .claude/skills, .claude/settings*.json, .github/workflows). For an owner-only
change, write the proposed file to the scratchpad and list it for Grant to copy in by hand.

END OF BRIEF
```

## One connector per client (not built)

A client with a site and the Pipeline app has two connectors. Claude's free plan allows one custom connector. The options, with their costs, are in [docs/proposals/one-connector.md](proposals/one-connector.md). Nothing is built.
