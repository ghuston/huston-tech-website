import { Container } from "@/components/hl/Container";
import { Text } from "@/components/ui/Text";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { readingGuideDefinition } from "./definition";

export function ReadingGuideBlock({ content }: BlockProps<ContentOf<typeof readingGuideDefinition.fields>>) {
  return (
    <Container>
      <div className="max-w-story rounded-panel border border-ink/10 bg-white px-8 py-7">
        <p className="font-ui text-copy font-semibold">{content.title}</p>
        <ul className="mt-4 space-y-3 text-control leading-list">
          {content.items.map((item) => (
            <li key={item}>
              <Text>{item}</Text>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
