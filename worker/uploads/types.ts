/** Shared shapes for the owner's upload inbox (docs/superpowers/specs/2026-11-25-uploads-and-photos-design.md). */

export type UploadKind = "photo" | "pdf";

/** What a file's first bytes say it is. */
export type FileKind = "jpeg" | "png" | "webp" | "heic" | "pdf";

export interface UploadRecord {
  id: string;
  name: string;
  kind: UploadKind;
  /** Size of the stored (converted) file. */
  bytes: number;
  width?: number;
  height?: number;
  pages?: number;
  /** ISO dates. */
  uploadedAt: string;
  expiresAt: string;
  sha256: string;
}

export type UploadResult = { ok: true; upload: UploadRecord } | { ok: false; message: string };

/** The `editor.uploads` block of site.config.ts. */
export interface UploadsConfig {
  enabled: boolean;
  bucket: string | null;
  maxPhotoBytes: number;
  maxPdfBytes: number;
  maxTotalBytes: number;
  maxPerDay: number;
  expireDays: number;
  types: FileKind[];
}
