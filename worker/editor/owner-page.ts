// The owner page and the sign-in consent page: pure functions, data in and an HTML string out. No inline scripts, no external
// resources, no style attributes. The home page carries one same-origin script tag (the upload form's progress). Every interpolated value goes through escapeHtml.

import { escapeHtml } from "../html.ts";
import type { ChangeView, ProposalView, UploadView } from "./views.ts";
import { AGENCY_NAME } from "./words.ts";

export type { ChangeView, ProposalView, UploadView };

export interface ThemeColors {
  white: string;
  ink: string;
  ink2: string;
  silver: string;
  silver2: string;
  green: string;
  greenDeep: string;
  rust: string;
  line: string;
  tint: string;
}

export interface PageBase {
  siteName: string;
  siteUrl: string;
  email: string;
  theme: ThemeColors;
}

/** One line of the result a plain (no JavaScript) upload post shows at the top of the uploads section. */
export interface UploadLine {
  name: string;
  ok: boolean;
  message: string;
}

export interface UploadsSection {
  /** Newest first; null when the list could not be read; absent when uploads are not set up. */
  items: UploadView[] | null;
  notSetUp?: boolean;
  limits: { photoBytes: number; pdfBytes: number; expireDays: number };
  /** The current time, ISO, for "Removed in N days". */
  now: string;
  results?: UploadLine[];
}

export interface HomeData extends PageBase {
  /** null when the list could not be read. */
  proposals: ProposalView[] | null;
  changes: ChangeView[] | null;
  /** Omitted: the page has no uploads section. */
  uploads?: UploadsSection;
}

export interface RemoveData extends PageBase {
  upload: UploadView;
}

export interface ConfirmData extends PageBase {
  proposal: ProposalView;
}

export interface ConsentData extends PageBase {
  handle: string;
  clientName: string;
  clientDomain?: string;
  redirectHost: string;
  redirectIsLoopback: boolean;
}

export interface MessageData extends PageBase {
  title: string;
  body: string;
}

const e = escapeHtml;

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const safeColor = (value: string, fallback: string): string => (HEX.test(value) ? value : fallback);

/** `2026-01-01 12:00 UTC`, the same everywhere. */
export function formatTime(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return `${new Date(ms).toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

const time = (iso: string): string => `<time datetime="${e(iso)}">${e(formatTime(iso))}</time>`;

function styles(theme: ThemeColors): string {
  const c = (key: keyof ThemeColors, fallback: string): string => safeColor(theme[key], fallback);
  const ink = c("ink", "#1c1917");
  const line = c("line", "#d6d3d1");
  const ink2 = c("ink2", "#44403c");
  const white = c("white", "#ffffff");
  return `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:${white};color:${ink};font:1.0625rem/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:40rem;margin:0 auto;padding:0 1rem}
header{border-bottom:1px solid ${line};padding:1rem 0}
header p{margin:0}
.muted{color:${ink2}}
h1{font-size:1.625rem;line-height:1.25;margin:1.5rem 0 1rem}
h2{font-size:1.25rem;line-height:1.3;margin:2rem 0 .75rem}
h4{font-size:.9375rem;line-height:1.3;margin:.75rem 0 0}
a{color:${ink};text-decoration:underline;text-underline-offset:.15em}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid ${c("rust", "#9a3412")};outline-offset:2px}
.skip{position:absolute;left:-999px;top:0;background:${white};padding:.75rem 1rem;z-index:1}
.skip:focus{left:0}
main{padding-bottom:3rem}
ul,ol{padding:0;margin:0}
.card{border:1px solid ${line};border-radius:8px;padding:1rem;margin:0 0 1rem;list-style:none}
.card h3{font-size:1.0625rem;margin:0 0 .5rem}
.card p{margin:.25rem 0}
pre{white-space:pre-wrap;overflow-wrap:anywhere;background:${c("silver", "#f5f5f4")};border:1px solid ${line};border-radius:8px;padding:.75rem;margin:.75rem 0;font:.9375rem/1.45 ui-monospace,SFMono-Regular,Menlo,monospace}
code{overflow-wrap:anywhere;background:${c("silver", "#f5f5f4")};border:1px solid ${line};border-radius:4px;padding:.1rem .35rem;font-size:.9375rem}
.actions{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0 0}
.actions form{margin:0}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding:.75rem 1.25rem;border-radius:8px;font:inherit;font-weight:600;cursor:pointer;text-decoration:none;border:1px solid ${ink2};background:${white};color:${ink}}
.nav-link{display:inline-flex;align-items:center;min-height:44px}
.tag{display:inline-block;border:1px solid ${ink2};border-radius:999px;padding:.125rem .625rem;font-size:.875rem;font-weight:600;background:#ffffff;color:${ink}}
.btn.primary{background:${c("green", "#1e4fa3")};border-color:${c("green", "#1e4fa3")};color:${white}}
.btn.primary:hover{background:${c("greenDeep", "#173b7a")}}
.host{font-size:1.25rem;font-weight:700;overflow-wrap:anywhere}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.plain{list-style:none}
.uploads{display:grid;grid-template-columns:repeat(auto-fill,minmax(9.5rem,1fr));gap:.75rem;margin:1.25rem 0 0;list-style:none}
.uploads[hidden]{display:none}
.up{margin:0;padding:.5rem;display:flex;flex-direction:column;gap:.25rem}
.up h3{font-size:.9375rem;margin:.25rem 0 0;overflow-wrap:anywhere}
.up .meta{font-size:.875rem}
.up-actions{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:auto;padding-top:.25rem}
.up-actions .btn{min-height:44px;padding:.5rem .75rem;font-size:.9375rem;flex:1 1 auto}
.up-actions details{flex:1 1 auto}
.up-actions details[open]{flex-basis:100%}
summary.btn{list-style:none;width:100%}
summary.btn::-webkit-details-marker{display:none}
.rename-form{display:flex;flex-direction:column;gap:.25rem;margin:.5rem 0 0}
.rename-form label{font-size:.875rem;font-weight:600}
.rename-form .btn{width:100%}
.btn[aria-disabled=true]{opacity:.6;cursor:default}
#upload-progress:focus{outline:none}
.results h3,#upload-progress h3{font-size:1rem;margin:0 0 .5rem}
.thumb{aspect-ratio:4/3;border-radius:6px;overflow:hidden;background:${c("silver", "#f5f5f4")};border:1px solid ${line}}
.thumb img{display:block;width:100%;height:100%;object-fit:cover}
.doc{display:flex;align-items:center;justify-content:center;font-weight:700;color:${ink2}}
input[type=text],input[type=file]{font:inherit;color:${ink};min-height:44px;width:100%;padding:.5rem .625rem;border:1px solid ${ink2};border-radius:8px;background:${white}}
input:focus-visible{outline:3px solid ${c("rust", "#9a3412")};outline-offset:2px}
.upload-form{display:flex;flex-direction:column;gap:.5rem;margin:0 0 1rem}
.upload-form label{font-weight:600}
progress{width:100%;height:.75rem;accent-color:${c("green", "#1e4fa3")}}
.progress-row{display:flex;flex-direction:column;gap:.25rem;margin:0 0 .75rem}
.progress-name{font-weight:600;overflow-wrap:anywhere}
.results{border:1px solid ${line};border-radius:8px;padding:.75rem;margin:0 0 1rem}
.results li{margin:.25rem 0;overflow-wrap:anywhere}
.files{display:flex;flex-wrap:wrap;gap:.75rem;list-style:none;margin:0 0 1rem}
.files li{width:9rem}
.files p{margin:.25rem 0 0;font-weight:600;font-size:.875rem;overflow-wrap:anywhere}
.warn{border:2px solid ${c("rust", "#9a3412")};border-radius:8px;padding:.75rem;margin:1rem 0}
`;
}

function layout({ title, siteName, email, theme, body }: { title: string; siteName: string; email?: string; theme: ThemeColors; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${e(title)} | ${e(siteName)}</title>
<style>${styles(theme)}</style>
</head>
<body>
<a class="skip" href="#main">Skip to main content</a>
<header>
<div class="wrap">
<p><strong>${e(siteName)}</strong> <span class="muted">Owner page</span></p>
${email ? `<p class="muted">Signed in as ${e(email)}</p>` : ""}
</div>
</header>
<main id="main">
<div class="wrap">
${body}
</div>
</main>
</body>
</html>
`;
}

const wrap = (base: PageBase, title: string, body: string): string => layout({ title, siteName: base.siteName, email: base.email, theme: base.theme, body });

function postForm(action: string, fields: Record<string, string>, label: string, primary: boolean): string {
  const hidden = Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${e(name)}" value="${e(value)}">`)
    .join("");
  return `<form method="post" action="${e(action)}">${hidden}<button class="btn${primary ? " primary" : ""}" type="submit">${e(label)}</button></form>`;
}

const STATE_WORDS: Record<ChangeView["state"], string> = {
  checking: "Being checked, not live yet",
  stuck: "Stuck: a check found a problem, not live",
  "going live": "Passed its checks, going live",
  live: "Live",
  stopped: "Stopped before it went live",
  unknown: "Status unavailable right now",
};

const STATE_TAGS: Record<ChangeView["state"], string> = {
  checking: "Checking",
  stuck: "Stuck",
  "going live": "Going live",
  live: "Live",
  stopped: "Stopped",
  unknown: "Status unavailable",
};

/** The button on a published change: a change still open is withdrawn, a merged one is undone, a stopped one has nothing to do. */
function changeAction(change: ChangeView): string {
  switch (change.state) {
    case "checking":
    case "stuck":
      return `Withdraw change ${change.change}`;
    case "going live":
    case "live":
      return `Undo change ${change.change}`;
    case "stopped":
    case "unknown":
      return "";
  }
}

function previewLink(proposal: ProposalView): string {
  return proposal.previewLink
    ? `<a class="btn" href="${e(proposal.previewLink)}" target="_blank" rel="noopener noreferrer" aria-label="Open the preview (opens in a new tab): ${e(proposal.summary)}">Open the preview (opens in a new tab)</a>`
    : "";
}

function proposalCard(proposal: ProposalView): string {
  const links = [
    `<a class="btn primary" href="/owner/publish?proposal=${encodeURIComponent(proposal.id)}" aria-label="Review and publish: ${e(proposal.summary)}">Review and publish</a>`,
    previewLink(proposal),
  ].join("");
  return `<li class="card">
<h3>${e(proposal.summary)}</h3>
<p class="muted">Prepared ${time(proposal.createdAt)}</p>
<h4>Changes in this proposal</h4>
<pre>${e(proposal.changeList)}</pre>
<div class="actions">${links}</div>
</li>`;
}

function changeItem(change: ChangeView): string {
  const times =
    change.state === "live" && change.liveAt
      ? `Published ${time(change.publishedAt)}, live ${time(change.liveAt)}.`
      : `Published ${time(change.publishedAt)}.`;
  const failed = change.state === "stuck" && change.failedChecks && change.failedChecks.length > 0 ? `<p>Failed: ${e(change.failedChecks.join(", "))}</p>` : "";
  const label = changeAction(change);
  const action = label ? postForm("/owner/undo", { change: String(change.change) }, label, false) : "";
  return `<li class="card">
<h3>Change ${e(String(change.change))}: ${e(change.title)}</h3>
<p><span class="tag">${e(STATE_TAGS[change.state])}</span></p>
<p>${e(STATE_WORDS[change.state])}</p>
<p class="muted">${times}</p>
${failed}
${action ? `<div class="actions">${action}</div>` : ""}
</li>`;
}

const sizeLabel = (bytes: number): string =>
  bytes < 1_000_000 ? `${Math.max(1, Math.round(bytes / 1000))} KB` : `${Math.round((bytes / 1_000_000) * 10) / 10} MB`;
const megabytes = (bytes: number): string => String(Math.round((bytes / 1_000_000) * 10) / 10);
const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

function thumbnail(upload: { id: string; name: string; kind: "photo" | "pdf" }): string {
  return upload.kind === "photo"
    ? `<div class="thumb"><img src="/owner/uploads/${e(upload.id)}/preview" alt="" width="480" height="360" loading="lazy"></div>`
    : `<div class="thumb doc"><span>PDF</span></div>`;
}

function uploadCard(upload: UploadView, nowMs: number): string {
  const facts = [upload.kind === "photo" ? "Photo" : "PDF", sizeLabel(upload.bytes)];
  if (upload.kind === "pdf" && upload.pages) facts.push(plural(upload.pages, "page"));
  const days = Math.max(1, Math.ceil((Date.parse(upload.expiresAt) - nowMs) / 86_400_000));
  facts.push(`Removed in ${plural(days, "day")}`);
  return `<li class="card up">
${thumbnail(upload)}
<h3>${e(upload.name)}</h3>
<p class="muted meta">${e(facts.join(" \u00B7 "))}</p>
${upload.onSite ? `<p><span class="tag">On your site</span></p>` : ""}
<div class="up-actions">
<details class="rename">
<summary class="btn">Rename<span class="sr"> ${e(upload.name)}</span></summary>
<form class="rename-form" method="post" action="/owner/uploads/rename">
<input type="hidden" name="id" value="${e(upload.id)}">
<label for="rename-${e(upload.id)}">Name<span class="sr"> of ${e(upload.name)}</span></label>
<input type="text" id="rename-${e(upload.id)}" name="name" value="${e(upload.name)}" maxlength="80" autocomplete="off">
<button class="btn" type="submit" aria-label="Save name for ${e(upload.name)}">Save</button>
</form>
</details>
<a class="btn" href="/owner/uploads/remove?upload=${encodeURIComponent(upload.id)}" aria-label="Remove: ${e(upload.name)}">Remove</a>
</div>
</li>`;
}

function uploadsSection(section: UploadsSection): string {
  if (section.notSetUp) return `<h2>Your uploads</h2>\n<p>Uploads aren't set up on this site yet.</p>`;
  const { limits } = section;
  const nowMs = Date.parse(section.now);
  const results = section.results && section.results.length > 0
    ? `<div class="results" id="upload-results" tabindex="-1" role="${section.results.some((line) => !line.ok) ? "alert" : "status"}" aria-labelledby="upload-results-title"><h3 id="upload-results-title">Upload results</h3><ul class="plain" role="list">${section.results
        .map((line) => `<li>${line.ok ? e(line.message ? line.message.replace(/^Added /, "Uploaded ") : `Uploaded \u201C${line.name}\u201D.`) : `\u201C${e(line.name)}\u201D was not uploaded. ${e(line.message)}`}</li>`)
        .join("")}</ul></div>`
    : "";
  const items = section.items;
  const empty = items === null || items.length === 0;
  const list = items === null ? `<p>The uploads could not be loaded right now. Try again in a minute.</p>` : empty ? `<p id="upload-empty">Nothing uploaded yet.</p>` : "";
  return `<h2>Your uploads</h2>
${results}<form class="upload-form" id="upload-form" method="post" enctype="multipart/form-data" action="/owner/uploads">
<label for="upload-files">Choose photos or PDFs</label>
<input type="file" id="upload-files" name="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf" aria-describedby="upload-limits">
<p class="muted" id="upload-limits">Photos up to ${e(megabytes(limits.photoBytes))} MB and PDFs up to ${e(megabytes(limits.pdfBytes))} MB. Unused uploads are removed after ${e(String(limits.expireDays))} days. A PDF keeps its document properties, such as the author's name.</p>
<div><button class="btn primary" type="submit">Upload</button></div>
</form>
<div id="upload-progress" tabindex="-1"></div>
<p class="muted" id="upload-status" aria-live="polite"></p>
${list}
<ul class="uploads" id="upload-grid" role="list"${empty ? " hidden" : ""}>${items ? items.map((u) => uploadCard(u, nowMs)).join("\n") : ""}</ul>`;
}

export function renderOwnerHome(data: HomeData): string {
  const waiting =
    data.proposals === null
      ? `<p>The waiting list could not be loaded right now. Try again in a minute.</p>`
      : data.proposals.length === 0
        ? `<p>Nothing is waiting.</p>`
        : `<ul class="list" role="list">${data.proposals.map(proposalCard).join("\n")}</ul>`;
  const recent =
    data.changes === null
      ? `<p>The list of changes could not be loaded right now. Try again in a minute.</p>`
      : data.changes.length === 0
        ? `<p>No changes yet.</p>`
        : `<ol class="list" role="list">${data.changes.map(changeItem).join("\n")}</ol>`;
  const body = `<h1>Your site</h1>
<h2>Waiting for your yes</h2>
${waiting}
${data.uploads ? uploadsSection(data.uploads) : ""}
<h2>Recent changes</h2>
${recent}
<h2>Connect your AI app</h2>
<p>The connector address is <code>${e(data.siteUrl)}/mcp</code></p>
<p>For Claude: Settings, Connectors, Add custom connector, paste the address, Connect, sign in with the code sent to your email, then Allow.</p>
<p>Other AI apps that support connectors with sign-in work the same way.</p>
<h2>What you can change</h2>
<p>Ask your AI app: \u201CWhat can I change on my site?\u201D It will tell you what you can change by chatting, and what needs ${e(AGENCY_NAME)}.</p>`;
  const script = data.uploads && !data.uploads.notSetUp ? `\n<script src="/owner/uploads.js" defer></script>` : "";
  return wrap(data, "Owner page", body + script);
}

function confirmFiles(proposal: ProposalView): string {
  if (proposal.uploads.length === 0) return "";
  const tiles = proposal.uploads
    .map((u) => `<li>${thumbnail(u)}<p>${e(u.name)}</p></li>`)
    .join("");
  return `<h2>Photos and files in this change</h2>\n<ul class="files" role="list">${tiles}</ul>\n`;
}

export function renderRemoveConfirm(data: RemoveData): string {
  const u = data.upload;
  const body = `<h1>Remove \u201C${e(u.name)}\u201D?</h1>
<p>This can't be undone. Pages that already show it keep it.</p>
<ul class="files" role="list"><li>${thumbnail(u)}<p>${e(u.name)}</p></li></ul>
<div class="actions">
${postForm("/owner/uploads/remove", { upload: u.id }, "Remove", true)}
<a class="btn" href="/owner">Keep it</a>
</div>`;
  return wrap(data, "Remove this upload?", body);
}

export function renderConfirm(data: ConfirmData): string {
  const p = data.proposal;
  const body = `<h1>Publish this change?</h1>
<p>${e(p.summary)}</p>
${confirmFiles(p)}<h2>Changes in this proposal</h2>
<pre>${e(p.changeList)}</pre>
<div class="actions">
${postForm("/owner/publish", { proposal: p.id }, "Publish", true)}
${postForm("/owner/discard", { proposal: p.id }, "Discard", false)}
${previewLink(p)}
</div>
<p><a class="nav-link" href="/owner">Back to the owner page</a></p>`;
  return wrap(data, "Publish this change?", body);
}

export function renderConsent(data: ConsentData): string {
  const title = `Allow ${data.clientName} to edit ${data.siteName}?`;
  const domain = data.clientDomain ? `<p>Its verified domain is <strong>${e(data.clientDomain)}</strong>.</p>` : "";
  const warn = data.redirectIsLoopback
    ? `<p class="warn"><strong>Warning:</strong> this sends your sign-in to an app running on this computer. Only continue if you started it yourself.</p>`
    : "";
  const body = `<h1>${e(title)}</h1>
<p class="host">It will send its sign-in to ${e(data.redirectHost)}.</p>
${domain}
${warn}
<p>It can read your pages and propose changes. Nothing goes live until you say yes in the chat.</p>
<form method="post" action="/owner/connect">
<input type="hidden" name="handle" value="${e(data.handle)}">
<div class="actions">
<button class="btn primary" type="submit" name="decision" value="allow">Allow</button>
<button class="btn" type="submit" name="decision" value="deny">Don't allow</button>
</div>
</form>`;
  return wrap(data, title, body);
}

export function renderMessage(data: MessageData): string {
  const body = `<h1>${e(data.title)}</h1>
<p>${e(data.body).replace(/\n/g, "<br>")}</p>
<p><a class="nav-link" href="/owner">Back to the owner page</a></p>`;
  return wrap(data, data.title, body);
}
