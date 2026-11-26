import { Button } from "@/components/hl/Button";
import { HeroContent } from "@/components/hl/PageHero";
import { resolveHref } from "@/blocks/links";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { heroDefinition } from "./definition";

export function HeroBlock({ content, anchor, headingId, primary }: BlockProps<ContentOf<typeof heroDefinition.fields>>) {
  return (
    <section id={anchor} aria-labelledby={headingId} className="relative">
      <HeroContent eyebrow={content.eyebrow} title={content.title} intro={content.intro} headingLevel={primary ? "h1" : "h2"} headingId={headingId}>
        {content.action ? <Button href={resolveHref(content.action.href)}>{content.action.label}</Button> : null}
      </HeroContent>
    </section>
  );
}
