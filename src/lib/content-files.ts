// Reads the collection item files (src/content/collections/<kind>/<slug>.json) and the settings files
// (src/content/business.json, brand.json, notice.json). Plain Node loadable like page-files.ts: root from process.cwd(),
// relative .ts imports, no aliases.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ITEM_DIR } from "../collections/schema.ts";
import type { ItemFile } from "../collections/schema.ts";
import { FORM_DIR } from "../forms/schema.ts";
import type { FormFile } from "../forms/schema.ts";

import type { SettingsName } from "../settings/names.ts";

export type SettingsFileName = SettingsName;
export type SettingsFileResult = { data: unknown; error?: string };

const byName = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function readJson(path: string): { data: unknown; error?: string } {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (cause) {
    return { data: undefined, error: `could not be read (${cause instanceof Error ? cause.message : String(cause)}).` };
  }
  text = text.replace(/^﻿/, "");
  if (text.trim() === "") return { data: undefined, error: "is empty. The file holds one JSON object." };
  try {
    return { data: JSON.parse(text) as unknown };
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    return { data: undefined, error: `is not valid JSON (${reason}). Look for a missing or extra comma, quote or bracket.` };
  }
}

/** Every item file, folder by folder (kinds sorted, then slugs sorted). A missing folder gives []. A bad file carries an `error`. */
export function readItemFiles(root: string = process.cwd()): ItemFile[] {
  const base = join(root, ITEM_DIR);
  let kinds: string[];
  try {
    kinds = readdirSync(base, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
  kinds.sort(byName);
  const out: ItemFile[] = [];
  for (const kind of kinds) {
    const names = readdirSync(join(base, kind)).filter((name) => name.endsWith(".json")).sort(byName);
    for (const name of names) {
      const { data, error } = readJson(join(base, kind, name));
      out.push({ kind, slug: name.slice(0, -".json".length), data, ...(error !== undefined ? { error } : {}) });
    }
  }
  return out;
}

/** The three settings files. A missing file has `data: undefined` and no error; the site check reports it as missing. */
export function readSettingsFiles(root: string = process.cwd()): Record<SettingsFileName, SettingsFileResult> {
  const read = (name: SettingsFileName): SettingsFileResult => {
    const path = join(root, "src", "content", `${name}.json`);
    return existsSync(path) ? readJson(path) : { data: undefined };
  };
  return { business: read("business"), brand: read("brand"), notice: read("notice") };
}

/** Every form file (src/content/forms/<id>.json), sorted by id. A missing folder gives []. A bad file carries an `error`. */
export function readFormFiles(root: string = process.cwd()): FormFile[] {
  const base = join(root, FORM_DIR);
  let names: string[];
  try {
    names = readdirSync(base).filter((name) => name.endsWith(".json")).sort(byName);
  } catch {
    return [];
  }
  return names.map((name) => {
    const { data, error } = readJson(join(base, name));
    return { id: name.slice(0, -".json".length), data, ...(error !== undefined ? { error } : {}) };
  });
}
