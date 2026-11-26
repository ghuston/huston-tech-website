import type { UploadRecord } from "./types.ts";

/** Lowercase letters, digits and single hyphens, at most 40 characters; "document" when nothing is left. */
export function pdfSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return slug || "document";
}

/** Where the upload's file goes in the repo. Photos are named by id only, so a name never becomes a public URL. */
export function uploadRepoPath(upload: UploadRecord): string {
  return upload.kind === "photo" ? `public/images/uploads/${upload.id}.webp` : `public/files/${pdfSlug(upload.name)}-${upload.id}.pdf`;
}

/** The value a page holds for a repo path: `public/` is dropped. */
export function pageValueFor(path: string): string {
  return path.replace(/^public(?=\/)/, "");
}
