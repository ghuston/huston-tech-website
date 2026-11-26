// The visible items of one kind in that kind's order. Import-free apart from its siblings, so the build, the route list
// (src/lib/routes.ts) and the feed all order posts the same way.
import { collectionFor } from "./definitions.ts";
import type { CollectionKind, LoadedItem } from "./schema.ts";
import { sortItems, visibleItems } from "./validate.ts";

/** The visible items of one kind in that kind's order. Pure: the loaders pass the content and whether drafts show. */
export function pickItems(all: readonly LoadedItem[], kind: CollectionKind, drafts: boolean): LoadedItem[] {
  const def = collectionFor(kind);
  const ofKind = all.filter((item) => item.kind === kind);
  return def === undefined ? [] : sortItems(def, visibleItems(ofKind, { drafts }));
}

/** One visible item by slug. Finds before it sorts: a single item needs no order. */
export function findItem(all: readonly LoadedItem[], kind: CollectionKind, slug: string, drafts: boolean): LoadedItem | undefined {
  return visibleItems(
    all.filter((item) => item.kind === kind && item.slug === slug),
    { drafts },
  )[0];
}
