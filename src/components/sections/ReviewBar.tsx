import { bookCallHref } from "@/components/ui/BookCallButton";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { reviewBar } from "@/content/home";
import { siteConfig } from "@/content/site";
import { withPrice } from "@/lib/framework";

/** Pale band under the framework strip that names the first paid step. Copy switches on `siteConfig.reviewPrice`. */
export function ReviewBar() {
  const priced = siteConfig.reviewPrice !== null;
  const copy = priced ? reviewBar.priced : reviewBar.default;
  const lead = priced ? withPrice(reviewBar.priced.lead) : reviewBar.default.lead;
  const body = priced ? withPrice(reviewBar.priced.body) : reviewBar.default.body;
  const href = priced ? bookCallHref() : reviewBar.default.link.href;

  return (
    <aside aria-label="Workflow Review" className="border-t border-rule bg-sage-tint">
      <Container className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between md:gap-10 lg:py-9">
        <div>
          <p className="font-sans text-xl font-bold tracking-tight sm:text-2xl">{lead}</p>
          <p className="mt-1 max-w-[40rem] text-base text-ink">{body}</p>
        </div>
        <Button href={href} fullWidthOnMobile className="shrink-0">
          {copy.link.label}
        </Button>
      </Container>
    </aside>
  );
}
