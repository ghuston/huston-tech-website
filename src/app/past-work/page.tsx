import type { Metadata } from "next";
import { CaseStudy } from "@/components/sections/CaseStudy";
import { Callout } from "@/components/ui/Callout";
import { InViewOnce } from "@/components/ui/InViewOnce";
import { Reveal } from "@/components/ui/Reveal";
import { CTASection } from "@/components/ui/CTASection";
import { PageHero } from "@/components/ui/PageHero";
import { ProofStrip } from "@/components/ui/ProofStrip";
import { Section } from "@/components/ui/Section";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { Text } from "@/components/ui/Text";
import { proofStrip } from "@/content/home";
import { agencyExperience, caseStudies, pastWorkClosing, pastWorkHero, pastWorkMeta } from "@/content/past-work";
import { getTestimonials } from "@/content/testimonials";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...pastWorkMeta, path: "/past-work" });

export default function PastWorkPage() {
  const standalone = getTestimonials("past-work").filter((t) => !t.caseStudy);

  return (
    <>
      <PageHero
        eyebrow={pastWorkHero.eyebrow}
        title={pastWorkHero.title}
        intro={<p>{pastWorkHero.intro}</p>}
        aside={
          <InViewOnce>
            <Callout title={pastWorkHero.howToRead.title} tone="note" className="will-settle rotate-[0.8deg] shadow-note">
              <ul className="space-y-3">
                {pastWorkHero.howToRead.items.map((item) => (
                  <li key={item}>
                    <Text>{item}</Text>
                  </li>
                ))}
              </ul>
            </Callout>
          </InViewOnce>
        }
      />

      {caseStudies.map((study, i) => (
        <Section key={study.id} tone={i % 2 === 0 ? "paper" : "surface"}>
          <CaseStudy study={study} />
        </Section>
      ))}

      <Section tone="sage" labelledBy="more-words-title">
        <h2 id="more-words-title" className="sr-only">
          More client words
        </h2>
        <div className="grid gap-6">
          {standalone.map((testimonial) => (
            <div key={testimonial.id} className="mx-auto w-full max-w-3xl">
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
          <div className="mx-auto mt-4 w-full max-w-5xl">
            <ProofStrip content={proofStrip} />
          </div>
        </div>
      </Section>

      <Section tone="paper" labelledBy="agency-title">
        <header className="mb-10 max-w-[var(--container-prose)]">
          <h2 id="agency-title" className="text-[1.75rem] leading-tight sm:text-4xl lg:text-[2.5rem]">
            {agencyExperience.heading}
          </h2>
          <p className="mt-4 text-ink/85">
            <Text>{agencyExperience.intro}</Text>
          </p>
        </header>
        <Reveal as="ul" className="grid gap-4 md:grid-cols-2">
          {agencyExperience.snapshots.map((snapshot) => (
            <li key={snapshot} className="rounded-[14px] border border-line bg-surface p-5 sm:p-6">
              <Text>{snapshot}</Text>
            </li>
          ))}
        </Reveal>
        <p className="mt-8 max-w-[var(--container-prose)] text-sm text-muted">{agencyExperience.footnote}</p>
      </Section>

      <CTASection id="past-work-cta-title" heading={pastWorkClosing.heading} />
    </>
  );
}
