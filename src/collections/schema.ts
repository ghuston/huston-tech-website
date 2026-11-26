// Collections: items of one kind (posts, videos, episodes, testimonials, team), one JSON file each. Import-free apart from
// a type import, so Node scripts, Next and the Worker share it.
import type { Fields } from "../blocks/schema.ts";

export const COLLECTION_KINDS = ["posts", "videos", "episodes", "testimonials", "team"] as const;
export type CollectionKind = (typeof COLLECTION_KINDS)[number];

/** `draft` is built only outside production; `archived` is never shown and never deleted. */
export const ITEM_STATUSES = ["draft", "live", "archived"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

/** A slug is the file name and the address: lowercase words and digits joined by hyphens, 1 to 60 characters. */
export const SLUG_RE = /^(?=.{1,60}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX = 60;
/** Post slugs the blog's own routes (/blog/page/2, /blog/feed.xml) already use. */
export const RESERVED_POST_SLUGS = ["page", "feed"] as const;

export const ITEM_DIR = "src/content/collections";

/** The repo path of an item's file. */
export function itemFilePath(kind: string, slug: string): string {
  return `${ITEM_DIR}/${kind}/${slug}.json`;
}

/** An item file as read from disk: `data` is the parsed JSON, `error` says why it could not be read. */
export type ItemFile = { kind: string; slug: string; data: unknown; error?: string };

/** An item that passed the content check: the status split from the fields. */
export type LoadedItem = { kind: CollectionKind; slug: string; status: ItemStatus; data: Record<string, unknown> };

export type CollectionDefinition = {
  kind: CollectionKind;
  title: string;
  singular: string;
  description: string;
  fields: Fields;
  /** `date`: newest first. `order`: the item's `order` field, then its label. */
  sort: "date" | "order";
  /** The field that names an item in lists and change lists. */
  labelField: string;
  /** Example items (live), so list blocks can show a full list in the showcase. */
  example: readonly LoadedItem[];
};
