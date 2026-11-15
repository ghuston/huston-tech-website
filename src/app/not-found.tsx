import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { PageHero } from "@/components/hl/PageHero";
import { TextLink } from "@/components/hl/TextLink";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { notFound } from "@/content/contact";

export const metadata: Metadata = {
  title: { absolute: notFound.title },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="hl relative overflow-x-clip">
      <PageHero title={notFound.heading} intro={notFound.body} dotOut>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Button href="/">{notFound.homeLabel}</Button>
          <TextLink href={bookCallHref()}>{notFound.callLabel}</TextLink>
        </div>
      </PageHero>
    </div>
  );
}
