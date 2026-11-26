import type { Metadata } from "next";
import { AboutTeaser } from "@/components/hl/AboutTeaser";
import { Button } from "@/components/hl/Button";
import { CaseStudyTeaser } from "@/components/hl/CaseStudyTeaser";
import { CheckTrack } from "@/components/hl/CheckTrack";
import { ClosingCta } from "@/components/hl/ClosingCta";
import { Container } from "@/components/hl/Container";
import { DoorBand } from "@/components/hl/DoorBand";
import { Eyebrow } from "@/components/hl/Eyebrow";
import { Hero } from "@/components/hl/Hero";
import { HeroStack } from "@/components/hl/HeroStack";
import { PhoneScreens } from "@/components/hl/PhoneScreens";
import { ProofChips } from "@/components/hl/ProofChips";
import { Tag } from "@/components/hl/Tag";
import { TalkPairs } from "@/components/hl/TalkPairs";
import { TestimonialRow } from "@/components/hl/TestimonialRow";
import { TextLink } from "@/components/hl/TextLink";
import { TwoVoice } from "@/components/hl/TwoVoice";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { JsonLd } from "@/components/ui/JsonLd";
import {
  aboutTeaser,
  closingCta,
  doorBandLabel,
  heroContent,
  heroStack,
  homeMeta,
  installing,
  proof,
  proofStrip,
  whyHireMe,
} from "@/content/home";
import { offers } from "@/content/site";
import { getTestimonials } from "@/content/testimonials";
import { organizationJsonLd } from "@/lib/organization-jsonld";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...homeMeta, path: "/" });

/**
 * Home, in the seven sections of docs/website-rev8.md B1: hero, what I'm installing now, the two doors, why hire me,
 * proof, about, close. One H1 (the hero), then one H2 per section (the doors have one each).
 */
export default function HomePage() {
  const testimonials = getTestimonials("home");

  return (
    <div className="relative overflow-x-clip">
      <JsonLd data={organizationJsonLd()} />
      <Hero content={heroContent} callHref={bookCallHref()} stack={<HeroStack content={heroStack} />} />

      <section id="installing" aria-labelledby="installing-title" className="relative py-12 md:pb-20 md:pt-18">
        {/* The four blocks are placed by .hl-installing (hl.css): stacked, then two columns, then three. */}
        <Container className="hl-installing relative z-1">
          <div>
            <Eyebrow className="mb-3.5">{installing.eyebrow}</Eyebrow>
            <h2 id="installing-title" className="font-ui text-h2 font-bold">
              {installing.heading}
            </h2>
          </div>
          <div className="mt-7 lg:mt-9 xl:mt-0 xl:pt-2">
            <TalkPairs pairs={installing.pairs} />
          </div>
          <div className="mt-8 lg:mt-9 xl:mt-0">
            <PhoneScreens screens={installing.screens} label={installing.screensLabel} note={installing.screensNote} fluid />
          </div>
          <div className="mt-6 lg:mt-8 xl:mt-6">
            <p className="max-w-intro text-body">{installing.line}</p>
            <div className="mt-1 md:mt-2">
              <TextLink href={installing.link.href}>{installing.link.label}</TextLink>
            </div>
          </div>
        </Container>
      </section>

      <DoorBand doors={[offers.website, offers.system]} label={doorBandLabel} />

      <section id="why" aria-labelledby="why-title" className="relative pb-16 pt-8 md:pb-24">
        <Container>
          <div className="lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-x-16">
            <div>
              <Eyebrow className="mb-3.5">{whyHireMe.eyebrow}</Eyebrow>
              <TwoVoice id="why-title" line1={whyHireMe.line1} line2={whyHireMe.line2} />
            </div>
            <p className="mt-5.5 max-w-intro text-body lg:mt-0">{whyHireMe.body}</p>
          </div>
          <div className="mt-8 md:mt-14">
            <CheckTrack stops={whyHireMe.stops} />
          </div>
          <p className="mt-6 max-w-pitch rounded-card bg-tint px-5 py-4.5 text-chip leading-copy md:mt-10 md:text-control">
            {whyHireMe.callout}
          </p>
          <ul className="mt-8 grid md:mt-12 md:grid-cols-3 md:gap-x-12">
            {whyHireMe.points.map((point) => (
              <li key={point.title} className="border-t border-hairline py-4 md:py-5">
                <b className="font-ui text-item font-semibold">{point.title}</b>
                <p className="mt-1 text-chip leading-copy md:mt-1.5 md:text-control">{point.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="proof" aria-labelledby="proof-title" className="relative pb-16 pt-8 md:pb-24 md:pt-0">
        <Container>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3.5">
            <h2 id="proof-title" className="font-ui text-h2 font-bold">
              {proof.heading}
            </h2>
            <Tag>{proof.tag}</Tag>
          </div>
          <div className="mt-6 md:mt-10">
            <TestimonialRow testimonials={testimonials} swipe={proof.quotesLabel} />
          </div>
          <div className="mt-7 md:mt-10">
            <ProofChips content={proofStrip} />
          </div>
          <div className="mt-7 grid gap-6 md:mt-12 md:grid-cols-2 md:gap-7">
            {proof.teasers.map((teaser) => (
              <CaseStudyTeaser
                key={teaser.name}
                name={teaser.name}
                body={teaser.body}
                href={teaser.href}
                linkLabel={proof.teaserLinkLabel}
                image={teaser.image}
              />
            ))}
          </div>
        </Container>
      </section>

      <AboutTeaser heading={aboutTeaser.heading} body={aboutTeaser.body} link={aboutTeaser.link} />

      <ClosingCta heading={<TwoVoice line1={closingCta.line1} line2={closingCta.line2} />} body={closingCta.body}>
        <Button href={bookCallHref()} fullWidthOnMobile>
          {closingCta.cta}
        </Button>
        <TextLink href={closingCta.secondary.href}>{closingCta.secondary.label}</TextLink>
      </ClosingCta>
    </div>
  );
}
