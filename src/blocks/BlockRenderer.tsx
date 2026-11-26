import type { ComponentType } from "react";
import { Glow } from "@/components/hl/Glow";
import type { LoadedItem } from "@/collections/schema";
import type { BusinessData } from "@/settings/business";
import { getItems } from "@/lib/collections";
import { blockComponents } from "./components";
import { EnterObserver } from "./EnterObserver";
import { registry } from "./definitions";
import { spacingFor } from "./rhythm";
import type { AnyBlockDefinition, BlockInstance } from "./schema";
import type { BlockProps } from "./types";

type AnyProps = BlockProps<Record<string, unknown>>;

const definitions = new Map<string, AnyBlockDefinition>(registry.map((def) => [def.type, def]));

type BlockViewProps = {
  block: BlockInstance;
  /** Where the block sits on its page: the first block never animates and is the page's H1. */
  index: number;
  /** The definition of the block just above this one, for spacing that joins the hero. */
  previous?: AnyBlockDefinition;
  /** True when this block holds the page's single H1. */
  primary: boolean;
  /** The items of the block's collection, when it lists one. The renderer resolves them; the showcase passes examples. */
  items?: readonly LoadedItem[];
  /** The page of a paged list this view shows (/blog/page/<n>). */
  page?: number;
  /** Business details for the business-details block when they are not business.json (the showcase's example). */
  business?: BusinessData;
};

/**
 * One block in its wrapper, which owns the spacing (rhythm.ts), the glows and the entrance motion, so a block's
 * component carries none of those. The page renderer and the /blocks showcase both build blocks with this.
 */
export function BlockView({ block, index, previous, primary, items = [], page, business }: BlockViewProps) {
  const def = definitions.get(block.type);
  const Component = blockComponents[block.type] as ComponentType<AnyProps> | undefined;
  if (!def || !Component) throw new Error(`The block type "${block.type}" has no definition or component.`);
  const anchor = block.anchor ?? def.fixedAnchor;
  const headingId = `${anchor ?? `block-${index}`}-title`;
  const animated = index > 0 && def.motion.entrance !== "none";
  return (
    <div className={`relative ${spacingFor(def, index, previous)}`} data-block={block.type} data-motion={animated ? "enter" : undefined}>
      {def.placement.position === "first" ? <Glow variant="green" className="hl-glow-hero" /> : null}
      {def.placement.position === "last" ? <Glow variant="seam" className="hl-glow-closing" /> : null}
      <Component content={block.content} variant={block.variant ?? def.variants[0]?.name ?? "default"} anchor={anchor} headingId={headingId} primary={primary} items={items} page={page} business={business} />
    </div>
  );
}

/**
 * Builds a page's blocks, in order. The content was checked at build time (lib/pages.ts). A list block gets the visible
 * items of its collection and is left out of the page when it has none (no heading over nothing), except the post
 * index, which shows its own empty text. `page` is the page of the post index to show (/blog/page/<n>).
 */
export function BlockRenderer({ blocks, page }: { blocks: readonly BlockInstance[]; page?: number }) {
  const shown = blocks.flatMap((block) => {
    const def = definitions.get(block.type);
    const items = def?.collection === undefined ? [] : getItems(def.collection);
    return def?.collection !== undefined && items.length === 0 && def.type !== "post-index" ? [] : [{ block, items }];
  });
  return (
    <div className="relative overflow-x-clip">
      {shown.map(({ block, items }, index) => (
        <BlockView
          key={index}
          block={block}
          index={index}
          previous={index > 0 ? definitions.get(shown[index - 1]?.block.type ?? "") : undefined}
          primary={index === 0}
          items={items}
          page={page}
        />
      ))}
      <EnterObserver />
    </div>
  );
}
