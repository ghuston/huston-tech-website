import type { Metadata } from "next";
import { BookCallButton } from "@/components/ui/BookCallButton";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { notFound } from "@/content/contact";

export const metadata: Metadata = {
  title: { absolute: notFound.title },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PageHero eyebrow="404" title={notFound.heading} intro={<p>{notFound.body}</p>}>
      <Button href="/" variant="secondary" fullWidthOnMobile>
        {notFound.homeLabel}
      </Button>
      <BookCallButton label="Book a free call" fullWidthOnMobile />
    </PageHero>
  );
}
