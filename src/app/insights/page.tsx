import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLabel } from "@/components/ui/ArrowLabel";
import { CTASection } from "@/components/ui/CTASection";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { StatusChip } from "@/components/ui/StatusChip";
import { insightsClosing, insightsComingSoon, insightsHero, insightsMeta } from "@/content/insights";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...insightsMeta, path: "/insights" });

export default function InsightsPage() {
  const c = insightsComingSoon;
  return (
    <>
      <PageHero eyebrow={insightsHero.eyebrow} title={insightsHero.title} intro={<p>{insightsHero.intro}</p>} />

      <Section tone="paper" labelledBy="coming-soon-title">
        <Reveal className="mx-auto max-w-3xl rounded-[14px] border border-dashed border-ink/30 bg-surface p-8 text-center sm:p-12">
          <StatusChip tone="note">{c.chip}</StatusChip>
          <h2 id="coming-soon-title" className="mt-5 text-3xl sm:text-4xl">
            {c.heading}
          </h2>
          <p className="mt-4 text-ink/85">
            {c.body}{" "}
            <Link href={c.askLink.href} className="font-semibold text-sage underline underline-offset-4">
              <ArrowLabel>{c.askLink.label}</ArrowLabel>
            </Link>
          </p>
        </Reveal>

        <h2 className="mb-6 mt-16 text-2xl">{c.topicsHeading}</h2>
        <Reveal effect="stagger" as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.categories.map((category) => (
            <li key={category.name} className="rounded-[14px] border border-line bg-surface p-5">
              <StatusChip tone="sage">{category.name}</StatusChip>
              <p className="mt-3 text-[0.98rem] text-ink/80">{category.blurb}</p>
            </li>
          ))}
        </Reveal>
      </Section>

      <CTASection id="insights-cta-title" heading={insightsClosing.heading} buttonLabel="Book a free 20-minute call" />
    </>
  );
}
