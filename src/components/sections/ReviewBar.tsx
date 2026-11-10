import Link from "next/link";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { Container } from "@/components/ui/Container";
import { reviewBar } from "@/content/home";
import { siteConfig } from "@/content/site";
import { withPrice } from "@/lib/framework";

/** Slim band under the compact framework that names the first paid step. Copy switches on `siteConfig.reviewPrice`. */
export function ReviewBar() {
  const priced = siteConfig.reviewPrice !== null;
  const copy = priced ? reviewBar.priced : reviewBar.default;
  const lead = priced ? withPrice(reviewBar.priced.lead) : reviewBar.default.lead;
  const body = priced ? withPrice(reviewBar.priced.body) : reviewBar.default.body;
  const href = priced ? bookCallHref() : reviewBar.default.link.href;

  return (
    <aside aria-label="Workflow Review" className="border-y border-line bg-surface">
      <Container className="flex flex-col gap-1 py-4 lg:min-h-[4.5rem] lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <p className="text-ink/90">
          <strong>{lead}</strong> {body}
        </p>
        <Link
          href={href}
          className="inline-flex min-h-11 shrink-0 items-center font-semibold text-sage underline underline-offset-4"
        >
          {copy.link.label}
        </Link>
      </Container>
    </aside>
  );
}
