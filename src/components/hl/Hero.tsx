import type { ReactNode } from "react";
import { ArrowLabel } from "./Arrow";
import { Card } from "./Card";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { Glow } from "./Glow";
import { Pill } from "./Pill";
import { TextLink } from "./TextLink";

type HeroProps = {
  content: { eyebrow: string; line1: string; line2: string; subhead: string; supportingLine: string; callLink: string };
  doors: readonly { title: string; button: string; href: string }[];
  /** Where the "Book a free call →" link goes. */
  callHref: string;
  /** The card stack on the right (HeroStack). */
  stack: ReactNode;
};

function Tick() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
      className="size-[18px] text-green"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="8.2" />
      <path d="M6.4 10.3l2.4 2.4 4.8-5" />
    </svg>
  );
}

/**
 * The first screen (docs/STYLE-GUIDE.md §5): at most seven things, the eyebrow, H1, subhead, pill, two compact doors
 * and the stack. Only the H1 lines animate in the text column (CSS only, so a script error can never hide them).
 */
export function Hero({ content, doors, callHref, stack }: HeroProps) {
  return (
    <section aria-labelledby="hero-title" className="relative">
      <Glow variant="green" className="-right-[200px] -top-[120px] md:-right-[260px]" />
      <Container className="hl-hero-grid">
        <div className="hl-hero-text">
          <Eyebrow className="mb-[18px]">{content.eyebrow}</Eyebrow>
          <h1 id="hero-title" className="font-ui text-hero font-bold text-balance">
            <span className="hl-rise block">{content.line1}</span>{" "}
            <span className="hl-rise hl-rise-2 mt-[0.02em] block font-voice text-[1.07em] font-normal italic leading-[1.08] tracking-[-0.02em] text-rust min-[1101px]:whitespace-nowrap">
              {content.line2}
            </span>
          </h1>
          <p className="mt-[26px] max-w-[29em] text-lede">{content.subhead}</p>
          <div className="mt-5">
            <Pill icon={<Tick />}>{content.supportingLine}</Pill>
          </div>
          <div className="mt-[30px] grid gap-[14px] md:grid-cols-[repeat(2,minmax(0,250px))]">
            {doors.map((door) => (
              <Card key={door.href} href={door.href} className="min-h-11 px-[18px] py-4 text-[16px] leading-[normal]">
                <b className="mb-2 block font-ui text-[17px] font-semibold leading-[1.25]">{door.title}</b>
                <span className="font-ui text-[15px] font-medium text-green">
                  <ArrowLabel>{door.button}</ArrowLabel>
                </span>
              </Card>
            ))}
          </div>
          <p className="mt-4">
            <TextLink href={callHref}>{content.callLink}</TextLink>
          </p>
        </div>
        {stack}
      </Container>
    </section>
  );
}
