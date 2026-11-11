import type { Metadata } from "next";
import { BookCallButton } from "@/components/ui/BookCallButton";
import { Container } from "@/components/ui/Container";
import { CTASection } from "@/components/ui/CTASection";
import { FAQ } from "@/components/ui/FAQ";
import { ProcessSteps } from "@/components/ui/ProcessSteps";
import { PageHero } from "@/components/ui/PageHero";
import { PullQuote } from "@/components/ui/PullQuote";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { Text } from "@/components/ui/Text";
import {
  commonFixes,
  everyProject,
  faq,
  platforms,
  servicesClosingCta,
  servicesHero,
  servicesMeta,
  startHere,
  subNav,
  systemsWork,
  whatIDontDo,
} from "@/content/services";
import { getTestimonials } from "@/content/testimonials";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...servicesMeta, path: "/services" });

export default function ServicesPage() {
  const [pullQuote] = getTestimonials("services");

  return (
    <>
      <PageHero eyebrow={servicesHero.eyebrow} title={servicesHero.title} intro={<p>{servicesHero.intro}</p>}>
        <BookCallButton fullWidthOnMobile />
      </PageHero>

      <div className="sticky top-[3.75rem] z-30 hidden border-b border-line bg-paper/95 backdrop-blur lg:block">
        <Container>
          <nav aria-label="On this page">
            <ul className="flex gap-2 py-1.5">
              {subNav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex min-h-11 items-center rounded-md px-3 font-mono text-xs font-medium uppercase tracking-[0.12em] text-muted transition-colors hover:bg-signal-tint hover:text-signal-deep"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </div>

      <Section id="start" labelledBy="start-title" tone="paper">
        <SectionHeading id="start-title" intro={startHere.intro}>
          {startHere.heading}
        </SectionHeading>
        <ProcessSteps variant="detailed" stepZero={startHere.stepZero} steps={startHere.steps} />
      </Section>

      <Section id="fixes" labelledBy="fixes-title" tone="sage">
        <Reveal>
          <SectionHeading id="fixes-title">{commonFixes.heading}</SectionHeading>
        </Reveal>
        <div className="grid gap-6">
          {commonFixes.blocks.map((block) => (
            <Reveal key={block.title}>
              <ServiceCard block={block} goodFitLabel={commonFixes.goodFitLabel} />
            </Reveal>
          ))}
        </div>
      </Section>

      <Section id="systems" labelledBy="systems-title" tone="paper">
        <Reveal>
          <SectionHeading id="systems-title">{systemsWork.heading}</SectionHeading>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          {systemsWork.blocks.map((block) => (
            <Reveal key={block.title}>
              <ServiceCard block={block} />
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="surface" labelledBy="every-project-title">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 id="every-project-title" className="text-[1.75rem] sm:text-4xl">
              {everyProject.heading}
            </h2>
            <div className="mt-6 space-y-8">
              {everyProject.groups.map((group) => (
                <div key={group.label}>
                  <h3 className="text-2xl">{group.label}</h3>
                  <ul className="mt-3 space-y-3">
                    {group.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-sage text-xs text-white"
                        >
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="self-center">{pullQuote ? <Reveal><PullQuote testimonial={pullQuote} /></Reveal> : null}</div>
        </div>
      </Section>

      <Section tone="paper" labelledBy="platforms-title">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 id="platforms-title" className="text-[1.75rem] sm:text-4xl">
              {platforms.heading}
            </h2>
            <p className="mt-5 text-ink/85">
              <Text>{platforms.body}</Text>
            </p>
          </div>
          <div className="self-start rounded-[14px] border border-dashed border-ink/30 bg-surface p-6 sm:p-8">
            <h2 className="text-2xl">{whatIDontDo.heading}</h2>
            <p className="mt-3 text-ink/85">{whatIDontDo.body}</p>
          </div>
        </div>
      </Section>

      <Section id="faq" labelledBy="faq-title" tone="sage">
        <SectionHeading id="faq-title">{faq.heading}</SectionHeading>
        <FAQ items={faq.items} />
      </Section>

      <CTASection id="services-cta-title" heading={servicesClosingCta.heading} body={servicesClosingCta.body} />
    </>
  );
}
