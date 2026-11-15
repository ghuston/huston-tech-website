import type { ReactNode } from "react";
import { Container } from "./Container";
import { Glow } from "./Glow";

type ClosingCtaProps = {
  heading: ReactNode;
  body?: string;
  /** The action (a Button, optionally followed by a TextLink). */
  children: ReactNode;
};

/** Closing call to action (docs/STYLE-GUIDE.md §7.24): not a band; a seam glow blends it into the page. Left-aligned. */
export function ClosingCta({ heading, body, children }: ClosingCtaProps) {
  return (
    <section className="relative py-16 md:py-24">
      <Glow variant="seam" className="left-1/2 top-[-260px] -ml-[650px]" />
      <Container className="relative z-10">
        <h2 className="font-ui text-h2 font-bold">{heading}</h2>
        {body ? <p className="mt-4 max-w-[60ch] text-blurb">{body}</p> : null}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">{children}</div>
      </Container>
    </section>
  );
}
