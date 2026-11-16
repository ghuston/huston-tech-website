import type { Metadata } from "next";
import { Container } from "@/components/hl/Container";
import { PageHero } from "@/components/hl/PageHero";
import { TextLink } from "@/components/hl/TextLink";
import { Text } from "@/components/ui/Text";
import { privacy, privacyMeta } from "@/content/privacy";
import { siteConfig } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...privacyMeta, path: "/privacy" });

export default function PrivacyPage() {
  return (
    <div className="relative overflow-x-clip">
      <PageHero title={privacy.heading} />
      <section className="pb-16 md:pb-24">
        <Container>
          <div className="max-w-[64ch] space-y-5 text-body">
            <p>
              {privacy.body}{" "}
              {siteConfig.email ? (
                <TextLink inline href={`mailto:${siteConfig.email}`}>
                  {siteConfig.email}
                </TextLink>
              ) : null}
              . <Text>{privacy.lastUpdated}</Text>
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}
