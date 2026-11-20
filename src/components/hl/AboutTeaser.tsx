import Image from "next/image";
import { aboutTeaser } from "@/content/home";
import { Container } from "./Container";
import { RingWithDot } from "./Marks";
import { TextLink } from "./TextLink";

/**
 * The headshot slot (docs/STYLE-GUIDE.md §7.22): the photo sits inside the logo's ring, a disc at 82% of the ring's inner
 * diameter; the ring and its rust dot are static. The ring is decoration, so it is hidden from assistive technology.
 * Below the fold the photo lazy-loads; pass `eager` where it sits in the first screen (it also loads at high priority).
 */
export function RingHeadshot({
  className = "",
  eager = false,
  dotClassName,
}: {
  className?: string;
  eager?: boolean;
  /** A class on the ring's dot (the About teaser's in-view moment, §9.4). */
  dotClassName?: string;
}) {
  return (
    <div className={`relative mx-auto aspect-square w-full ${className}`}>
      <Image
        src="/brand/grant-huston.webp"
        alt={aboutTeaser.photoAlt}
        width={560}
        height={560}
        unoptimized
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        sizes="360px"
        className="absolute inset-[16%] size-[68%] rounded-pill bg-silver-2 object-cover"
      />
      <RingWithDot
        className="absolute inset-0 size-full"
        ringColor="var(--hl-green)"
        dotColor="var(--hl-rust)"
        dotClassName={dotClassName}
      />
    </div>
  );
}

type AboutTeaserProps = {
  heading: string;
  body: string;
  link: { label: string; href: string };
};

/** About teaser (docs/STYLE-GUIDE.md §7.22): the headshot in the logo ring, a single-voice H2, one paragraph and a link. */
export function AboutTeaser({ heading, body, link }: AboutTeaserProps) {
  return (
    <section aria-labelledby="about-teaser-title" className="py-12 md:py-20">
      <Container className="relative z-[1] grid items-center gap-7 md:grid-cols-[260px_minmax(0,1fr)] md:gap-[72px]">
        <RingHeadshot className="max-w-[220px] md:max-w-none" dotClassName="hl-about-dot" />
        <div className="max-w-[660px]">
          <h2 id="about-teaser-title" className="font-ui text-h2 font-bold">
            {heading}
          </h2>
          <p className="mt-4 text-body md:mt-[18px]">{body}</p>
          <div className="mt-1 md:mt-2">
            <TextLink href={link.href}>{link.label}</TextLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
