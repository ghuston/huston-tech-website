import { log } from "../env.ts";
import { convertPhoto } from "./convert.ts";
import { detectKind } from "./kinds.ts";
import * as messages from "./messages.ts";
import { cleanLabel, cleanName } from "./names.ts";
import { checkPdf } from "./pdf.ts";
import type { UploadKind, UploadRecord, UploadResult, UploadsConfig } from "./types.ts";

const DAY_MS = 86_400_000;
const COUNTER_TTL = 2 * 24 * 60 * 60;
const SWEEP_LIMIT = 20;
const ID_RE = /^[a-z0-9]{8}$/;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export interface UploadStoreDeps {
  bucket: R2Bucket;
  images: ImagesBinding;
  kv: KVNamespace;
  config: UploadsConfig;
  now: () => Date;
  randomId?: () => string;
}

export interface UploadStore {
  add(bytes: Uint8Array, fileName: string): Promise<UploadResult>;
  /** Newest first, expired ones hidden (and swept). */
  list(): Promise<UploadRecord[]>;
  get(id: string): Promise<UploadRecord | null>;
  file(id: string): Promise<Uint8Array | null>;
  preview(id: string): Promise<Uint8Array | null>;
  rename(id: string, name: string): Promise<UploadResult>;
  remove(id: string): Promise<boolean>;
  /** Deletes expired uploads' objects, at most 20 a call. Returns how many were deleted. */
  sweep(): Promise<number>;
}

const fileKey = (id: string) => `inbox/${id}/file`;
const previewKey = (id: string) => `inbox/${id}/preview`;

function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function wholeNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : undefined;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** An upload from its R2 metadata, or null when the object is not one of ours. */
function toRecord(id: string, meta: Record<string, string> | undefined, expireDays: number): UploadRecord | null {
  if (!meta) return null;
  const { kind, name, uploadedAt, sha256 } = meta;
  const bytes = wholeNumber(meta.bytes);
  const uploaded = Date.parse(uploadedAt ?? "");
  if ((kind !== "photo" && kind !== "pdf") || name === undefined || bytes === undefined || Number.isNaN(uploaded) || !sha256) return null;
  const record: UploadRecord = {
    id,
    name: safeDecode(name),
    kind,
    bytes,
    uploadedAt: new Date(uploaded).toISOString(),
    expiresAt: new Date(uploaded + expireDays * DAY_MS).toISOString(),
    sha256,
  };
  const width = wholeNumber(meta.width);
  const height = wholeNumber(meta.height);
  const pages = wholeNumber(meta.pages);
  if (width !== undefined) record.width = width;
  if (height !== undefined) record.height = height;
  if (pages !== undefined) record.pages = pages;
  return record;
}

function metadataFor(upload: UploadRecord): Record<string, string> {
  const meta: Record<string, string> = {
    name: encodeURIComponent(upload.name),
    kind: upload.kind,
    bytes: String(upload.bytes),
    uploadedAt: upload.uploadedAt,
    sha256: upload.sha256,
  };
  if (upload.width !== undefined) meta.width = String(upload.width);
  if (upload.height !== undefined) meta.height = String(upload.height);
  if (upload.pages !== undefined) meta.pages = String(upload.pages);
  return meta;
}

export function createUploadStore(deps: UploadStoreDeps): UploadStore {
  const { bucket, images, kv, config, now } = deps;

  const expired = (record: UploadRecord) => Date.parse(record.expiresAt) <= now().getTime();

  /** Every upload (expired ones too), the stored bytes in the whole inbox, and the bytes each upload holds, from R2 lists. */
  async function scan(): Promise<{ records: UploadRecord[]; totalBytes: number; sizes: Map<string, number> }> {
    const records: UploadRecord[] = [];
    const sizes = new Map<string, number>();
    let totalBytes = 0;
    let cursor: string | undefined;
    do {
      const page = await bucket.list({ prefix: "inbox/", include: ["customMetadata"], ...(cursor ? { cursor } : {}) });
      for (const object of page.objects) {
        totalBytes += object.size;
        const owner = /^inbox\/([a-z0-9]{8})\//.exec(object.key);
        if (owner) sizes.set(owner[1], (sizes.get(owner[1]) ?? 0) + object.size);
        const match = /^inbox\/([a-z0-9]{8})\/file$/.exec(object.key);
        const record = match ? toRecord(match[1], object.customMetadata, config.expireDays) : null;
        if (record) records.push(record);
      }
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
    return { records, totalBytes, sizes };
  }

  /** Deletes up to 20 expired uploads and returns them. */
  async function deleteExpired(records: UploadRecord[]): Promise<UploadRecord[]> {
    const doomed = records.filter(expired).slice(0, SWEEP_LIMIT);
    for (const record of doomed) await bucket.delete([fileKey(record.id), previewKey(record.id)]);
    if (doomed.length > 0) log("uploads_swept", { count: doomed.length });
    return doomed;
  }

  async function load(id: string): Promise<UploadRecord | null> {
    if (!ID_RE.test(id)) return null;
    const head = await bucket.head(fileKey(id));
    const record = head ? toRecord(id, head.customMetadata, config.expireDays) : null;
    return record && !expired(record) ? record : null;
  }

  async function bytesOf(key: string): Promise<Uint8Array | null> {
    const object = await bucket.get(key);
    return object ? new Uint8Array(await object.arrayBuffer()) : null;
  }

  const store: UploadStore = {
    async add(bytes, fileName) {
      const at = now();
      const counterKey = `uploads:${at.toISOString().slice(0, 10)}`;
      // The daily cap and the inbox total are soft limits: they are read, then written, with no lock, so uploads that
      // run at the same moment can slightly overshoot either one.
      const today = Number(await kv.get(counterKey)) || 0;
      if (today >= config.maxPerDay) return { ok: false, message: messages.dailyCap(config.maxPerDay) };

      const detected = detectKind(bytes);
      if ("refused" in detected) {
        const text = { video: messages.VIDEO, gif: messages.GIF, code: messages.CODE, unsupported: messages.UNSUPPORTED }[detected.refused];
        return { ok: false, message: text };
      }
      if (!config.types.includes(detected.kind)) return { ok: false, message: messages.UNSUPPORTED };
      const kind: UploadKind = detected.kind === "pdf" ? "pdf" : "photo";
      const limit = kind === "pdf" ? config.maxPdfBytes : config.maxPhotoBytes;
      if (bytes.length > limit) {
        return { ok: false, message: kind === "pdf" ? messages.tooBigPdf(bytes.length, limit) : messages.tooBigPhoto(bytes.length, limit) };
      }

      let stored: Uint8Array;
      let preview: Uint8Array | null = null;
      let width: number | undefined;
      let height: number | undefined;
      let pages: number | undefined;
      // An attempt that reaches the conversion or the PDF check counts against the day, whether or not it is accepted,
      // so refused heavy photos cannot be retried without limit.
      await kv.put(counterKey, String(today + 1), { expirationTtl: COUNTER_TTL });
      if (kind === "photo") {
        const converted = await convertPhoto(images, bytes);
        if (!converted.ok) {
          const text = { not_image: messages.DAMAGED, damaged: messages.DAMAGED, too_detailed: messages.TOO_DETAILED, quota: messages.QUOTA }[converted.reason];
          return { ok: false, message: text };
        }
        stored = converted.web;
        preview = converted.preview;
        width = converted.width;
        height = converted.height;
      } else {
        const checked = checkPdf(bytes, config.maxPdfBytes);
        if (!checked.ok) {
          const text = { damaged: messages.DAMAGED, active: messages.PDF_ACTIVE, too_big: messages.tooBigPdf(bytes.length, config.maxPdfBytes) }[checked.reason];
          return { ok: false, message: text };
        }
        stored = bytes;
        pages = checked.pages;
      }

      const inbox = await scan();
      // Expired uploads are swept first so their space is not held against the owner (their bytes are subtracted, not re-scanned).
      const swept = await deleteExpired(inbox.records);
      const held = inbox.totalBytes - swept.reduce((sum, record) => sum + (inbox.sizes.get(record.id) ?? 0), 0);
      if (held + stored.length + (preview?.length ?? 0) > config.maxTotalBytes) return { ok: false, message: messages.inboxFull(config.maxTotalBytes) };

      let id = deps.randomId ? deps.randomId() : newId();
      if (!deps.randomId) {
        for (let tries = 0; tries < 5 && (await bucket.head(fileKey(id))); tries += 1) id = newId();
      }
      const upload: UploadRecord = {
        id,
        name: cleanName(fileName, kind),
        kind,
        bytes: stored.length,
        uploadedAt: at.toISOString(),
        expiresAt: new Date(at.getTime() + config.expireDays * DAY_MS).toISOString(),
        sha256: await sha256Hex(stored),
      };
      if (width !== undefined) upload.width = width;
      if (height !== undefined) upload.height = height;
      if (pages !== undefined) upload.pages = pages;

      try {
        if (preview) await bucket.put(previewKey(id), preview, { httpMetadata: { contentType: "image/jpeg" } });
        await bucket.put(fileKey(id), stored, {
          customMetadata: metadataFor(upload),
          httpMetadata: { contentType: kind === "photo" ? "image/webp" : "application/pdf" },
        });
      } catch {
        log("uploads_save_failed");
        await bucket.delete([fileKey(id), previewKey(id)]).catch(() => undefined);
        return { ok: false, message: messages.SAVE_FAILED };
      }
      log("uploads_added", { kind, bytes: stored.length });
      return { ok: true, upload };
    },

    async list() {
      const { records } = await scan();
      await deleteExpired(records);
      return records.filter((record) => !expired(record)).sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt) || (a.id < b.id ? 1 : -1));
    },

    get: load,

    async file(id) {
      return (await load(id)) ? bytesOf(fileKey(id)) : null;
    },

    async preview(id) {
      const record = await load(id);
      return record && record.kind === "photo" ? bytesOf(previewKey(id)) : null;
    },

    async rename(id, name) {
      const record = await load(id);
      const body = record ? await bytesOf(fileKey(id)) : null;
      if (!record || !body) return { ok: false, message: messages.NOT_FOUND };
      const upload = { ...record, name: cleanLabel(name, record.kind) };
      // The file may have been removed or swept while it was read; putting it back would bring a deleted upload back.
      if (!(await bucket.head(fileKey(id)))) return { ok: false, message: messages.NOT_FOUND };
      await bucket.put(fileKey(id), body, {
        customMetadata: metadataFor(upload),
        httpMetadata: { contentType: record.kind === "photo" ? "image/webp" : "application/pdf" },
      });
      return { ok: true, upload };
    },

    async remove(id) {
      if (!ID_RE.test(id) || !(await bucket.head(fileKey(id)))) return false;
      await bucket.delete([fileKey(id), previewKey(id)]);
      return true;
    },

    async sweep() {
      return (await deleteExpired((await scan()).records)).length;
    },
  };
  return store;
}
