import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { ClosingCta } from "@/components/hl/ClosingCta";
import { Container } from "@/components/hl/Container";
import { PageHero } from "@/components/hl/PageHero";
import { PhoneScreens } from "@/components/hl/PhoneScreens";
import { TalkPairs } from "@/components/hl/TalkPairs";
import { TextLink } from "@/components/hl/TextLink";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { appScreens, installing } from "@/content/home";
import {
  changeIt,
  comingSoon,
  elseIBuild,
  itsYours,
  protectedRecords,
  systemsClosing,
  systemsHero,
  systemsMeta,
  whatISetUp,
  whatItCosts,
  whatItDoes,
} from "@/content/systems";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...systemsMeta, path: "/systems" });

const h2 = "font-ui text-h2 font-bold";
const section = "py-12 md:py-16";
const prose = "mt-5 max-w-intro text-body";

const screens = [appScreens.today, appScreens.pipeline, appScreens.brief, appScreens.rule];

export default function SystemsPage() {
  return (
    <div className="relative overflow-x-clip">
      <PageHero eyebrow={systemsHero.eyebrow} title={systemsHero.title} intro={systemsHero.intro}>
        <Button href={bookCallHref()}>{systemsHero.cta}</Button>
      </PageHero>

      <section id="what-it-does" aria-labelledby="what-it-does-title" className={section}>
        <Container>
          <h2 id="what-it-does-title" className={h2}>
            {whatItDoes.heading}
          </h2>
          <p className={prose}>{whatItDoes.body}</p>
          <div className="mt-10 max-w-note">
            <TalkPairs pairs={installing.pairs} />
          </div>
          <div className="mt-10">
            <PhoneScreens screens={screens} label={installing.screensLabel} note={installing.screensNote} />
          </div>
        </Container>
      </section>

      <section id="setup" aria-labelledby="setup-title" className={section}>
        <Container>
          <h2 id="setup-title" className={h2}>
            {whatISetUp.heading}
          </h2>
          <ol className="mt-6 max-w-intro list-decimal space-y-3 pl-6 text-body marker:font-ui marker:font-bold">
            {whatISetUp.steps.map((step) => (
              <li key={step.lead} className="pl-2">
                <strong className="font-bold">{step.lead}</strong> {step.rest}
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section id="yours" aria-labelledby="yours-title" className={section}>
        <Container>
          <h2 id="yours-title" className={h2}>
            {itsYours.heading}
          </h2>
          <p className={prose}>{itsYours.body}</p>
        </Container>
      </section>

      <section id="change" aria-labelledby="change-title" className={section}>
        <Container>
          <h2 id="change-title" className={h2}>
            {changeIt.heading}
          </h2>
          <p className={prose}>
            {changeIt.before}
            <TextLink inline href={changeIt.link.href}>
              {changeIt.link.label}
            </TextLink>
            {changeIt.after}
          </p>
        </Container>
      </section>

      <section id="cost" aria-labelledby="cost-title" className={section}>
        <Container>
          <h2 id="cost-title" className={h2}>
            {whatItCosts.heading}
          </h2>
          <p className={prose}>{whatItCosts.body}</p>
        </Container>
      </section>

      <section id="coming-soon" aria-labelledby="coming-soon-title" className={section}>
        <Container>
          <h2 id="coming-soon-title" className={h2}>
            {comingSoon.heading}
          </h2>
          <p className={prose}>{comingSoon.body}</p>
        </Container>
      </section>

      <section id="protected-records" aria-labelledby="protected-records-title" className={section}>
        <Container>
          <h2 id="protected-records-title" className={h2}>
            {protectedRecords.heading}
          </h2>
          <p className={prose}>{protectedRecords.body}</p>
        </Container>
      </section>

      <section id="else" aria-labelledby="else-title" className={section}>
        <Container>
          <h2 id="else-title" className={h2}>
            {elseIBuild.heading}
          </h2>
          <p className={prose}>{elseIBuild.body}</p>
          <div className="mt-4">
            <TextLink href={elseIBuild.link.href}>{elseIBuild.link.label}</TextLink>
          </div>
        </Container>
      </section>

      <ClosingCta heading={<h2 className={h2}>{systemsClosing.heading}</h2>} body={systemsClosing.body}>
        <Button href={bookCallHref()}>{systemsClosing.cta}</Button>
      </ClosingCta>
    </div>
  );
}
