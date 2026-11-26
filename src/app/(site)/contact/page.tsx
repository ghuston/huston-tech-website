import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { Container } from "@/components/hl/Container";
import { ContactForm } from "@/components/hl/ContactForm";
import { PageHero } from "@/components/hl/PageHero";
import { TextLink } from "@/components/hl/TextLink";
import { ContactFlowArt } from "@/components/illustrations/BrandArt";
import { Text } from "@/components/ui/Text";
import { contactHero, contactMeta, scheduler, whatHappensNext } from "@/content/contact";
import { siteConfig } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...contactMeta, path: "/contact" });

const h2 = "font-ui text-head font-bold leading-tight tracking-head";

/** Contact (docs/website-plan.md B7, STYLE-GUIDE §7.32): the scheduler column, the note form, then what happens next. */
export default function ContactPage() {
  return (
    <div className="relative overflow-x-clip">
      <PageHero eyebrow={contactHero.eyebrow} title={contactHero.title} intro={contactHero.intro} />

      <section className="pb-12 md:pb-16">
        <Container className="grid items-start gap-12 split:grid-cols-[5fr_7fr] split:gap-12">
          <div id="book" className="scroll-mt-24">
            <h2 className={h2}>{scheduler.heading}</h2>
            <p className="mt-4 max-w-narrow text-body">{scheduler.body}</p>
            <div className="mt-6">
              {siteConfig.schedulerUrl ? (
                <Button href={siteConfig.schedulerUrl} fullWidthOnMobile>
                  {scheduler.buttonLabel}
                </Button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-13.5 w-full cursor-not-allowed items-center justify-center rounded-btn bg-ink/40 px-6 font-ui text-btn font-semibold text-white md:w-auto md:justify-start"
                  >
                    {scheduler.buttonLabel}
                  </button>
                  <p className="mt-4 text-small">
                    <Text>{scheduler.placeholder}</Text>
                  </p>
                </>
              )}
            </div>
            {/* The note's path, drawn: form → inbox, sheet row and reply. Beside the form only; on narrow screens the form comes first. */}
            <ContactFlowArt draw className="mt-14 hidden max-w-aside split:block" />
          </div>
          <ContactForm />
        </Container>
      </section>

      <section aria-labelledby="next-title" className="py-12 md:py-16">
        <Container>
          <h2 id="next-title" className="font-ui text-h2 font-bold">
            {whatHappensNext.heading}
          </h2>
          <ol className="mt-8 max-w-measure space-y-5 text-control leading-list">
            {whatHappensNext.steps.map((step, index) => (
              <li key={step.lead} className="flex gap-4">
                <span aria-hidden="true" className="w-6 shrink-0 font-ui text-item font-semibold text-green">
                  {index + 1}
                </span>
                <span>
                  <strong>{step.lead}</strong> {step.body}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 flex flex-wrap items-center gap-x-2 text-control">
            {whatHappensNext.emailLabel}{" "}
            {siteConfig.email ? (
              <TextLink inline href={`mailto:${siteConfig.email}`}>
                {siteConfig.email}
              </TextLink>
            ) : null}
          </p>
        </Container>
      </section>
    </div>
  );
}
