import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { Container } from "@/components/hl/Container";
import { PageHero } from "@/components/hl/PageHero";
import { TextLink } from "@/components/hl/TextLink";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { thanks } from "@/content/contact";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: thanks.title,
  description: thanks.description,
  path: "/contact/thanks",
  noindex: true,
});

/** Thanks (docs/website-plan.md B7b). The "Or read:" article line waits for the first published article. */
export default function ThanksPage() {
  return (
    <div className="hl relative overflow-x-clip">
      <PageHero title={thanks.heading} intro={thanks.body}>
        <Button href={bookCallHref()} fullWidthOnMobile>
          {thanks.pickTimeLabel}
        </Button>
      </PageHero>
      <section className="pb-16 md:pb-24">
        <Container>
          <div className="max-w-[64ch] space-y-3 text-body">
            <p>
              {thanks.after.lead}{" "}
              <TextLink inline href={thanks.after.href}>
                {thanks.after.label}
              </TextLink>
            </p>
            <p>
              {thanks.meanwhile.lead}{" "}
              {thanks.meanwhile.links.map((link, index) => (
                <span key={link.href}>
                  {index > 0 ? " · " : ""}
                  <TextLink inline href={link.href}>
                    {link.label}
                  </TextLink>
                </span>
              ))}
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}
