import { Card } from "@/components/hl/Card";
import { Container } from "@/components/hl/Container";
import { Text } from "@/components/ui/Text";
import { itemText } from "@/blocks/list-format";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { testimonialsDefinition } from "./definition";

const MAX_COUNT = 12;

type Quote = { slug: string; quote: string; name: string; role?: string; organization?: string };

/** Name (small, UI weight), then role and business in the quieter ink, under the quote. A testimonial is never shown without its name. */
function Attribution({ quote }: { quote: Quote }) {
  const detail = [quote.role, quote.organization].filter((part): part is string => part !== undefined);
  return (
    <figcaption className="mt-6">
      <p className="font-ui text-small font-semibold">
        <Text>{quote.name}</Text>
      </p>
      {detail.length > 0 ? (
        <p className="mt-1 text-small text-ink-2">
          <Text>{detail.join(", ")}</Text>
        </p>
      ) : null}
    </figcaption>
  );
}

/** Quotes from named clients, in the order the collection sets. `grid` boxes each one; `feature` sets the first large. */
export function TestimonialsBlock({ content, variant, anchor, headingId, items }: BlockProps<ContentOf<typeof testimonialsDefinition.fields>>) {
  const quotes = items.slice(0, content.count ?? MAX_COUNT).flatMap((item): Quote[] => {
    const quote = itemText(item.data, "quote");
    const name = itemText(item.data, "name");
    if (quote === undefined || name === undefined) return [];
    return [{ slug: item.slug, quote, name, role: itemText(item.data, "role"), organization: itemText(item.data, "organization") }];
  });
  const [first, ...rest] = quotes;
  const feature = variant === "feature";
  // Three columns only when there are three or more quotes, so two never sit beside an empty column.
  const three = quotes.length >= 3;
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24">
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          <Text>{content.heading}</Text>
        </h2>
        {feature && first ? (
          <>
            <figure className="mt-12">
              <blockquote className="max-w-title font-voice text-h3 italic leading-snug">
                <p>
                  <Text>{first.quote}</Text>
                </p>
              </blockquote>
              <Attribution quote={first} />
            </figure>
            {rest.length > 0 ? (
              <ul role="list" className={`mt-14 grid gap-6 md:grid-cols-2 ${rest.length >= 3 ? "lg:grid-cols-3" : ""}`}>
                {rest.map((quote) => (
                  <li key={quote.slug}>
                    <Card as="figure" className="h-full p-8">
                      <blockquote className="font-voice text-quote italic">
                        <p>
                          <Text>{quote.quote}</Text>
                        </p>
                      </blockquote>
                      <Attribution quote={quote} />
                    </Card>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <ul role="list" className={`mt-12 grid gap-6 md:grid-cols-2 ${three ? "lg:grid-cols-3" : ""}`}>
            {quotes.map((quote) => (
              <li key={quote.slug}>
                <Card as="figure" className="h-full p-8">
                  <blockquote className="font-voice text-quote italic">
                    <p>
                      <Text>{quote.quote}</Text>
                    </p>
                  </blockquote>
                  <Attribution quote={quote} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
