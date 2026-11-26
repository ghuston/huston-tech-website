// Reads the page files (src/content/pages/*.json). Used by Next (build), the scripts, Playwright and Lighthouse CI, so it
// takes the repo root from process.cwd() and uses no aliases.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PageData } from "../blocks/schema.ts";

export { pathForFile } from "../blocks/schema.ts";

export const PAGES_DIR = "src/content/pages";

export type PageFileResult = { file: string; data: unknown; error?: string };

function readOne(dir: string, file: string): PageFileResult {
  let text: string;
  try {
    text = readFileSync(join(dir, file), "utf8");
  } catch (cause) {
    return { file, data: undefined, error: `could not be read (${cause instanceof Error ? cause.message : String(cause)}).` };
  }
  text = text.replace(/^﻿/, "");
  if (text.trim() === "") return { file, data: undefined, error: "is empty. A page file holds one JSON object." };
  try {
    return { file, data: JSON.parse(text) as unknown };
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    return { file, data: undefined, error: `is not valid JSON (${reason}). Look for a missing or extra comma, quote or bracket.` };
  }
}

/** Every *.json in the pages folder, sorted by file name. A missing folder gives []. A bad file carries an `error`. */
export function readPageFiles(root: string = process.cwd()): PageFileResult[] {
  const dir = join(root, PAGES_DIR);
  let names: string[];
  try {
    names = readdirSync(dir).filter((name) => name.endsWith(".json"));
  } catch {
    return [];
  }
  names.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return names.map((name) => readOne(dir, name));
}

/** The live pages, in file order. Shape is not checked here; run the content check first. */
export function livePages(root: string = process.cwd()): PageData[] {
  const pages: PageData[] = [];
  for (const { data, error } of readPageFiles(root)) {
    if (error === undefined && typeof data === "object" && data !== null && (data as { status?: unknown }).status === "live") pages.push(data as PageData);
  }
  return pages;
}
