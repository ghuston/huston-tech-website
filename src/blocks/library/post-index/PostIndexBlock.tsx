import { Container } from "@/components/hl/Container";
import { Pager } from "@/components/hl/Pager";
import { PostCard } from "@/components/hl/PostCard";
import { Text } from "@/components/ui/Text";
import { blog } from "@/content/blog";
import { postPages } from "@/lib/blog";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { postIndexDefinition } from "./definition";

/** One page of the blog's post list (page 1 on /blog, page n on /blog/page/n), with the pager under it. */
export function PostIndexBlock({ content, variant, anchor, items, page = 1 }: BlockProps<ContentOf<typeof postIndexDefinition.fields>>) {
  const pages = postPages(items);
  const posts = pages[page - 1] ?? [];
  const cards = variant === "cards";
  return (
    <section id={anchor} className="scroll-mt-24">
      <Container>
        <h2 className="sr-only">{blog.indexHeading}</h2>
        {posts.length === 0 ? (
          <p className="max-w-intro text-body">
            <Text>{content.emptyText}</Text>
          </p>
        ) : (
          <ul role="list" className={cards ? "grid gap-x-12 gap-y-14 md:grid-cols-2 lg:grid-cols-3" : "border-b border-hairline"}>
            {posts.map((post) => (
              <li key={post.slug}>
                <PostCard post={post} layout={cards ? "card" : "row"} />
              </li>
            ))}
          </ul>
        )}
        <Pager page={page} total={pages.length} />
      </Container>
    </section>
  );
}
