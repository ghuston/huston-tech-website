import type { Metadata } from "next";
import Link from "next/link";
import { BookCallButton } from "@/components/ui/BookCallButton";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { thanks } from "@/content/contact";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: thanks.title,
  description: thanks.description,
  path: "/contact/thanks",
  noindex: true,
});

export default function ThanksPage() {
  return (
    <>
      <PageHero eyebrow="Message received" title={thanks.heading} intro={<p>{thanks.body}</p>}>
        <BookCallButton label={thanks.pickTimeLabel} fullWidthOnMobile />
      </PageHero>
      <Section tone="paper">
        <p>
          {thanks.next}{" "}
          <Link href={thanks.nextLink.href} className="font-semibold text-sage underline underline-offset-4">
            {thanks.nextLink.label}
          </Link>
        </p>
      </Section>
    </>
  );
}
