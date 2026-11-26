import { Container } from "@/components/hl/Container";
import { TextLink } from "@/components/hl/TextLink";
import { Text } from "@/components/ui/Text";
import { getBusiness } from "@/lib/settings";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { privacyTextDefinition } from "./definition";

export function PrivacyTextBlock({ content }: BlockProps<ContentOf<typeof privacyTextDefinition.fields>>) {
  const email = getBusiness().email.trim();
  return (
    <section>
      <Container>
        <div className="max-w-measure space-y-5 text-body">
          <p>
            {content.body}{" "}
            {email ? (
              <TextLink inline href={`mailto:${email}`}>
                {email}
              </TextLink>
            ) : null}
            . <Text>{content.lastUpdated}</Text>
          </p>
        </div>
      </Container>
    </section>
  );
}
