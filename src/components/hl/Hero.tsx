import type { ReactNode } from "react";
import { Button } from "./Button";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { Glow } from "./Glow";
import { Pill } from "./Pill";
import { TextLink } from "./TextLink";
import { CircleTick } from "./Tick";

type HeroProps = {
  content: {
    eyebrow: string;
    line1: string;
    line2: string;
    subhead: string;
    supportingLine: string;
    cta: string;
    installLink: { label: string; href: string };
  };
  /** Where the "Book a free 20-minute call →" button goes. */
  callHref: string;
  /** The card stack on the right (HeroStack). */
  stack: ReactNode;
  /** H1 for the page's own hero; the block showcase shows further heroes as H2. */
  headingLevel?: "h1" | "h2";
};

/**
 * The first screen (docs/STYLE-GUIDE.md §5, Revision 8): the eyebrow, H1, subhead, pill, the call button with the
 * "installing now" link beside it, and the stack. Only the H1 lines animate in the text column (CSS only, so a script
 * error can never hide them). No images here: the H1 stays the largest paint.
 */
export function Hero({ content, callHref, stack, headingLevel = "h1" }: HeroProps) {
  const Heading = headingLevel;
  return (
    <section aria-labelledby="hero-title" className="relative">
      <Glow variant="green" className="-right-50 -top-30 md:-right-65" />
      <Container className="hl-hero-grid">
        <div className="hl-hero-text">
          <Eyebrow className="mb-4.5">{content.eyebrow}</Eyebrow>
          <Heading id="hero-title" className="font-ui text-hero font-bold text-balance">
            <span className="hl-rise block">{content.line1}</span>{" "}
            <span className="hl-rise hl-rise-2 mt-hero-nudge block font-voice text-hero-em font-normal italic leading-hero tracking-title text-rust hero-wide:whitespace-nowrap">
              {content.line2}
            </span>
          </Heading>
          <p className="mt-6 max-w-hero-copy text-lede md:mt-6.5">{content.subhead}</p>
          <div className="mt-5">
            <Pill icon={<CircleTick className="size-4.5" />}>{content.supportingLine}</Pill>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-1.5 md:mt-7.5 md:gap-y-2">
            <Button href={callHref} fullWidthOnMobile>
              {content.cta}
            </Button>
            <TextLink href={content.installLink.href}>{content.installLink.label}</TextLink>
          </div>
        </div>
        {stack}
      </Container>
    </section>
  );
}
