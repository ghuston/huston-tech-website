// The content check for collection items, and the pure rules for sorting and showing them. Import-free apart from its
// siblings. Fields go through the block field validator, so limits, plain text, links and images have one set of rules.
import { validateFields } from "../blocks/validate.ts";
import type { Context } from "../blocks/validate.ts";
import { collectionFor } from "./definitions.ts";
import { COLLECTION_KINDS, ITEM_STATUSES, RESERVED_POST_SLUGS, SLUG_RE, itemFilePath } from "./schema.ts";
import type { CollectionDefinition, ItemFile, LoadedItem } from "./schema.ts";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** Judges item files. Problems come back as plain sentences naming the file; an empty list means the items are good. */
export function validateItems(items: readonly ItemFile[], ctx: Context): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const { kind, slug, data, error } of items) {
    const where = itemFilePath(kind, slug);
    if (error !== undefined) {
      out.push(`${where}: ${error}`);
      continue;
    }
    const def = collectionFor(kind);
    if (def === undefined) {
      out.push(`${where}: "${kind}" is not a collection. The collections are: ${COLLECTION_KINDS.join(", ")}.`);
      continue;
    }
    if (!SLUG_RE.test(slug)) out.push(`${where}: the slug "${slug}" must be lowercase words and digits joined by hyphens, 1 to 60 characters.`);
    else if (kind === "posts" && (RESERVED_POST_SLUGS as readonly string[]).includes(slug)) out.push(`${where}: the slug "${slug}" is reserved for the blog's own pages; choose another.`);
    const key = `${kind}/${slug}`;
    if (seen.has(key)) out.push(`${where}: the slug "${slug}" is used twice in ${kind}; every item needs its own slug.`);
    seen.add(key);

    if (!isRecord(data)) {
      out.push(`${where}: an item file must hold one object with "status" and the fields of ${def.singular}.`);
      continue;
    }
    const { status, ...fields } = data;
    if (status === undefined) out.push(`${where}: "status" is required (${ITEM_STATUSES.join(", ")}).`);
    else if (!(ITEM_STATUSES as readonly unknown[]).includes(status)) out.push(`${where}: "status" must be one of ${ITEM_STATUSES.join(", ")}.`);
    out.push(...validateFields(def.fields, fields, where, ctx));
    const { date, updated } = fields;
    if (typeof date === "string" && typeof updated === "string" && updated < date) out.push(`${where}: "updated" is before "date"; it can only be the same day or later.`);
  }
  return out;
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");
const orderOf = (value: unknown): number => (typeof value === "number" ? value : Number.MAX_SAFE_INTEGER);

/** A new list in the kind's order: `date` newest first, then slug; `order` lowest first, then label, then slug. */
export function sortItems(def: Pick<CollectionDefinition, "sort" | "labelField">, items: readonly LoadedItem[]): LoadedItem[] {
  const bySlug = (a: LoadedItem, b: LoadedItem) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);
  return [...items].sort((a, b) => {
    if (def.sort === "date") {
      const da = text(a.data["date"]);
      const db = text(b.data["date"]);
      return da === db ? bySlug(a, b) : da < db ? 1 : -1;
    }
    const byOrder = orderOf(a.data["order"]) - orderOf(b.data["order"]);
    if (byOrder !== 0) return byOrder;
    const byLabel = text(a.data[def.labelField]).localeCompare(text(b.data[def.labelField]), "en");
    return byLabel !== 0 ? byLabel : bySlug(a, b);
  });
}

/** The items a build shows: live ones, plus drafts when asked (never in a production build). Archived items never show. */
export function visibleItems(items: readonly LoadedItem[], options: { drafts: boolean }): LoadedItem[] {
  return items.filter((item) => item.status === "live" || (options.drafts && item.status === "draft"));
}
