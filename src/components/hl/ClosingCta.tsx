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

/** The inside of the closing call to action: the seam glow and the text. No section and no padding (the closing block owns those). */
export function ClosingCtaInner({ heading, body, children, note, art }: ClosingCtaProps) {
  const text = (
    <>
      {heading}
      {body ? <p className="mt-4 max-w-intro text-blurb">{body}</p> : null}
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">{children}</div>
      {note ? <p className="mt-6 text-label text-ink-2">{note}</p> : null}
    </>
  );
  return (
    <>
      <Glow variant="seam" className="left-1/2 -top-65 -ml-162.5" />
      <Container className="relative z-10">
        {art ? (
          <ArtAside align="center" art={art}>
            {text}
          </ArtAside>
        ) : (
          text
        )}
      </Container>
    </>
  );
}

/** Closing call to action (docs/STYLE-GUIDE.md §7.24): not a band; a seam glow blends it into the page. Left-aligned. */
export function ClosingCta(props: ClosingCtaProps) {
  return (
    <section className="relative py-16 md:py-24">
      <ClosingCtaInner {...props} />
    </section>
  );
}
