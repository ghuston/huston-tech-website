import type { Metadata } from "next";
import { ContactEmail } from "@/components/ui/ContactEmail";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { privacy, privacyMeta } from "@/content/privacy";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...privacyMeta, path: "/privacy" });

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title={privacy.heading} />
      <Section tone="paper" prose>
        <div className="space-y-5">
          {privacy.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>
            {privacy.deletionLead} <ContactEmail />. <Text>{privacy.lastUpdated}</Text>
          </p>
          <p className="text-sm">
            <Text>{privacy.reviewNote}</Text>
          </p>
        </div>
      </Section>
    </>
  );
}
