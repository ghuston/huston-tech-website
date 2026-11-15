import type { ReactNode } from "react";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { Glow } from "./Glow";
import { RingMark, RingWithDot } from "./Marks";

type PageHeroProps = {
  /** Only where Section B gives the page an eyebrow. */
  eyebrow?: string;
  /** The page's single H1, single voice. */
  title: string;
  intro?: ReactNode;
  /** The call to action this page's copy gives it. */
  children?: ReactNode;
  /** The 404: the ring is drawn with its dot parked away from the gap (§7.33). */
  dotOut?: boolean;
};

/**
 * Top of every inner page (docs/STYLE-GUIDE.md §7.25): left-aligned eyebrow, H1, intro and action, with a quarter of
 * the ring and a soft green glow in the top-right corner. Static: no dot, no motion.
 */
export function PageHero({ eyebrow, title, intro, children, dotOut = false }: PageHeroProps) {
  const ringClass = "pointer-events-none absolute -right-[260px] -top-[260px] size-[520px]";
  return (
    <section className="relative pb-16 pt-[72px]">
      <Glow variant="green" className="-right-[260px] -top-[260px] size-[520px]" />
      {dotOut ? (
        <RingWithDot className={ringClass} ringColor="var(--hl-white)" dotColor="var(--hl-rust)" dotRotate={148} />
      ) : (
        <RingMark className={`${ringClass} fill-white opacity-85`} />
      )}
      <Container className="relative z-10">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className={`${eyebrow ? "mt-[18px] " : ""}max-w-[18em] font-ui text-page-title font-bold`}>{title}</h1>
        {intro ? <p className="mt-6 max-w-[60ch] text-body">{intro}</p> : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </Container>
    </section>
  );
}
