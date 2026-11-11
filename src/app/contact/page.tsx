import type { Metadata } from "next";
import { ContactFormPlaceholder } from "@/components/sections/ContactFormPlaceholder";
import { SchedulerPanel } from "@/components/sections/SchedulerPanel";
import { ContactEmail } from "@/components/ui/ContactEmail";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal, Underline } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { contactHero, contactMeta, whatHappensNext } from "@/content/contact";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...contactMeta, path: "/contact" });

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow={contactHero.eyebrow} title={contactHero.title} intro={<p>{contactHero.intro}</p>} />

      <Section tone="paper">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <SchedulerPanel />
          <ContactFormPlaceholder />
        </div>
      </Section>

      <Section tone="sage" labelledBy="next-title">
        <Underline as="h2" id="next-title" rise className="text-3xl sm:text-4xl">
          {whatHappensNext.heading}
        </Underline>
        <Reveal as="ol" className="mt-8 grid gap-6 md:grid-cols-3">
          {whatHappensNext.steps.map((step, i) => (
            <li key={step.title} className="rounded-[14px] border border-line bg-surface p-6">
              <span className="mb-3 inline-grid size-10 place-items-center rounded-full bg-ink font-mono text-sm text-note">
                {i + 1}
              </span>
              <p>
                <strong>{step.title}</strong> {step.body}
              </p>
            </li>
          ))}
        </Reveal>
        <p className="mt-8">
          {whatHappensNext.emailLabel} <ContactEmail />
        </p>
      </Section>
    </>
  );
}
