import { Button } from "@/components/hl/Button";
import { PageHeroInner } from "@/components/hl/PageHero";
import { TextLink } from "@/components/hl/TextLink";
import { bookCallHref } from "@/components/ui/BookCallButton";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { pageHeroDefinition } from "./definition";

/** The inner-page hero. The renderer's hero rhythm is its padding, so the glow and ring sit against the wrapper's padded box. */
export function PageHeroBlock({ content, primary }: BlockProps<ContentOf<typeof pageHeroDefinition.fields>>) {
  const intro = content.introLink ? (
    <>
      {content.intro}
      <TextLink inline href={content.introLink.href}>
        {content.introLink.label}
      </TextLink>
      {content.introAfter}
    </>
  ) : (
    content.intro
  );
  return (
    <section>
      <PageHeroInner ringOnTop headingLevel={primary ? "h1" : "h2"} eyebrow={content.eyebrow} title={content.title} intro={intro}>
        {content.cta ? <Button href={bookCallHref()}>{content.cta}</Button> : null}
      </PageHeroInner>
    </section>
  );
}
