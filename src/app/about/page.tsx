import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLabel } from "@/components/ui/ArrowLabel";
import { BookCallButton } from "@/components/ui/BookCallButton";
import { Callout } from "@/components/ui/Callout";
import { Reveal } from "@/components/ui/Reveal";
import { JsonLd } from "@/components/ui/JsonLd";
import { PhotoPlaceholder } from "@/components/ui/MediaPlaceholders";
import { PageHero } from "@/components/ui/PageHero";
import { PullQuote } from "@/components/ui/PullQuote";
import { Section } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { aboutHero, aboutMeta, aboutSections } from "@/content/about";
import { getTestimonials } from "@/content/testimonials";
import { personJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...aboutMeta, path: "/about" });

export default function AboutPage() {
  const [pullQuote] = getTestimonials("about");
  const s = aboutSections;

  return (
    <>
      <JsonLd data={personJsonLd()} />
      <PageHero
        eyebrow={aboutHero.eyebrow}
        title={aboutHero.title}
        intro={<p>{aboutHero.intro}</p>}
        aside={<PhotoPlaceholder label={aboutHero.photoLabel} />}
      />

      <Section tone="paper" prose labelledBy="short-title">
        <div className="space-y-14">
          <div>
            <Reveal as="h2" id="short-title" className="text-3xl">
              {s.shortVersion.heading}
            </Reveal>
            <p className="mt-4 text-ink/85">{s.shortVersion.body}</p>
          </div>

          <div>
            <h2 className="text-3xl">{s.howIGotHere.heading}</h2>
            <div className="mt-4 space-y-5 text-ink/85">
              {s.howIGotHere.paragraphs.map((paragraph) => (
                <p key={paragraph}>
                  <Text>{paragraph}</Text>
                </p>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section tone="sage" prose labelledBy="working-title">
        <h2 id="working-title" className="text-3xl">
          {s.workingWithMe.heading}
        </h2>
        <p className="mt-4 text-ink/85">
          <Text>{s.workingWithMe.intro}</Text>
        </p>
        <Reveal effect="stagger" as="ul" className="mt-6 space-y-4">
          {s.workingWithMe.items.map((item) => (
            <li key={item} className="rounded-[14px] border border-line bg-surface p-5">
              <Text>{item}</Text>
            </li>
          ))}
        </Reveal>
        {pullQuote ? (
          <div className="mt-12">
            <PullQuote testimonial={pullQuote} />
          </div>
        ) : null}
      </Section>

      <Section tone="paper" prose labelledBy="bring-title">
        <div className="space-y-14">
          <div>
            <h2 id="bring-title" className="text-3xl">
              {s.whatIBring.heading}
            </h2>
            <ul className="mt-5 list-disc space-y-2 pl-5 text-ink/85 marker:text-signal">
              {s.whatIBring.items.map((item) => (
                <li key={item}>
                  <Text>{item}</Text>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-3xl">{s.offTheClock.heading}</h2>
            <div className="mt-4 space-y-4 text-ink/85">
              {s.offTheClock.paragraphs.map((paragraph) => (
                <p key={paragraph}>
                  <Text>{paragraph}</Text>
                </p>
              ))}
            </div>
          </div>

          <div>
            <BookCallButton fullWidthOnMobile />
          </div>

          <Reveal>
            <Callout tone="note">
              <p>
                <strong>{s.partnerBox.title}</strong> {s.partnerBox.body}{" "}
                <Link href={s.partnerBox.link.href} className="font-semibold text-sage underline underline-offset-4">
                  <ArrowLabel>{s.partnerBox.link.label}</ArrowLabel>
                </Link>
              </p>
            </Callout>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
