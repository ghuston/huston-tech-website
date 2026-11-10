import type { ReactNode } from "react";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";

type Props = {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
};

/** Top-of-page block for every inner page. Renders the page's single H1. */
export function PageHero({ eyebrow, title, intro, children, aside }: Props) {
  return (
    <section className="dot-grid border-b border-line pb-14 pt-12 lg:pb-20 lg:pt-20">
      <Container className={aside ? "grid items-center gap-12 lg:grid-cols-[1.25fr_1fr]" : ""}>
        <div className="max-w-[var(--container-prose)]">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="intro mt-5 text-[2.4rem] leading-[1.05] sm:text-5xl lg:text-[3.5rem]">{title}</h1>
          {intro ? <div className="mt-5 space-y-4 text-lg text-ink/85">{intro}</div> : null}
          {children ? <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{children}</div> : null}
        </div>
        {aside}
      </Container>
    </section>
  );
}
