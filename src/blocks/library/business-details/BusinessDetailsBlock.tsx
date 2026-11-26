import { Container } from "@/components/hl/Container";
import { HlLink } from "@/components/hl/HlLink";
import { Text } from "@/components/ui/Text";
import { chrome } from "@/content/chrome";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import { businessDetailsView } from "@/lib/chrome-view";
import { getBusiness } from "@/lib/settings";
import type { businessDetailsDefinition } from "./definition";

const labelClass = "font-ui text-small font-semibold uppercase tracking-wide text-ink-2";

/** The business's address, contact lines and opening hours, read from business.json. Empty parts are left out. */
export function BusinessDetailsBlock({ content, variant, anchor, headingId, business }: BlockProps<ContentOf<typeof businessDetailsDefinition.fields>>) {
  const view = businessDetailsView(business ?? getBusiness());
  const columns = variant === "columns";
  const hasHours = view.hours.length > 0 || view.hoursNote !== null;
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24">
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          <Text>{content.heading}</Text>
        </h2>
        <div className={`mt-10 grid gap-10 ${columns ? "md:grid-cols-3" : "max-w-measure"}`}>
          {view.address.length > 0 ? (
            <div>
              <h3 className={labelClass}>{chrome.addressHeading}</h3>
              <address className="mt-3 text-body not-italic">
                {view.address.map((line, index) => (
                  <p key={index}>
                    <Text>{line}</Text>
                  </p>
                ))}
              </address>
            </div>
          ) : null}
          {view.contact.length > 0 ? (
            <div>
              <h3 className={labelClass}>{chrome.contactHeading}</h3>
              <ul className="mt-3 text-body">
                {view.contact.map((line) => (
                  <li key={line.text}>
                    {line.href ? (
                      <HlLink href={line.href} className="inline-flex min-h-11 items-center underline underline-offset-4">
                        <Text>{line.text}</Text>
                      </HlLink>
                    ) : (
                      <Text>{line.text}</Text>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {hasHours ? (
            <div>
              <h3 className={labelClass}>{chrome.hoursHeading}</h3>
              {view.hours.length > 0 ? (
                <dl className="mt-3 text-body">
                  {view.hours.map((row) => (
                    <div key={row.days} className="flex flex-wrap gap-x-3">
                      <dt className="font-semibold">{row.days}</dt>
                      <dd>{row.time}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {view.hoursNote ? (
                <p className="mt-3 text-small text-ink-2">
                  <Text>{view.hoursNote}</Text>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
