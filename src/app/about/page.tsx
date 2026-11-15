import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { Container } from "@/components/hl/Container";
import { DotList } from "@/components/hl/DotList";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { PageHero } from "@/components/hl/PageHero";
import { RingHeadshot } from "@/components/hl/AboutTeaser";
import { TestimonialRow } from "@/components/hl/TestimonialRow";
import { TextLink } from "@/components/hl/TextLink";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { JsonLd } from "@/components/ui/JsonLd";
import { Text } from "@/components/ui/Text";
import { aboutHero, aboutMeta, aboutSections } from "@/content/about";
import { getTestimonials } from "@/content/testimonials";
import { personJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...aboutMeta, path: "/about" });

const h2 = "font-ui text-h2 font-bold";
const section = "py-12 md:py-16";
const prose = "mt-5 max-w-[64ch] space-y-4 text-body";

/** About, in the order of docs/website-plan.md B4 (Revision 7.1): H1, then one H2 per bold label in the copy. */
export default function AboutPage() {
  const [quote] = getTestimonials("about");
  const s = aboutSections;

  return (
    <div className="hl relative overflow-x-clip">
      <JsonLd data={personJsonLd()} />
      <PageHero eyebrow={aboutHero.eyebrow} title={aboutHero.title} intro={aboutHero.intro} />

      <section aria-labelledby="short-title" className={section}>
        <Container className="grid items-center gap-10 md:grid-cols-[320px_1fr] md:gap-16">
          <RingHeadshot className="max-w-[280px] md:max-w-none" />
          <div>
            <h2 id="short-title" className={h2}>
              {s.shortVersion.heading}
            </h2>
            <p className="mt-5 max-w-[60ch] text-body">{s.shortVersion.body}</p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="how-title" className={section}>
        <Container>
          <h2 id="how-title" className={h2}>
            {s.howIGotHere.heading}
          </h2>
          <div className={prose}>
            {s.howIGotHere.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="why-title" className={section}>
        <Container>
          <FadingDivider className="mb-12 md:mb-16" />
          <h2 id="why-title" className={h2}>
            {s.whyWebsites.heading}
          </h2>
          <p className={prose}>{s.whyWebsites.body}</p>
        </Container>
      </section>

      <section aria-labelledby="working-title" className={section}>
        <Container>
          <FadingDivider className="mb-12 md:mb-16" />
          <h2 id="working-title" className={h2}>
            {s.workingWithMe.heading}
          </h2>
          <p className="mt-5 max-w-[64ch] text-body">
            <Text>{s.workingWithMe.intro}</Text>
          </p>
          <DotList items={s.workingWithMe.items} className="mt-5 max-w-[64ch]" />
          {quote ? (
            <div className="mt-12">
              <TestimonialRow testimonials={[quote]} />
            </div>
          ) : null}
        </Container>
      </section>

      <section aria-labelledby="bring-title" className={section}>
        <Container>
          <FadingDivider className="mb-12 md:mb-16" />
          <h2 id="bring-title" className={h2}>
            {s.whatIBring.heading}
          </h2>
          <DotList items={s.whatIBring.items} className="mt-5 max-w-[64ch]" />
        </Container>
      </section>

      <section aria-labelledby="off-title" className={section}>
        <Container>
          <h2 id="off-title" className={h2}>
            {s.offTheClock.heading}
          </h2>
          <p className="mt-5 max-w-[64ch] text-body">
            <Text>{s.offTheClock.body}</Text>
          </p>
          <div className="mt-8">
            <Button href={bookCallHref()}>{s.cta.label}</Button>
          </div>
          <div className="mt-10 max-w-[64ch] rounded-card bg-tint px-5 py-[18px] text-[17px] leading-[1.55]">
            <span className="font-ui font-semibold text-green">{s.partnerBox.lead}</span> {s.partnerBox.body}{" "}
            <TextLink inline href={s.partnerBox.link.href}>
              {s.partnerBox.link.label}
            </TextLink>
          </div>
        </Container>
      </section>
    </div>
  );
}
