import type { UploadKind } from "./types.ts";

const MAX_NAME = 80;

/** A name made plain: control and bracket characters removed, spaces collapsed, at most 80 characters, never empty. */
export function cleanLabel(text: string, kind: UploadKind): string {
  const plain = text
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, " ")
    .replace(/[[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME)
    .trim();
  return plain || (kind === "photo" ? "Photo" : "Document");
}

/** The display name for a new upload: the file name without its folder and extension, made plain. */
export function cleanName(fileName: string, kind: UploadKind): string {
  const base = fileName.split(/[\\/]/).pop() ?? "";
  return cleanLabel(base.replace(/\.[A-Za-z0-9]{1,5}$/, ""), kind);
}
