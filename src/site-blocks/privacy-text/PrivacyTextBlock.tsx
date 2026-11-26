import { Container } from "@/components/hl/Container";
import { TextLink } from "@/components/hl/TextLink";
import { Text } from "@/components/ui/Text";
import { siteConfig } from "@/content/site";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { privacyTextDefinition } from "./definition";

export function PrivacyTextBlock({ content }: BlockProps<ContentOf<typeof privacyTextDefinition.fields>>) {
  return (
    <section>
      <Container>
        <div className="max-w-measure space-y-5 text-body">
          <p>
            {content.body}{" "}
            {siteConfig.email ? (
              <TextLink inline href={`mailto:${siteConfig.email}`}>
                {siteConfig.email}
              </TextLink>
            ) : null}
            . <Text>{content.lastUpdated}</Text>
          </p>
        </div>
      </Container>
    </section>
  );
}
