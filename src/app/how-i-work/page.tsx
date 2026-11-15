import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { ClosingCta } from "@/components/hl/ClosingCta";
import { Container } from "@/components/hl/Container";
import { DetailedSteps } from "@/components/hl/DetailedSteps";
import { PageHero } from "@/components/hl/PageHero";
import { bookCallHref } from "@/components/ui/BookCallButton";
import {
  afterLaunch,
  howIWorkClosing,
  howIWorkHero,
  howIWorkMeta,
  howIWorkProof,
  howIWorkSteps,
  stepLabels,
  stepZero,
} from "@/content/how-i-work";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...howIWorkMeta, path: "/how-i-work" });

export default function HowIWorkPage() {
  return (
    <div className="hl relative overflow-x-clip">
      <PageHero eyebrow={howIWorkHero.eyebrow} title={howIWorkHero.title} intro={howIWorkHero.intro}>
        <Button href={bookCallHref()}>{howIWorkHero.cta}</Button>
      </PageHero>

      <section aria-labelledby="step-zero-title" className="py-12 md:py-16">
        <Container>
          <h2 id="step-zero-title" className="font-ui text-h2 font-bold">
            {stepZero.heading}
          </h2>
          <p className="mt-5 max-w-[60ch] text-body">{stepZero.body}</p>
        </Container>
      </section>

      <section className="pb-12 pt-4 md:pb-16">
        <Container>
          <DetailedSteps steps={howIWorkSteps} labels={stepLabels} headingLevel={2} proof={howIWorkProof} />
        </Container>
      </section>

      <section aria-labelledby="after-launch-title" className="py-12 md:py-16">
        <Container>
          <h2 id="after-launch-title" className="font-ui text-h2 font-bold">
            {afterLaunch.heading}
          </h2>
          <div className="mt-5 max-w-[60ch] space-y-4 text-body">
            {afterLaunch.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Container>
      </section>

      <ClosingCta heading={howIWorkClosing.heading} body={howIWorkClosing.body}>
        <Button href={bookCallHref()}>{howIWorkClosing.cta}</Button>
      </ClosingCta>
    </div>
  );
}
