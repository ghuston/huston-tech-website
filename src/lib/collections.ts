// The collection items a build shows. Server only. Drafts show outside production builds; archived items never show.
import type { CollectionKind, LoadedItem } from "../collections/schema.ts";
import { findItem, pickItems } from "../collections/pick.ts";
import { showDrafts } from "./drafts.ts";
import { getSiteContent } from "./site-content.ts";

export { pickItems };

export function getItems(kind: CollectionKind): LoadedItem[] {
  return pickItems(getSiteContent().items, kind, showDrafts());
}

export function getItem(kind: CollectionKind, slug: string): LoadedItem | undefined {
  return findItem(getSiteContent().items, kind, slug, showDrafts());
}
