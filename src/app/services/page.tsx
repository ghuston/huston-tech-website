import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { ClosingCta } from "@/components/hl/ClosingCta";
import { Container } from "@/components/hl/Container";
import { DotList } from "@/components/hl/DotList";
import { Faq } from "@/components/hl/Faq";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { PageHero } from "@/components/hl/PageHero";
import { SectionNav } from "@/components/hl/SectionNav";
import { TestimonialRow } from "@/components/hl/TestimonialRow";
import { TextLink } from "@/components/hl/TextLink";
import { ArtAside, ReviewRingArt, SiteFramesArt } from "@/components/illustrations/BrandArt";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { Text } from "@/components/ui/Text";
import {
  care,
  everyProject,
  faq,
  platforms,
  servicesClosingCta,
  servicesHero,
  servicesMeta,
  subNav,
  websites,
  whatIDontDo,
  workflows,
  type ServiceItem,
} from "@/content/services";
import { getTestimonials } from "@/content/testimonials";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...servicesMeta, path: "/services" });

const h2 = "font-ui text-h2 font-bold";
const h3 = "font-ui text-[28px] font-bold leading-tight tracking-[-0.03em]";
const h4 = "font-ui text-item font-semibold";
const section = "scroll-mt-12 py-12 md:py-16";

function ServiceBlock({ item, goodFitLabel, headingLevel }: { item: ServiceItem; goodFitLabel?: string; headingLevel: 3 | 4 }) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  return (
    <div id={item.id} className="scroll-mt-12 max-w-[64ch]">
      <Heading className={headingLevel === 3 ? h3 : h4}>{item.title}</Heading>
      {item.tagline ? <p className="mt-2 text-[17px] italic text-ink-2">{item.tagline}</p> : null}
      <p className="mt-3 text-[17px] leading-[1.55]">
        <Text>{item.paragraph}</Text>
      </p>
      {item.goodFit ? (
        <p className="mt-3 text-[17px] leading-[1.55]">
          <span className="font-ui font-semibold text-green">{goodFitLabel}</span> {item.goodFit}
        </p>
      ) : null}
      {item.afterFit ? (
        <p className="mt-3 text-[17px] leading-[1.55]">
          <em>{item.afterFit.em}</em>
          {item.afterFit.text ? ` ${item.afterFit.text}` : null}
        </p>
      ) : null}
    </div>
  );
}

/** Services, in the order of docs/website-plan.md B2 (Revision 7.1): H1, then one H2 per section; the bold labels in the copy are H3s and H4s. */
export default function ServicesPage() {
  const [quote] = getTestimonials("services");
  const { review, commonFixes, systemsWork } = workflows;

  return (
    <div className="relative overflow-x-clip">
      <PageHero
        eyebrow={servicesHero.eyebrow}
        title={servicesHero.title}
        intro={
          <>
            {servicesHero.intro.before}
            <TextLink inline href={servicesHero.intro.link.href}>
              {servicesHero.intro.link.label}
            </TextLink>
            {servicesHero.intro.after}
          </>
        }
      />
      <SectionNav sticky label="On this page" items={subNav} />

      <section id="websites" aria-labelledby="websites-title" className={section}>
        <Container>
          <ArtAside art={<SiteFramesArt draw />}>
            <h2 id="websites-title" className={h2}>
              <Text>{websites.heading}</Text>
            </h2>
            <div className="mt-5 max-w-[60ch] space-y-4 text-body">
              {websites.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </ArtAside>
          <h3 className={`${h3} mt-10`}>
            <Text>{websites.includesHeading}</Text>
          </h3>
          <DotList items={websites.includes} className="mt-5 max-w-[64ch]" />
          <div className="mt-8 max-w-[64ch] space-y-4 text-[17px] leading-[1.55]">
            {websites.details.map((detail) => (
              <p key={detail}>
                <Text>{detail}</Text>
              </p>
            ))}
          </div>
          <div className="mt-8">
            <Button href={websites.cta.href}>{websites.cta.label}</Button>
          </div>
        </Container>
      </section>

      <section id="workflows" aria-labelledby="workflows-title" className={section}>
        <Container>
          <FadingDivider className="mb-12 md:mb-16" />
          {/* Static: the Websites drawing above is this page's one draw-in. */}
          <ArtAside art={<ReviewRingArt />}>
            <h2 id="workflows-title" className={h2}>
              {workflows.heading}
            </h2>
            <p className="mt-5 max-w-[60ch] text-body">{workflows.intro}</p>

            <h3 className={`${h3} mt-10`}>{review.heading}</h3>
            <p className="mt-2 text-[17px] italic text-ink-2">({review.aside})</p>
            <p className="mt-4 max-w-[64ch] text-[17px] leading-[1.55]">{review.intro}</p>
            <DotList items={review.items} className="mt-4 max-w-[64ch]" />
            <div className="mt-6 max-w-[64ch] rounded-card bg-tint px-5 py-[18px] text-[17px] leading-[1.55]">
              <span className="font-ui font-semibold text-green">{review.stop.lead}</span> {review.stop.body}
            </div>
            <div className="mt-8">
              <Button href={review.cta.href}>{review.cta.label}</Button>
            </div>
          </ArtAside>

          <h3 id="fixes" className={`${h3} mt-20 scroll-mt-12`}>
            {commonFixes.heading}
          </h3>
          <div className="mt-8">
            {commonFixes.items.map((item, index) => (
              <div key={item.title}>
                {index > 0 ? <FadingDivider className="my-12" /> : null}
                <ServiceBlock item={item} goodFitLabel={commonFixes.goodFitLabel} headingLevel={4} />
              </div>
            ))}
          </div>

          <h3 id="systems" className={`${h3} mt-20 scroll-mt-12`}>
            {systemsWork.heading}
          </h3>
          <div className="mt-8">
            {systemsWork.items.map((item, index) => (
              <div key={item.title}>
                {index > 0 ? <FadingDivider className="my-12" /> : null}
                <ServiceBlock item={item} headingLevel={4} />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="care" aria-labelledby="care-title" className={section}>
        <Container>
          <FadingDivider className="mb-12 md:mb-16" />
          <h2 id="care-title" className={h2}>
            {care.heading}
          </h2>
          <div className="mt-8">
            {care.items.map((item, index) => (
              <div key={item.title}>
                {index > 0 ? <FadingDivider className="my-12" /> : null}
                <ServiceBlock item={item} headingLevel={3} />
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-[64ch] text-[17px] leading-[1.55]">{care.closing}</p>
        </Container>
      </section>

      <section aria-labelledby="every-project-title" className={section}>
        <Container>
          <FadingDivider className="mb-12 md:mb-16" />
          <h2 id="every-project-title" className={h2}>
            {everyProject.heading}
          </h2>
          <div className="mt-8 grid gap-12 md:grid-cols-3 md:gap-10 lg:gap-16">
            {everyProject.groups.map((group) => (
              <div key={group.label}>
                <h3 className={h3}>{group.label}</h3>
                <DotList items={group.items} className="mt-5" />
              </div>
            ))}
          </div>
          {quote ? (
            <div className="mt-12">
              <TestimonialRow testimonials={[quote]} />
            </div>
          ) : null}
        </Container>
      </section>

      <section aria-labelledby="platforms-title" className={section}>
        <Container>
          <FadingDivider className="mb-12 md:mb-16" />
          <h2 id="platforms-title" className={h2}>
            {platforms.heading}
          </h2>
          <p className="mt-5 max-w-[64ch] text-body">
            <Text>{platforms.body}</Text>
          </p>
        </Container>
      </section>

      <section aria-labelledby="dont-title" className={section}>
        <Container>
          <h2 id="dont-title" className={h2}>
            {whatIDontDo.heading}
          </h2>
          <p className="mt-5 max-w-[64ch] text-body">{whatIDontDo.body}</p>
        </Container>
      </section>

      <section id="faq" aria-labelledby="faq-title" className={section}>
        <Container>
          <FadingDivider className="mb-12 md:mb-16" />
          <h2 id="faq-title" className={h2}>
            {faq.heading}
          </h2>
          <div className="mt-8 max-w-[860px]">
            <Faq items={faq.items} />
          </div>
        </Container>
      </section>

      <ClosingCta heading={<h2 className={h2}>{servicesClosingCta.heading}</h2>} body={servicesClosingCta.body}>
        <Button href={bookCallHref()}>{servicesClosingCta.cta}</Button>
      </ClosingCta>
    </div>
  );
}
