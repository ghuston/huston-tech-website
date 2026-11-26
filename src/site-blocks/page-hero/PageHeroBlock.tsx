import { PageHeroInner } from "@/components/hl/PageHero";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { pageHeroDefinition } from "./definition";

/** The inner-page hero. The renderer's hero rhythm is its padding, so the glow and ring sit against the wrapper's padded box. */
export function PageHeroBlock({ content }: BlockProps<ContentOf<typeof pageHeroDefinition.fields>>) {
  return (
    <section>
      <PageHeroInner ringOnTop eyebrow={content.eyebrow} title={content.title} intro={content.intro} />
    </section>
  );
}
