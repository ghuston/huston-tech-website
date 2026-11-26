import type { Metadata } from "next";
import { BlockView } from "@/blocks/BlockRenderer";
import { collectionFor } from "@/collections/definitions";
import { EnterObserver } from "@/blocks/EnterObserver";
import { registry } from "@/blocks/definitions";
import type { AnyBlockDefinition, BlockInstance } from "@/blocks/schema";
import { Container } from "@/components/hl/Container";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { showcaseRoute } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";
import { exampleBusiness, showcase } from "@/content/showcase";

export const metadata: Metadata = pageMetadata({ title: showcase.title, description: showcase.description, path: showcaseRoute, noindex: true });

const heroBlock: BlockInstance = { type: "hero", content: { title: showcase.title, intro: showcase.intro } };

/**
 * A block's region is named by its heading, and several examples share a heading, which accessibility checks flag as
 * duplicate landmarks. An example whose heading was already shown names its block and variant in the heading.
 */
function exampleFor(def: AnyBlockDefinition, variantName: string, seen: Set<string>): Record<string, unknown> {
  const content = def.example as Record<string, unknown>;
  if (typeof content.heading !== "string") return content;
  const heading = seen.has(content.heading) ? `${content.heading} (${def.type}, ${variantName})` : content.heading;
  seen.add(content.heading);
  return { ...content, heading };
}

/** Every registered block in every variant, built from its own example content by the same wrapper pages use. A list block shows its kind's example items, so the page does not change when real items are added. */
export default function ShowcasePage() {
  const seenHeadings = new Set<string>();
  return (
    <div className="relative overflow-x-clip">
      <BlockView block={heroBlock} index={0} primary />
      {registry.flatMap((def) =>
        def.variants.map((variant) => {
          const block: BlockInstance = {
            type: def.type,
            variant: variant.name,
            anchor: def.fixedAnchor ? undefined : `showcase-${def.type}-${variant.name}`,
            content: exampleFor(def, variant.name, seenHeadings),
          };
          return (
            <div key={`${def.type}-${variant.name}`}>
              <Container className="mt-16">
                <p className="text-small text-ink-2">
                  {showcase.blockWord}: {def.title} ({def.type}) · {showcase.variantWord}: {variant.name}
                </p>
                <FadingDivider className="mt-2" />
              </Container>
              <BlockView block={block} index={1} primary={false} items={def.collection === undefined ? [] : (collectionFor(def.collection)?.example ?? [])} business={exampleBusiness} />
            </div>
          );
        }),
      )}
      <EnterObserver />
    </div>
  );
}
