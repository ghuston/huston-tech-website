import { SectionNav } from "@/components/hl/SectionNav";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { sectionNavDefinition } from "./definition";

/** Sticky, it sits directly in the page (the wrapper is `display: contents`), so it sticks for the whole page. Plain, it has the gap the Past Work page puts above it. */
export function SectionNavBlock({ content }: BlockProps<ContentOf<typeof sectionNavDefinition.fields>>) {
  const nav = <SectionNav sticky={content.sticky === true} label={content.label} items={content.items} />;
  return content.sticky ? nav : <div className="mt-8">{nav}</div>;
}
