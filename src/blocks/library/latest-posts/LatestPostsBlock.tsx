import { Container } from "@/components/hl/Container";
import { PostCard } from "@/components/hl/PostCard";
import { TextLink } from "@/components/hl/TextLink";
import { Text } from "@/components/ui/Text";
import { resolveHref } from "@/blocks/links";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { latestPostsDefinition } from "./definition";

const DEFAULT_COUNT = 3;

/** The newest posts, as cards or rows. The renderer leaves the block out while no post is visible. */
export function LatestPostsBlock({ content, variant, anchor, headingId, items }: BlockProps<ContentOf<typeof latestPostsDefinition.fields>>) {
  const posts = items.slice(0, content.count ?? DEFAULT_COUNT);
  const cards = variant === "cards";
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24">
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          <Text>{content.heading}</Text>
        </h2>
        {content.intro ? (
          <p className="mt-6 max-w-intro text-body">
            <Text>{content.intro}</Text>
          </p>
        ) : null}
        <ul role="list" className={cards ? "mt-12 grid gap-x-12 gap-y-14 md:grid-cols-2 lg:grid-cols-3" : "mt-10 border-b border-hairline"}>
          {posts.map((post) => (
            <li key={post.slug}>
              <PostCard post={post} layout={cards ? "card" : "row"} />
            </li>
          ))}
        </ul>
        {content.action ? (
          <div className="mt-10">
            <TextLink href={resolveHref(content.action.href)}>{content.action.label}</TextLink>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
