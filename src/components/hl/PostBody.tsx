import type { BodyPart, Inline } from "@/blocks/schema";
import { resolveHref } from "@/blocks/links";
import { Text } from "@/components/ui/Text";
import { HlLink } from "./HlLink";
import { Photo } from "./Photo";

function InlineText({ text }: { text: Inline }) {
  if (typeof text === "string") return <Text>{text}</Text>;
  return (
    <>
      {text.map((part, index) =>
        typeof part === "string" ? (
          <Text key={index}>{part}</Text>
        ) : (
          <HlLink key={index} href={resolveHref(part.href)} className="text-inherit underline decoration-ink/35 underline-offset-quarter-em">
            <Text>{part.text}</Text>
          </HlLink>
        ),
      )}
    </>
  );
}

/** A post's body parts as designed text: level 2 and 3 headings, paragraphs, lists, quotes and photos. Rendered as React text only. */
export function PostBody({ parts }: { parts: readonly BodyPart[] }) {
  return (
    <div className="text-body">
      {parts.map((part, index) => {
        switch (part.type) {
          case "heading":
            return part.level === 2 ? (
              <h2 key={index} className="mt-12 font-ui text-card-title font-bold first:mt-0">
                <Text>{part.text}</Text>
              </h2>
            ) : (
              <h3 key={index} className="mt-8 font-ui text-subhead font-bold first:mt-0">
                <Text>{part.text}</Text>
              </h3>
            );
          case "paragraph":
            return (
              <p key={index} className="mt-5 first:mt-0">
                <InlineText text={part.text} />
              </p>
            );
          case "list": {
            const Tag = part.style === "number" ? "ol" : "ul";
            return (
              <Tag key={index} className={`mt-5 space-y-2 pl-6 marker:text-green first:mt-0 ${part.style === "number" ? "list-decimal" : "list-disc"}`}>
                {part.items.map((item, i) => (
                  <li key={i} className="pl-1">
                    <InlineText text={item} />
                  </li>
                ))}
              </Tag>
            );
          }
          case "quote":
            return (
              <figure key={index} className="mt-10 border-l-2 border-green pl-6 first:mt-0">
                <blockquote className="font-voice text-quote italic">
                  <p>
                    <Text>{part.text}</Text>
                  </p>
                </blockquote>
                {part.source ? (
                  <figcaption className="mt-3 font-ui text-small font-medium text-ink-2">
                    <Text>{part.source}</Text>
                  </figcaption>
                ) : null}
              </figure>
            );
          case "photo":
            return (
              <figure key={index} className="mt-10 first:mt-0">
                <Photo image={part.image} shape="3:2" sizes="(min-width: 1024px) 700px, 100vw" />
                {part.caption ? (
                  <figcaption className="mt-3 text-small text-ink-2">
                    <Text>{part.caption}</Text>
                  </figcaption>
                ) : null}
              </figure>
            );
        }
      })}
    </div>
  );
}
