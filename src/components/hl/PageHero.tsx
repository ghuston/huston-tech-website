import type { ReactNode } from "react";
import { Text } from "@/components/ui/Text";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { Glow } from "./Glow";
import { RingMark, RingWithDot } from "./Marks";

type HeroContentProps = {
  /** A string is rendered with `Text`; a node (for example a date in a `time`) is used as given. */
  eyebrow?: ReactNode;
  /** The page's single H1. A string is rendered with `Text`, so [[placeholders]] show as markers. */
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  /** H1 for a page's own hero; the block showcase shows further heroes as H2. */
  headingLevel?: "h1" | "h2";
  headingId?: string;
};

const asText = (node: ReactNode) => (typeof node === "string" ? <Text>{node}</Text> : node);

/**
 * The words of a hero as the library's hero block sets them: left-aligned eyebrow, heading, intro and action. No section,
 * padding or glow: the caller adds those. This site's own pages use PageHero below.
 */
export function HeroContent({ eyebrow, title, intro, children, headingLevel = "h1", headingId }: HeroContentProps) {
  const Heading = headingLevel;
  return (
    <Container className="relative z-10">
      {eyebrow ? <Eyebrow>{asText(eyebrow)}</Eyebrow> : null}
      <Heading id={headingId} className={`${eyebrow ? "mt-4.5 " : ""}max-w-title font-ui text-page-title font-bold`}>
        {asText(title)}
      </Heading>
      {intro ? <p className="mt-6 max-w-intro text-body">{asText(intro)}</p> : null}
      {children ? <div className="mt-8">{children}</div> : null}
    </Container>
  );
}

type PageHeroProps = {
  /** Only where Section B gives the page an eyebrow. A node (a date in a `time`) is used as given. */
  eyebrow?: ReactNode;
  /** The page's single H1, single voice. */
  title: ReactNode;
  intro?: ReactNode;
  /** The call to action this page's copy gives it. */
  children?: ReactNode;
  /** The 404: the ring is drawn with its dot parked away from the gap (§7.33). */
  dotOut?: boolean;
  /** The hero block paints the glow and ring above later content, as they were while the hero's section was the only positioned box. */
  ringOnTop?: boolean;
};

/**
 * The inside of the inner-page hero (docs/STYLE-GUIDE.md §7.25): the glow, the quarter ring and the words. No section and
 * no padding, so the hero block (src/site-blocks/page-hero) can put them in its own section under the renderer's rhythm.
 */
export function PageHeroInner({ eyebrow, title, intro, children, dotOut = false, ringOnTop = false }: PageHeroProps) {
  const ringClass = ringOnTop ? "pointer-events-none absolute -right-65 -top-65 size-130 z-1" : "pointer-events-none absolute -right-65 -top-65 size-130";
  return (
    <>
      <Glow variant="green" className={ringOnTop ? "-right-65 -top-65 size-130 z-1" : "-right-65 -top-65 size-130"} />
      {dotOut ? (
        <RingWithDot className={ringClass} ringColor="var(--hl-white)" dotColor="var(--hl-rust)" dotRotate={148} />
      ) : (
        <RingMark className={`${ringClass} fill-white opacity-85`} />
      )}
      <Container className="relative z-10">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className={`${eyebrow ? "mt-4.5 " : ""}max-w-title font-ui text-page-title font-bold`}>{title}</h1>
        {intro ? <p className="mt-6 max-w-intro text-body">{intro}</p> : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </Container>
    </>
  );
}

/**
 * Top of every inner page (docs/STYLE-GUIDE.md §7.25): left-aligned eyebrow, H1, intro and action, with a quarter of
 * the ring and a soft green glow in the top-right corner. Static: no dot, no motion.
 */
export function PageHero(props: PageHeroProps) {
  return (
    <section className="relative pb-16 pt-18">
      <PageHeroInner {...props} />
    </section>
  );
}
