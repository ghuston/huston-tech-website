import { Container } from "@/components/hl/Container";
import { TextLink } from "@/components/hl/TextLink";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { insightsIndexDefinition } from "./definition";

/**
 * Insights index (docs/website-plan.md B5). There are no articles yet (`items` is empty: this block has no collection),
 * so the category row stays hidden and only the empty-state line shows. Once there are articles the row is static:
 * "All" is current and the rest are plain labels, not links.
 */
export function InsightsIndexBlock({ content, items }: BlockProps<ContentOf<typeof insightsIndexDefinition.fields>>) {
  return (
    <section aria-label="Articles">
      <Container>
        {items.length > 0 ? (
          <ul aria-label="Categories" className="mb-10 flex flex-wrap gap-x-7">
            {content.categories.map((category, index) => {
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
          {content.emptyText}{" "}
          <TextLink inline href={content.askLink.href}>
            {content.askLink.label}
          </TextLink>
        </p>
      </Container>
    </section>
  );
}
