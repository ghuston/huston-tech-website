import type { ReactNode } from "react";
import type { LoadedItem } from "../collections/schema.ts";
import type { BusinessData } from "../settings/business.ts";

/** What the renderer hands every block component. `content` is already checked against the block's fields. */
export type BlockProps<C> = {
  content: C;
  /** The chosen variant name (the block's first variant when the page names none). */
  variant: string;
  /** The page-chosen anchor, or the block's fixed one; a block puts it on its section as the id. */
  anchor?: string;
  /** The id for the block's heading, for `aria-labelledby`. */
  headingId: string;
  /** True when this block holds the page's single H1 (the first block). */
  primary: boolean;
  /** The visible items of the block's collection (see `collection` in its definition), in the collection's order. Always passed; empty for a block that lists nothing. */
  items: readonly LoadedItem[];
  /** Business details to show instead of business.json: the /blocks showcase passes example ones. */
  business?: BusinessData;
  /** The page of a paged list this view shows (1 and up), for the post index on /blog/page/<n>. */
  page?: number;
};

/** Any block component. `never` lets each component keep its own content type. */
export type BlockComponent = (props: BlockProps<never>) => ReactNode;
