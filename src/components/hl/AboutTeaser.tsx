import { Container } from "./Container";
import { DOT_PATH, RING_PATH } from "./Marks";
import { TextLink } from "./TextLink";

type AboutTeaserProps = {
  heading: string;
  body: string;
  link: { label: string; href: string };
};

/**
 * About teaser (docs/STYLE-GUIDE.md §7.22). The headshot sits inside the logo's ring, a disc at 82% of the ring's inner
 * diameter; the ring and its rust dot are static. Until Grant supplies a real headshot the ring holds an empty
 * silver-2 disc: no stock photo, ever. The ring is decoration, so it is hidden from assistive technology.
 */
export function AboutTeaser({ heading, body, link }: AboutTeaserProps) {
  return (
    <section aria-labelledby="about-teaser-title" className="py-16 md:py-24">
      <Container className="grid items-center gap-12 md:grid-cols-[320px_1fr] md:gap-16 lg:grid-cols-[360px_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-[280px] md:max-w-none">
          <div aria-hidden="true" className="absolute inset-[16%] rounded-pill bg-silver-2" />
          <svg viewBox="-380.18 -380.18 760.36 760.36" aria-hidden="true" className="absolute inset-0 size-full">
            <g transform="translate(-766.97 -435.17)">
              <path d={RING_PATH} fill="var(--hl-green)" />
              <path d={DOT_PATH} fill="var(--hl-rust)" />
            </g>
          </svg>
        </div>
        <div>
          <h2 id="about-teaser-title" className="font-ui text-h2 font-bold">
            {heading}
          </h2>
          <p className="mt-5 max-w-[60ch] text-body">{body}</p>
          <div className="mt-6">
            <TextLink href={link.href}>{link.label}</TextLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
