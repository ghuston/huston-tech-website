import type { Metadata } from "next";
import { AboutTeaser } from "@/components/hl/AboutTeaser";
import { ArcSteps } from "@/components/hl/ArcSteps";
import { Button } from "@/components/hl/Button";
import { CaseStudyTeaser } from "@/components/hl/CaseStudyTeaser";
import { ClosingCta } from "@/components/hl/ClosingCta";
import { Container } from "@/components/hl/Container";
import { DetailedSteps } from "@/components/hl/DetailedSteps";
import { DoorBand } from "@/components/hl/DoorBand";
import { Eyebrow } from "@/components/hl/Eyebrow";
import { Hero } from "@/components/hl/Hero";
import { HeroStack } from "@/components/hl/HeroStack";
import { ProblemGrid } from "@/components/hl/ProblemGrid";
import { ProofChips } from "@/components/hl/ProofChips";
import { ReasonList } from "@/components/hl/ReasonList";
import { ServiceGroups } from "@/components/hl/ServiceGroups";
import { TestimonialRow } from "@/components/hl/TestimonialRow";
import { TextLink } from "@/components/hl/TextLink";
import { TwoVoice } from "@/components/hl/TwoVoice";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { JsonLd } from "@/components/ui/JsonLd";
import {
  aboutTeaser,
  arcContent,
  closingCta,
  doorBandLabel,
  doors,
  heroContent,
  heroStack,
  homeMeta,
  howItWorks,
  insightsTeaser,
  problems,
  proof,
  proofStrip,
  whatIDo,
  why,
} from "@/content/home";
import { getTestimonials } from "@/content/testimonials";
import { organizationJsonLd } from "@/lib/organization-jsonld";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...homeMeta, path: "/" });

/**
 * Home, in the order of docs/website-plan.md B1 (Revision 7.1). One H1 (the hero), the arc's hidden H2 and step H3s, the
 * door H2s, then one H2 per section; the step H3s of "Same three steps" sit under their own H2.
 */
export default function HomePage() {
  const testimonials = getTestimonials("home");

  return (
    <div className="relative overflow-x-clip">
      <JsonLd data={organizationJsonLd()} />
      <Hero content={heroContent} doors={doors} callHref={bookCallHref()} stack={<HeroStack content={heroStack} />} />
      <ArcSteps srHeading={arcContent.srHeading} />
      <DoorBand doors={doors} label={doorBandLabel} />

      <ProblemGrid content={problems} ctaHref={bookCallHref()} />

      <ServiceGroups content={whatIDo} />

      <section aria-labelledby="proof-title" className="py-16 md:py-24">
        <Container>
          <h2 id="proof-title" className="font-ui text-h2 font-bold">
            {proof.heading}
          </h2>
          <div className="mt-12">
            <TestimonialRow testimonials={testimonials} tag={proof.tag} />
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {proof.teasers.map((teaser) => (
              <CaseStudyTeaser key={teaser.name} name={teaser.name} body={teaser.body} href={teaser.href} linkLabel={proof.teaserLinkLabel} />
            ))}
          </div>
          <p className="mt-14 max-w-[60ch] text-lede">{proof.websitesFallback}</p>
          <div className="mt-10">
            <ProofChips content={proofStrip} />
          </div>
        </Container>
      </section>

      <section id="how-it-works" aria-labelledby="how-title" className="py-16 md:py-24">
        <Container>
          <Eyebrow className="mb-[14px]">{howItWorks.eyebrow}</Eyebrow>
          <TwoVoice id="how-title" line1={howItWorks.line1} line2={howItWorks.line2} />
          <p className="mt-6 max-w-[60ch] text-body">{howItWorks.stepZero}</p>
          <div className="mt-6">
            <Button href={bookCallHref()}>{howItWorks.cta}</Button>
          </div>
          <div className="mt-14">
            <DetailedSteps steps={howItWorks.steps} labels={howItWorks.labels} headingLevel={3} proof={howItWorks.proof} />
          </div>
          <div className="mt-8">
            <TextLink href={howItWorks.link.href}>{howItWorks.link.label}</TextLink>
          </div>
        </Container>
      </section>

      <ReasonList heading={why.heading} items={why.items} />

      <AboutTeaser heading={aboutTeaser.heading} body={aboutTeaser.body} link={aboutTeaser.link} />

      <section aria-labelledby="insights-title" className="py-16 md:py-24">
        <Container>
          <h2 id="insights-title" className="font-ui text-h2 font-bold">
            {insightsTeaser.heading}
          </h2>
          <p className="mt-5 max-w-[60ch] text-body">{insightsTeaser.body}</p>
          <div className="mt-6">
            <TextLink href={insightsTeaser.link.href}>{insightsTeaser.link.label}</TextLink>
          </div>
        </Container>
      </section>

      <ClosingCta
        heading={<TwoVoice line1={closingCta.line1} line2={closingCta.line2} />}
        body={closingCta.body}
        note={closingCta.note}
      >
        <Button href={bookCallHref()}>{closingCta.cta}</Button>
        <TextLink href={closingCta.secondary.href}>{closingCta.secondary.label}</TextLink>
      </ClosingCta>
    </div>
  );
}
