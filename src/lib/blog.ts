// Pure blog rules: how posts split into index pages, how a date reads and the post's structured data. Import-free apart
// from type imports, so Node scripts (routes.ts), Next and the tests share it.
import type { BodyPart } from "../blocks/schema.ts";
import type { LoadedItem } from "../collections/schema.ts";

export const POSTS_PER_PAGE = 10;
export const BLOG_PATH = "/blog";

/** The fields of a post, as the content check guarantees them. */
export type PostData = {
  title: string;
  description: string;
  date: string;
  updated?: string;
  image?: { src: string; alt: string; focus?: "center" | "top" | "bottom" | "left" | "right" };
  body: BodyPart[];
};

export function postData(item: LoadedItem): PostData {
  return item.data as unknown as PostData;
}

/** Posts split into index pages of `perPage`, in the order given. There is always at least one page, so an empty blog still has /blog. */
export function postPages<T>(posts: readonly T[], perPage: number = POSTS_PER_PAGE): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < posts.length; i += perPage) pages.push(posts.slice(i, i + perPage));
  return pages.length === 0 ? [[]] : pages;
}

/** The page numbers that get their own address (/blog/page/<n>): 2 and up. Page 1 is /blog itself and is never generated twice. */
export function extraPageNumbers(postCount: number, perPage: number = POSTS_PER_PAGE): number[] {
  const count = postPages(new Array<unknown>(postCount), perPage).length;
  return Array.from({ length: count - 1 }, (_, i) => i + 2);
}

/** The address of an index page. */
export function indexPath(n: number): string {
  return n <= 1 ? BLOG_PATH : `${BLOG_PATH}/page/${n}`;
}

export function postPath(slug: string): string {
  return `${BLOG_PATH}/${slug}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-03-27" reads "March 27, 2026". Read from the text itself, never through a time zone. */
export function formatDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const month = m ? MONTHS[Number(m[2]) - 1] : undefined;
  return m && month ? `${month} ${Number(m[3])}, ${m[1]}` : date;
}

const hasPlaceholder = (text: string) => text.includes("[[");

/** BlogPosting structured data: the post's real title, dates and address only. No author, publisher or invented fields. Null while the title is a placeholder. */
export function postJsonLd(input: { url: string; title: string; date: string; updated?: string }): Record<string, unknown> | null {
  if (hasPlaceholder(input.title)) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    datePublished: input.date,
    ...(input.updated !== undefined && input.updated !== "" ? { dateModified: input.updated } : {}),
    url: input.url,
  };
}
