import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { ClosingCta } from "@/components/hl/ClosingCta";
import { Container } from "@/components/hl/Container";
import { PageHero } from "@/components/hl/PageHero";
import { TextLink } from "@/components/hl/TextLink";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { insightArticles, insightCategories, insightsClosing, insightsEmpty, insightsHero, insightsMeta } from "@/content/insights";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...insightsMeta, path: "/insights" });

/**
 * Insights index (docs/website-plan.md B5). There are no posts yet, so the category row stays hidden and only the
 * empty-state line shows. Once there are posts the row is static: "All" is current and the rest are plain labels, not links.
 */
export default function InsightsPage() {
  return (
    <div className="relative overflow-x-clip">
      <PageHero eyebrow={insightsHero.eyebrow} title={insightsHero.title} intro={insightsHero.intro} />

      <section aria-label="Articles" className="pb-12 md:pb-16">
        <Container>
          {insightArticles.length > 0 ? (
            <ul aria-label="Categories" className="mb-10 flex flex-wrap gap-x-7">
              {insightCategories.map((category, index) => {
                const active = index === 0;
                return (
                  <li
                    key={category}
                    aria-current={active ? "true" : undefined}
                    className={`inline-flex min-h-11 items-center font-ui text-chip font-medium ${active ? "underline decoration-rust decoration-link underline-offset-third-em" : "text-ink-2"}`}
                  >
                    {category}
                  </li>
                );
              })}
            </ul>
          ) : null}
          <p className="max-w-intro text-body">
            {insightsEmpty.body}{" "}
            <TextLink inline href={insightsEmpty.askLink.href}>
              {insightsEmpty.askLink.label}
            </TextLink>
          </p>
        </Container>
      </section>

      <ClosingCta heading={<h2 className="font-ui text-h2 font-bold">{insightsClosing.heading}</h2>}>
        <Button href={bookCallHref()}>{insightsClosing.cta}</Button>
      </ClosingCta>
    </div>
  );
}
