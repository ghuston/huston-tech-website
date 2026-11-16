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
export function RingHeadshot({ className = "", eager = false }: { className?: string; eager?: boolean }) {
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
      <RingWithDot className="absolute inset-0 size-full" ringColor="var(--hl-green)" dotColor="var(--hl-rust)" />
    </div>
  );
}

type AboutTeaserProps = {
  heading: string;
  paragraphs: readonly string[];
  link: { label: string; href: string };
};

/** About teaser (docs/STYLE-GUIDE.md §7.22). */
export function AboutTeaser({ heading, paragraphs, link }: AboutTeaserProps) {
  return (
    <section aria-labelledby="about-teaser-title" className="py-16 md:py-24">
      <Container className="grid items-center gap-12 md:grid-cols-[320px_1fr] md:gap-16 lg:grid-cols-[360px_1fr]">
        <RingHeadshot className="max-w-[280px] md:max-w-none" />
        <div>
          <h2 id="about-teaser-title" className="font-ui text-h2 font-bold">
            {heading}
          </h2>
          <div className="mt-5 max-w-[60ch] space-y-4 text-body">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-6">
            <TextLink href={link.href}>{link.label}</TextLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
