import type { LoadedItem } from "@/collections/schema";
import { blog } from "@/content/blog";
import { formatDate, postData, postPath } from "@/lib/blog";
import { Text } from "@/components/ui/Text";
import { Eyebrow } from "./Eyebrow";
import { HlLink } from "./HlLink";
import { Photo } from "./Photo";

const CARD_SIZES = "(min-width: 1320px) 380px, (min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw";

/** The tag a draft carries outside production builds. */
export function DraftTag() {
  return <span className="rounded-pill border border-rust px-2.5 py-1 text-tag font-medium text-rust">{blog.draftTag}</span>;
}

function PostTime({ date, className = "" }: { date: string; className?: string }) {
  return (
    <time dateTime={date} className={className}>
      {formatDate(date)}
    </time>
  );
}

/**
 * One post in a list: a `card` (photo on top, or a tint panel with the date when there is no photo, so a row of cards keeps
 * one shape; on phones that panel gives way to the date as an eyebrow) or a `row` (date, title and summary between hairlines). The title is the link; it stretches over the whole item.
 */
export function PostCard({ post, layout }: { post: LoadedItem; layout: "card" | "row" }) {
  const data = postData(post);
  const draft = post.status === "draft";
  const title = (
    <HlLink href={postPath(post.slug)} className="after:absolute after:inset-0">
      <span className="hl-u">
        <Text>{data.title}</Text>
      </span>
    </HlLink>
  );
  if (layout === "row") {
    return (
      <article className="relative grid gap-2 border-t border-hairline py-8 md:grid-cols-[12rem_1fr] md:gap-10">
        <p className="font-ui text-small font-medium text-ink-2">
          <PostTime date={data.date} />
        </p>
        <div>
          {draft ? <p className="mb-3"><DraftTag /></p> : null}
          <h3 className="font-ui text-item font-semibold">{title}</h3>
          <p className="mt-2 max-w-measure text-list">
            <Text>{data.description}</Text>
          </p>
        </div>
      </article>
    );
  }
  return (
    <article className="relative">
      {data.image ? (
        <Photo image={data.image} shape="3:2" sizes={CARD_SIZES} />
      ) : (
        // From tablet width up the date sits on a tint panel so a row of cards keeps one shape; on phones the panel would
        // be an empty block per card, so the date moves above the title as an eyebrow instead.
        <div className="hidden aspect-photo-3-2 w-full items-end rounded-card bg-tint p-6 md:flex">
          <PostTime date={data.date} className="font-ui text-item font-semibold text-green" />
        </div>
      )}
      <div className={`${data.image ? "mt-5" : "md:mt-5"} flex flex-wrap items-center gap-3`}>
        {data.image ? <PostTime date={data.date} className="font-ui text-small font-medium text-ink-2" /> : null}
        {data.image ? null : (
          <Eyebrow className="md:hidden">
            <PostTime date={data.date} />
          </Eyebrow>
        )}
        {draft ? <DraftTag /> : null}
      </div>
      <h3 className="mt-2 font-ui text-item font-semibold">{title}</h3>
      <p className="mt-2 text-list">
        <Text>{data.description}</Text>
      </p>
    </article>
  );
}
