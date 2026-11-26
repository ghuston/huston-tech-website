import type { UploadStore } from "../uploads/store.ts";
import { pageValueFor, uploadRepoPath } from "../uploads/paths.ts";
import type { UploadKind, UploadRecord } from "../uploads/types.ts";
import { isObject } from "./json.ts";

/**
 * Turns the `upload:<id>` references an AI app writes into real repo paths. Photos go only in an image's `src`, PDFs only
 * in a link's `href`. Nothing here reads file bytes: the proposal keeps references, and the bytes are read from the inbox
 * when a preview or a publish commits them.
 */

const REF = /^upload:([a-z0-9]{8})$/;
const DAY_MS = 86_400_000;
/** An upload must outlive the proposal (3 days), so a waiting proposal never loses its file to expiry. */
const MIN_DAYS_LEFT = 3;

export interface ProposalUpload {
  id: string;
  kind: UploadKind;
  /** The path in the repo, for example public/images/uploads/<id>.webp. */
  path: string;
  name: string;
  sha256: string;
  bytes: number;
  width?: number;
  height?: number;
}

export type ResolvedUploads =
  | { ok: true; after: Map<string, unknown>; uploads: ProposalUpload[]; names: Map<string, string> }
  | { ok: false; problems: string[] };

export const hasUploadRef = (value: unknown): boolean => {
  if (typeof value === "string") return REF.test(value);
  if (Array.isArray(value)) return value.some(hasUploadRef);
  return isObject(value) && Object.values(value).some(hasUploadRef);
};

/** How a document key reads in a refusal: pages are "/path", items "item:posts/slug", settings "settings:brand". */
const labelOf = (key: string): string =>
  key.startsWith("item:") ? `Item ${key.slice(5)}` : key.startsWith("settings:") ? `The ${key.slice(9)} settings` : key.startsWith("form:") ? `Form ${key.slice(5)}` : `Page ${key}`;

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

export async function resolveUploads(
  after: ReadonlyMap<string, unknown>,
  touched: readonly string[],
  store: UploadStore,
  now: Date,
): Promise<ResolvedUploads> {
  const problems = new Set<string>();
  const records = new Map<string, UploadRecord | null>();
  const used = new Map<string, ProposalUpload>();
  const names = new Map<string, string>();
  const resolved = new Map(after);

  const recordFor = async (id: string): Promise<UploadRecord | null> => {
    if (!records.has(id)) records.set(id, await store.get(id));
    return records.get(id) ?? null;
  };

  /** The page value for a reference, or the original string when a problem was recorded. */
  async function swap(page: string, id: string, original: string, slot: string): Promise<string> {
    const record = await recordFor(id);
    if (!record) {
      problems.add(`There is no upload ${id}. Use list_uploads to see what the owner uploaded.`);
      return original;
    }
    const left = Date.parse(record.expiresAt) - now.getTime();
    if (left < MIN_DAYS_LEFT * DAY_MS) {
      problems.add(`Upload ${id}: This upload leaves your inbox in ${days(Math.max(0, Math.ceil(left / DAY_MS)))}; upload it again so it can wait for the owner's yes.`);
      return original;
    }
    if (record.kind === "pdf" && slot === "src") {
      problems.add(`${labelOf(page)}: upload ${id} is a PDF; a PDF goes in a link, not in a photo's place.`);
      return original;
    }
    if (record.kind === "photo" && slot === "href") {
      problems.add(`${labelOf(page)}: upload ${id} is a photo; a photo goes in a photo's place, not in a link.`);
      return original;
    }
    const path = uploadRepoPath(record);
    const value = pageValueFor(path);
    if (!used.has(id)) {
      used.set(id, {
        id,
        kind: record.kind,
        path,
        name: record.name,
        sha256: record.sha256,
        bytes: record.bytes,
        ...(record.width !== undefined ? { width: record.width } : {}),
        ...(record.height !== undefined ? { height: record.height } : {}),
      });
    }
    if (record.kind === "photo") names.set(value, record.name);
    return value;
  }

  async function walk(page: string, value: unknown): Promise<unknown> {
    if (Array.isArray(value)) return Promise.all(value.map((item) => walk(page, item)));
    if (!isObject(value)) return value;
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      const match = typeof item === "string" && (key === "src" || key === "href") ? REF.exec(item) : null;
      out[key] = match ? await swap(page, match[1], item as string, key) : await walk(page, item);
    }
    return out;
  }

  for (const path of touched) {
    if (!after.has(path)) continue;
    resolved.set(path, await walk(path, after.get(path)));
  }
  if (problems.size > 0) return { ok: false, problems: [...problems] };
  return { ok: true, after: resolved, uploads: [...used.values()], names };
}
