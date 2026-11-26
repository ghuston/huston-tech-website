import { Container } from "@/components/hl/Container";
import { PageHero } from "@/components/hl/PageHero";
import { HlLink } from "@/components/hl/HlLink";
import { Photo } from "@/components/hl/Photo";
import { PostBody } from "@/components/hl/PostBody";
import { DraftTag } from "@/components/hl/PostCard";
import { JsonLd } from "@/components/ui/JsonLd";
import type { LoadedItem } from "@/collections/schema";
import { blog } from "@/content/blog";
import { BLOG_PATH, formatDate, postData, postJsonLd, postPath } from "@/lib/blog";
import { absoluteUrl } from "@/lib/metadata";

/** One post page: the hero (the date as the eyebrow, the title, the summary as the lede, a link back to the blog), an optional photo and the body in a reading-width column. */
export function PostArticle({ post }: { post: LoadedItem }) {
  const data = postData(post);
  const jsonLd = post.status === "live" ? postJsonLd({ url: absoluteUrl(postPath(post.slug)), title: data.title, date: data.date, updated: data.updated }) : null;
  const eyebrow = (
    <>
      <time dateTime={data.date}>{formatDate(data.date)}</time>
      {data.updated ? (
        <>
          {" · "}
          {blog.updatedWord} <time dateTime={data.updated}>{formatDate(data.updated)}</time>
        </>
      ) : null}
    </>
  );
  return (
    <article className="relative overflow-x-clip pb-16 md:pb-24">
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <PageHero eyebrow={eyebrow} title={data.title} intro={data.description}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* At the top, not after the body: scrolled to the end of a short post, a link there sat under the sticky header. */}
          <HlLink href={BLOG_PATH} className="inline-flex min-h-11 items-center font-ui font-medium text-green">
            <span className="hl-u">{blog.backToBlog}</span>
          </HlLink>
          {post.status === "draft" ? <DraftTag /> : null}
        </div>
      </PageHero>
      <Container>
        <div className="max-w-measure">
          {data.image ? <Photo image={data.image} shape="3:2" sizes="(min-width: 1024px) 700px, 100vw" lead /> : null}
          <div className={data.image ? "mt-10" : ""}>
            <PostBody parts={data.body} />
          </div>
        </div>
      </Container>
    </article>
  );
}
