import type { Metadata } from "next";
import Link from "next/link";
import { HeroBoard } from "@/components/illustrations/HeroBoard";
import { BookCallButton } from "@/components/ui/BookCallButton";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Container } from "@/components/ui/Container";
import { CTASection } from "@/components/ui/CTASection";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PhotoPlaceholder } from "@/components/ui/MediaPlaceholders";
import { ProcessSteps } from "@/components/ui/ProcessSteps";
import { ReviewBar } from "@/components/sections/ReviewBar";
import { ProofStrip } from "@/components/ui/ProofStrip";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusChip } from "@/components/ui/StatusChip";
import { StickyNoteCard } from "@/components/ui/StickyNoteCard";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { Text } from "@/components/ui/Text";
import {
  aboutTeaser,
  closingCta,
  frameworkCompact,
  hero,
  heroOptions,
  homeMeta,
  howItWorks,
  insightsTeaser,
  problems,
  proof,
  proofStrip,
  whatIDo,
  whyHustonTech,
} from "@/content/home";
import { bookCallShortLabel, siteConfig } from "@/content/site";
import { getTestimonials } from "@/content/testimonials";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...homeMeta, path: "/" });

export default function HomePage() {
  const testimonials = getTestimonials("home");
  const heroCopy = heroOptions[siteConfig.heroOption];
  // Hero option B already uses the "memo" line, so the problems section goes back to "Sound familiar?" as its heading.
  const problemsHeadsWithMemo = siteConfig.heroOption !== "B";

  return (
    <>
      <section aria-labelledby="hero-title" className="dot-grid border-b border-line pb-16 pt-12 lg:pb-24 lg:pt-20">
        <Container className="grid items-center gap-14 lg:grid-cols-[1.3fr_1fr]">
          <div className="fade-up">
            <Eyebrow>{hero.eyebrow}</Eyebrow>
            <h1 id="hero-title" className="mt-5 text-[2.5rem] leading-[1.04] sm:text-6xl lg:text-[4rem]">
              {heroCopy.titleStart} <span className="marker">{heroCopy.titleHighlight}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink/85 sm:text-xl">{heroCopy.body}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <BookCallButton fullWidthOnMobile />
              <Button href={hero.secondaryCta.href} variant="secondary" fullWidthOnMobile>
                {hero.secondaryCta.label}
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted">
              <Text>{hero.smallLine}</Text>
            </p>
          </div>
          <div className="fade-up-delay">
            <HeroBoard />
          </div>
        </Container>
      </section>

      <section className="bg-paper py-12 lg:py-16">
        <Container>
          <ProcessSteps
            variant="compact"
            srHeading={frameworkCompact.srHeading}
            link={frameworkCompact.link}
          />
        </Container>
      </section>
      <ReviewBar />

      <Section tone="paper" labelledBy="problems-title">
        {problemsHeadsWithMemo ? (
          <>
            <div className="mb-5">
              <Eyebrow>{problems.eyebrow}</Eyebrow>
            </div>
            <SectionHeading id="problems-title">{problems.heading}</SectionHeading>
          </>
        ) : (
          <SectionHeading id="problems-title">{problems.eyebrow}</SectionHeading>
        )}
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {problems.notes.map((note, i) => (
            <StickyNoteCard key={note.title} index={i} title={note.title} body={note.body} />
          ))}
        </ul>
        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
          <p className="font-display text-xl font-semibold">{problems.after}</p>
          <BookCallButton label={bookCallShortLabel} fullWidthOnMobile />
        </div>
      </Section>

      <Section tone="sage" labelledBy="what-i-do-title">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <h2 id="what-i-do-title" className="text-[1.75rem] leading-tight sm:text-4xl lg:text-[2.5rem]">
              {whatIDo.heading}
            </h2>
            <p className="mt-5 text-ink/85">{whatIDo.intro}</p>
            <div className="mt-8">
              <Button href={whatIDo.cta.href} variant="secondary">
                {whatIDo.cta.label}
              </Button>
            </div>
          </div>
          <ul className="grid gap-4">
            {whatIDo.items.map((item) => (
              <li key={item.title} className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
                <h3 className="text-[1.35rem] leading-snug">{item.title}</h3>
                <p className="mt-2 text-ink/80">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <Callout tone="note" className="mt-12">
          <p className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              <strong>{whatIDo.zoho.lead}</strong> {whatIDo.zoho.body}
            </span>
            <Link href={whatIDo.zoho.link.href} className="shrink-0 font-semibold text-sage underline underline-offset-4">
              {whatIDo.zoho.link.label}
            </Link>
          </p>
        </Callout>
      </Section>

      <Section tone="paper" labelledBy="proof-title">
        <SectionHeading id="proof-title">{proof.heading}</SectionHeading>
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {proof.teasers.map((teaser) => (
            <article key={teaser.name} className="rounded-[14px] border border-line bg-surface p-6 sm:p-8">
              <StatusChip tone="signal">Project</StatusChip>
              <h3 className="mt-4 text-2xl">{teaser.name}</h3>
              <p className="mt-3 text-ink/85">{teaser.body}</p>
              <p className="mt-5">
                <Link href={teaser.href} className="inline-flex min-h-11 items-center font-semibold text-sage underline underline-offset-4">
                  {proof.teaserLinkLabel}
                </Link>
              </p>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <ProofStrip content={proofStrip} />
        </div>
      </Section>

      <Section id="how-it-works" tone="sage" labelledBy="how-title">
        <div className="mb-5">
          <Eyebrow>{howItWorks.eyebrow}</Eyebrow>
        </div>
        <SectionHeading id="how-title">{howItWorks.heading}</SectionHeading>
        <ProcessSteps variant="detailed" stepZero={howItWorks.stepZero} steps={howItWorks.steps} />
        <p className="mt-14 max-w-[var(--container-prose)] font-display text-xl font-semibold lg:mt-12">
          {howItWorks.after}{" "}
          <span className="font-sans text-base font-normal">
            {howItWorks.support.lead}{" "}
            <Link href={howItWorks.support.link.href} className="font-semibold text-sage underline underline-offset-4">
              {howItWorks.support.link.label}
            </Link>
            .
          </span>
        </p>
      </Section>

      <Section tone="paper" labelledBy="why-title">
        <SectionHeading id="why-title">{whyHustonTech.heading}</SectionHeading>
        <ul className="grid gap-x-12 gap-y-10 lg:grid-cols-3">
          {whyHustonTech.items.map((item, i) => (
            <li key={item.title} className="flex gap-5">
              <span aria-hidden="true" className="font-mono text-sm font-medium text-signal">
                0{i + 1}
              </span>
              <div>
                <h3 className="text-2xl leading-snug">{item.title}</h3>
                <p className="mt-2 text-ink/85">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="surface" labelledBy="about-teaser-title">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <PhotoPlaceholder label={aboutTeaser.photoLabel} />
          <div>
            <h2 id="about-teaser-title" className="text-[1.75rem] sm:text-4xl lg:text-[2.5rem]">
              {aboutTeaser.heading}
            </h2>
            <p className="mt-5 text-ink/85">{aboutTeaser.body}</p>
            <div className="mt-8">
              <Button href={aboutTeaser.link.href} variant="secondary">
                {aboutTeaser.link.label}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="paper" labelledBy="insights-teaser-title">
        <div className="flex flex-col gap-6 rounded-[14px] border border-dashed border-ink/30 bg-surface p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <StatusChip tone="note">Coming soon</StatusChip>
            <h2 id="insights-teaser-title" className="mt-4 text-[1.75rem] sm:text-4xl">
              {insightsTeaser.heading}
            </h2>
            <p className="mt-3 text-ink/85">
              {insightsTeaser.body} {insightsTeaser.comingSoon}
            </p>
          </div>
          <Button href={insightsTeaser.link.href} variant="secondary" fullWidthOnMobile>
            {insightsTeaser.link.label}
          </Button>
        </div>
      </Section>

      <CTASection
        id="closing-cta-title"
        heading={closingCta.heading}
        body={closingCta.body}
        secondary={closingCta.secondary}
        microcopy={closingCta.microcopy}
      />
    </>
  );
}
