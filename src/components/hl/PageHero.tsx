import type { ReactNode } from "react";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { Glow } from "./Glow";
import { RingMark } from "./Marks";

type PageHeroProps = {
  eyebrow: string;
  /** The page's single H1, single voice. */
  title: string;
  intro?: ReactNode;
  /** The call to action this page's copy gives it. */
  children?: ReactNode;
};

/**
 * Top of every inner page (docs/STYLE-GUIDE.md §7.25): left-aligned eyebrow, H1, intro and action, with a quarter of
 * the ring and a soft green glow in the top-right corner. Static: no dot, no motion.
 */
export function PageHero({ eyebrow, title, intro, children }: PageHeroProps) {
  return (
    <section className="relative pb-16 pt-[72px]">
      <Glow variant="green" className="-right-[260px] -top-[260px] size-[520px]" />
      <RingMark className="pointer-events-none absolute -right-[260px] -top-[260px] size-[520px] fill-white opacity-85" />
      <Container className="relative z-10">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-[18px] max-w-[18em] font-ui text-page-title font-bold">{title}</h1>
        {intro ? <p className="mt-6 max-w-[60ch] text-body">{intro}</p> : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </Container>
    </section>
  );
}
