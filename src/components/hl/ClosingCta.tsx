import type { ReactNode } from "react";
import { ArtAside } from "@/components/illustrations/BrandArt";
import { Container } from "./Container";
import { Glow } from "./Glow";

type ClosingCtaProps = {
  /** The finished heading element: a plain `<h2>` or the two-voice heading (TwoVoice). */
  heading: ReactNode;
  body?: string;
  /** The action (a Button, optionally followed by a TextLink). */
  children: ReactNode;
  /** The microcopy line under the action. */
  note?: string;
  /** A drawing beside the text on desktop (BrandArt); left out on phones. */
  art?: ReactNode;
};

/** Closing call to action (docs/STYLE-GUIDE.md §7.24): not a band; a seam glow blends it into the page. Left-aligned. */
export function ClosingCta({ heading, body, children, note, art }: ClosingCtaProps) {
  const text = (
    <>
      {heading}
      {body ? <p className="mt-4 max-w-[60ch] text-blurb">{body}</p> : null}
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">{children}</div>
      {note ? <p className="mt-6 text-[15px] text-ink-2">{note}</p> : null}
    </>
  );
  return (
    <section className="relative py-16 md:py-24">
      <Glow variant="seam" className="left-1/2 top-[-260px] -ml-[650px]" />
      <Container className="relative z-10">
        {art ? (
          <ArtAside align="center" art={art}>
            {text}
          </ArtAside>
        ) : (
          text
        )}
      </Container>
    </section>
  );
}
