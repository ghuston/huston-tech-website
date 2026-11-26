// /owner and /owner/connect: the owner page and the OAuth consent page. Every route needs the signed-in owner; every POST must
// come from this site's own form. A GET never changes anything.
import type { EditorConfig } from "../config.ts";
import { BASE_HEADERS } from "../http.ts";
import { readBody } from "../read-body.ts";
import { ownerFromRequest } from "./access.ts";
import { ownerKey } from "./owner-id.ts";
import { postUploads, uploadsAsset, uploadsJson } from "./owner-uploads.ts";
import {
  renderConfirm,
  renderConsent,
  renderMessage,
  renderOwnerHome,
  renderRemoveConfirm,
  type PageBase,
  type UploadLine,
  type UploadsSection,
  type ThemeColors,
} from "./owner-page.ts";
import { isObject } from "./json.ts";
import type { Editor } from "./types.ts";

interface AuthRequestLike {
  scope: string[];
}
interface ConsentDescriptionLike {
  clientName: string;
  clientDomain?: string;
  redirectUri: string;
  redirectHost: string;
  redirectIsLoopback: boolean;
}

/** The part of the OAuth library's helpers this page uses (a structural subset, so Node tests need not load the library). */
export interface OAuthHelpersLike {
  parseAuthRequest(request: Request): Promise<AuthRequestLike>;
  describeConsent(authRequest: AuthRequestLike): Promise<ConsentDescriptionLike>;
  beginConsent(authRequest: AuthRequestLike): Promise<{ handle: string; headers: Headers }>;
  approveConsent(request: Request, handle: string): Promise<{ request: AuthRequestLike; headers: Headers }>;
  denyConsent(request: Request, handle: string): Promise<{ request: AuthRequestLike; redirectTo: string; headers: Headers }>;
  completeAuthorization(options: {
    request: AuthRequestLike;
    userId: string;
    metadata: unknown;
    scope: string[];
    props: unknown;
  }): Promise<{ redirectTo: string }>;
}

export interface OwnerContext {
  editor: Editor;
  config: EditorConfig;
  oauth: OAuthHelpersLike;
  theme: ThemeColors;
  rateLimit?: RateLimit;
  fetch?: typeof fetch;
  now?: () => Date;
}

const MAX_BODY = 8 * 1024;
const PUBLISH_WORDS = "Approved on the owner page by the signed-in owner.";
const BASE_CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";

/** Only the home page runs a script (the upload form's progress), from this site's own origin and talking only to it. */
const HOME_CSP = BASE_CSP.replace("default-src 'none';", "default-src 'none'; script-src 'self'; connect-src 'self';");

function pageHeaders(formAction?: string, csp = BASE_CSP): Headers {
  csp = formAction ? csp.replace("form-action 'self'", `form-action 'self' ${formAction}`) : csp;
  return new Headers({
    ...BASE_HEADERS,
    "content-type": "text/html; charset=utf-8",
    "referrer-policy": "no-referrer",
    "content-security-policy": csp,
  });
}

function html(body: string, status = 200, headers: Headers = pageHeaders()): Response {
  return new Response(body, { status, headers });
}

/** The origin a consent form may post to: https origins as is, and http only for a loopback app. */
function formActionFor(redirectUri: string, loopback: boolean): string | undefined {
  try {
    const url = new URL(redirectUri);
    if (url.protocol === "https:") return url.origin;
    if (url.protocol === "http:" && loopback) return url.origin;
  } catch {
    // A private-use scheme such as com.example.app:/callback has no origin to allow.
  }
  return undefined;
}

export async function handleOwner(request: Request, ctx: OwnerContext): Promise<Response> {
  const { editor, config } = ctx;
  const owner = await ownerFromRequest(request, config, ctx.fetch);
  if (owner instanceof Response) return owner;

  const base: PageBase = { siteName: config.siteName, siteUrl: config.siteUrl, email: owner.email, theme: ctx.theme };
  const message = (title: string, body: string, status = 200): Response => html(renderMessage({ ...base, title, body }), status);

  if (ctx.rateLimit) {
    const { success } = await ctx.rateLimit.limit({ key: `user:${await ownerKey(owner.email)}` });
    if (!success) return message("Too many requests", "Slow down for a minute, then try again.", 429);
  }

  const url = new URL(request.url);
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  const routes: Record<string, string[]> = {
    "/owner": ["GET"],
    "/owner/publish": ["GET", "POST"],
    "/owner/discard": ["POST"],
    "/owner/uploads": ["POST"],
    "/owner/uploads/rename": ["POST"],
    "/owner/uploads/remove": ["GET", "POST"],
    "/owner/undo": ["POST"],
    "/owner/connect": ["GET", "POST"],
  };
  const allowed = routes[path];
  if (request.method === "GET" && (path === "/owner/uploads.js" || path.startsWith("/owner/uploads/"))) {
    const asset = await uploadsAsset(path, editor);
    if (asset) return asset;
  }
  if (!allowed) return message("Page not found", "There is nothing at this address.", 404);
  const method = request.method === "HEAD" ? "GET" : request.method;
  if (!allowed.includes(method)) {
    const response = message("Method not allowed", "That is not something this page does.", 405);
    response.headers.set("allow", allowed.join(", "));
    return response;
  }

  const now = ctx.now ?? (() => new Date());
  const home = async (results?: UploadLine[], status = 200): Promise<Response> => {
    const [waiting, recent, uploaded] = await Promise.all([editor.waiting(), editor.recent(), editor.uploads()]);
    const limits = { photoBytes: config.uploads.maxPhotoBytes, pdfBytes: config.uploads.maxPdfBytes, expireDays: config.uploads.expireDays };
    const uploads: UploadsSection = {
      items: uploaded.isError ? null : uploaded.data,
      limits,
      now: now().toISOString(),
      ...(uploaded.isError && uploaded.text.startsWith("Uploads aren't set up") ? { notSetUp: true } : {}),
      ...(results ? { results } : {}),
    };
    return html(
      renderOwnerHome({ ...base, proposals: waiting.isError ? null : waiting.data, changes: recent.isError ? null : recent.data, uploads }),
      status,
      pageHeaders(undefined, HOME_CSP),
    );
  };

  let form: URLSearchParams | null = null;
  if (method === "POST") {
    const refuse = (): Response => message("Not allowed", "That form didn't come from this page.", 403);
    const site = request.headers.get("Sec-Fetch-Site");
    if (request.headers.get("Origin") !== config.siteUrl || (site !== null && site !== "same-origin")) return refuse();
    if (path === "/owner/uploads") {
      if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("multipart/form-data")) return refuse();
      const post = await postUploads(request, editor, config.uploads);
      if ((request.headers.get("accept") ?? "").includes("application/json")) return uploadsJson(post);
      if (post.kind === "refused") return home([{ name: "Upload", ok: false, message: post.message }], post.status === 413 ? 413 : 400);
      return home(post.results, post.ok ? 200 : 400);
    }
    if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/x-www-form-urlencoded")) return refuse();
    if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return refuse();
    const raw = await readBody(request, MAX_BODY);
    if (raw === null) return refuse();
    form = new URLSearchParams(raw);
  }

  const field = (name: string): string => form?.get(name) ?? "";

  if (path === "/owner") return home();

  if (path === "/owner/uploads/remove" && method === "GET") {
    const id = url.searchParams.get("upload") ?? "";
    const listed = await editor.uploads();
    const upload = listed.isError ? undefined : listed.data.find((u) => u.id === id);
    if (!upload) return message("Nothing to remove", "That upload isn't in your uploads any more. It may have been removed or have expired.", 404);
    return html(renderRemoveConfirm({ ...base, upload }));
  }

  if (path === "/owner/uploads/remove") {
    const result = await editor.removeUpload(field("upload"));
    return message(result.isError ? "Could not remove" : "Removed", result.text, result.isError ? 400 : 200);
  }

  if (path === "/owner/uploads/rename") {
    const result = await editor.renameUpload(field("id"), field("name"));
    return message(result.isError ? "Could not rename" : "Renamed", result.text, result.isError ? 400 : 200);
  }

  if (path === "/owner/publish" && method === "GET") {
    const id = url.searchParams.get("proposal") ?? "";
    const result = await editor.waiting();
    const proposal = result.isError ? undefined : result.data.find((p) => p.id === id);
    if (!proposal) return message("Nothing to publish", "That change is not waiting any more. It may already be published or discarded.", 404);
    return html(renderConfirm({ ...base, proposal }));
  }

  if (path === "/owner/publish") {
    const result = await editor.publish(field("proposal"), PUBLISH_WORDS, owner);
    return message(result.isError ? "Could not publish" : "Published", result.text, result.isError ? 400 : 200);
  }

  if (path === "/owner/discard") {
    const result = await editor.discard(field("proposal"));
    return message(result.isError ? "Could not discard" : "Discarded", result.text, result.isError ? 400 : 200);
  }

  if (path === "/owner/undo") {
    const number = Number(field("change"));
    const result = await editor.undo(number, owner);
    const id = isObject(result.data) ? result.data.proposal_id : undefined;
    if (!result.isError && typeof id === "string") {
      return new Response(null, { status: 303, headers: { ...BASE_HEADERS, location: `/owner/publish?proposal=${encodeURIComponent(id)}` } });
    }
    return message(result.isError ? "Could not undo" : "Nothing to undo", result.text, result.isError ? 400 : 200);
  }

  return connect(request, ctx, base, form, owner.email, message);
}

const EXPIRED = "This sign-in link has expired or was already used. Start again from your AI app.";

async function connect(
  request: Request,
  ctx: OwnerContext,
  base: PageBase,
  form: URLSearchParams | null,
  email: string,
  message: (title: string, body: string, status?: number) => Response,
): Promise<Response> {
  const { oauth } = ctx;
  if (form === null) {
    try {
      const authRequest = await oauth.parseAuthRequest(request);
      const description = await oauth.describeConsent(authRequest);
      const transaction = await oauth.beginConsent(authRequest);
      const headers = pageHeaders(formActionFor(description.redirectUri, description.redirectIsLoopback));
      transaction.headers.forEach((value, name) => {
        if (name.toLowerCase() === "set-cookie") headers.append(name, value);
        else if (!headers.has(name)) headers.set(name, value);
      });
      const page = renderConsent({
        ...base,
        handle: transaction.handle,
        clientName: description.clientName,
        ...(description.clientDomain ? { clientDomain: description.clientDomain } : {}),
        redirectHost: description.redirectHost,
        redirectIsLoopback: description.redirectIsLoopback,
      });
      return html(page, 200, headers);
    } catch {
      return message("Can't sign in", "This sign-in link isn't valid. Start again from your AI app.", 400);
    }
  }

  const handle = form.get("handle") ?? "";
  try {
    if (form.get("decision") === "allow") {
      const approved = await oauth.approveConsent(request, handle);
      const description = await oauth.describeConsent(approved.request);
      const { redirectTo } = await oauth.completeAuthorization({
        request: approved.request,
        userId: await ownerKey(email),
        metadata: { label: description.clientName },
        scope: approved.request.scope,
        props: { email },
      });
      return redirect(redirectTo, approved.headers);
    }
    const denied = await oauth.denyConsent(request, handle);
    return redirect(denied.redirectTo, denied.headers);
  } catch {
    return message("Sign-in expired", EXPIRED, 400);
  }
}

function redirect(location: string, source: Headers): Response {
  const headers = new Headers(source);
  headers.set("location", location);
  for (const [name, value] of Object.entries(BASE_HEADERS)) headers.set(name, value);
  return new Response(null, { status: 302, headers });
}
