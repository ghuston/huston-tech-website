// The owner page's upload routes: the multipart post (the only route that accepts multipart), the thumbnails and the
// script. Called from owner-routes.ts after the owner check, the rate limit and, for a POST, the same-origin check.
import { BASE_HEADERS, jsonResponse, plainText } from "../http.ts";
import { readBytes } from "../read-body.ts";
import { CHOOSE_FIRST, NOT_RECEIVED, tooMuchAtOnce } from "../uploads/messages.ts";
import type { UploadLine } from "./owner-page.ts";
import type { Editor } from "./types.ts";
import { UPLOADS_SCRIPT } from "./uploads-script.ts";

/** Room for the form's own parts on top of the biggest file. */
const FORM_OVERHEAD = 1_000_000;
const PREVIEW_PATH = /^\/owner\/uploads\/([a-z0-9]{8})\/preview$/;
const CACHE = "private, max-age=300";

export interface UploadLimits {
  maxPhotoBytes: number;
  maxPdfBytes: number;
}

export const uploadsBodyCap = (limits: UploadLimits): number => Math.max(limits.maxPhotoBytes, limits.maxPdfBytes) + FORM_OVERHEAD;

/** GET /owner/uploads.js and GET /owner/uploads/<id>/preview, or null when the path is neither. */
export async function uploadsAsset(path: string, editor: Editor): Promise<Response | null> {
  if (path === "/owner/uploads.js") {
    return new Response(UPLOADS_SCRIPT, { headers: { ...BASE_HEADERS, "content-type": "application/javascript; charset=utf-8", "cache-control": CACHE } });
  }
  const match = PREVIEW_PATH.exec(path);
  if (!match) return null;
  const bytes = await editor.uploadPreview(match[1]);
  if (!bytes) return plainText(404, "Not found");
  return new Response(bytes as Uint8Array<ArrayBuffer>, { headers: { ...BASE_HEADERS, "content-type": "image/jpeg", "cache-control": CACHE } });
}

export type UploadsPost =
  | { kind: "refused"; message: string; status: number }
  | { kind: "done"; results: UploadLine[]; ok: boolean; upload: unknown; message: string };

/**
 * Reads the body under the cap and returns its file parts. The raw body lives only inside this function, so it can be
 * freed before any file is converted. "too_big" and "unreadable" are the refusals.
 */
async function readFiles(request: Request, cap: number): Promise<File[] | "too_big" | "unreadable"> {
  const bytes = await readBytes(request, cap);
  if (bytes === null) return "too_big";
  try {
    const form = await new Response(bytes as Uint8Array<ArrayBuffer>, { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
    // A browser sends an empty part with no name when nothing was chosen.
    return form.getAll("file").filter((part): part is File => typeof part !== "string" && part.size > 0);
  } catch {
    return "unreadable";
  }
}

/** Reads a multipart post under the size cap and adds each file. Never buffers more than the cap. */
export async function postUploads(request: Request, editor: Editor, limits: UploadLimits): Promise<UploadsPost> {
  const cap = uploadsBodyCap(limits);
  const tooMuch: UploadsPost = { kind: "refused", message: tooMuchAtOnce(cap), status: 413 };
  // A missing or unreadable content-length (NaN) is unknown: the capped reader below is what enforces the limit.
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > cap) return tooMuch;
  const files = await readFiles(request, cap);
  if (files === "too_big") return tooMuch;
  if (files === "unreadable") return { kind: "refused", message: NOT_RECEIVED, status: 400 };
  if (files.length === 0) return { kind: "refused", message: CHOOSE_FIRST, status: 400 };

  const results: UploadLine[] = [];
  let first: { ok: boolean; message: string; upload: unknown } | null = null;
  for (const file of files) {
    // One copy of each file's bytes at a time; the store and the converter read it in place.
    const added = await editor.addUpload(new Uint8Array(await file.arrayBuffer()), file.name);
    const line = { name: file.name, ok: !added.isError, message: added.text };
    results.push(line);
    first ??= { ok: line.ok, message: line.message, upload: added.data };
  }
  return { kind: "done", results, ok: results.some((line) => line.ok), upload: first?.upload ?? null, message: first?.message ?? "" };
}

export function uploadsJson(post: UploadsPost): Response {
  if (post.kind === "refused") return jsonResponse(post.status, { ok: false, message: post.message, upload: null });
  const ok = post.results[0]?.ok === true;
  return jsonResponse(ok ? 200 : 400, { ok, message: post.message, upload: ok ? post.upload : null, results: post.results });
}
