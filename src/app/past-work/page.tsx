import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { ClosingCta } from "@/components/hl/ClosingCta";
import { Container } from "@/components/hl/Container";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { PageHero } from "@/components/hl/PageHero";
import { ProofChips } from "@/components/hl/ProofChips";
import { SectionNav } from "@/components/hl/SectionNav";
import { SystemsCaseStudy } from "@/components/hl/SystemsCaseStudy";
import { TestimonialRow } from "@/components/hl/TestimonialRow";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { Text } from "@/components/ui/Text";
import { proofStrip } from "@/content/home";
import {
  agencyExperience,
  caseStudies,
  pastWorkClosing,
  pastWorkHero,
  pastWorkMeta,
  pastWorkNav,
  pastWorkSystems,
  pastWorkWebsites,
} from "@/content/past-work";
import { bookCallLabel } from "@/content/site";
import { getTestimonials } from "@/content/testimonials";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...pastWorkMeta, path: "/past-work" });

const h2 = "font-ui text-h2 font-bold";
const section = "scroll-mt-12 py-12 md:py-16";

/** Past Work, in the order of docs/website-plan.md B3 (Revision 7.1): H1, one H2 per section, an H3 per case study. */
export default function PastWorkPage() {
  const standalone = getTestimonials("past-work").filter((t) => !t.caseStudy);

  return (
    <div className="hl relative overflow-x-clip">
      <PageHero eyebrow={pastWorkHero.eyebrow} title={pastWorkHero.title} intro={pastWorkHero.intro} />

      <Container>
        <div className="max-w-[720px] rounded-panel border border-ink/10 bg-white px-8 py-7">
          <p className="font-ui text-[18px] font-semibold">{pastWorkHero.howToRead.title}</p>
          <ul className="mt-4 space-y-3 text-[17px] leading-[1.55]">
            {pastWorkHero.howToRead.items.map((item) => (
              <li key={item}>
                <Text>{item}</Text>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="mt-8">
        <SectionNav label="On this page" items={pastWorkNav} />
      </div>

      <section id="websites" aria-labelledby="websites-title" className={section}>
        <Container>
          <h2 id="websites-title" className={h2}>
            {pastWorkWebsites.heading}
          </h2>
          <p className="mt-5 max-w-[60ch] text-body">{pastWorkWebsites.line}</p>
        </Container>
      </section>

      <section id="systems" aria-labelledby="systems-title" className={section}>
        <Container>
          <FadingDivider className="mb-12 md:mb-16" />
          <h2 id="systems-title" className={h2}>
            {pastWorkSystems.heading}
          </h2>
          <div className="mt-10">
            {caseStudies.map((study, index) => (
              <div key={study.id}>
                {index > 0 ? <FadingDivider className="my-[60px]" /> : null}
                <SystemsCaseStudy study={study} />
              </div>
            ))}
          </div>

          <div className="mt-[60px]">
            <FadingDivider />
            <div className="mt-12">
              <TestimonialRow testimonials={standalone.slice(0, 1)} />
            </div>
            <div className="mt-12">
              <ProofChips content={proofStrip} />
            </div>
          </div>
        </Container>
      </section>

      <section id="agency" aria-labelledby="agency-title" className={section}>
        <Container>
          <FadingDivider className="mb-12 md:mb-16" />
          <h2 id="agency-title" className={h2}>
            {agencyExperience.heading}
          </h2>
          <p className="mt-5 max-w-[64ch] text-body">
            <Text>{agencyExperience.intro}</Text>
          </p>
          <ul className="hl-leads mt-8 max-w-[860px]">
            {agencyExperience.snapshots.map((snapshot, index) => (
              <li key={snapshot}>
                {index > 0 ? <FadingDivider className="my-6" /> : null}
                <p className="text-[17px] leading-[1.55]">
                  <Text>{snapshot}</Text>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-[64ch] text-small text-ink-2">{agencyExperience.footnote}</p>
        </Container>
      </section>

      <ClosingCta heading={<h2 className={h2}>{pastWorkClosing.heading}</h2>}>
        <Button href={bookCallHref()}>{`${bookCallLabel} →`}</Button>
      </ClosingCta>
    </div>
  );
}
