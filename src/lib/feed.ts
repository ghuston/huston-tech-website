// The RSS feed text for /blog/feed.xml (RSS 2.0, summaries only). Pure and import-free apart from types. Live posts only,
// in any build: a draft never reaches a feed.
import type { LoadedItem } from "../collections/schema.ts";
import { BLOG_PATH, postPath } from "./blog.ts";

/** Escapes the five characters XML text and attributes cannot hold as they are. */
export function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

const plain = (text: unknown): string => (typeof text === "string" ? text.replace(/\*\*/g, "") : "");
const rfc822 = (date: string): string => new Date(`${date}T00:00:00Z`).toUTCString();

export type FeedSite = { name: string; description: string; url: string };

/** The feed: one `item` per live post (newest first as given), with absolute links built from the site address. */
export function rssFeed({ site, posts }: { site: FeedSite; posts: readonly LoadedItem[] }): string {
  const origin = site.url.replace(/\/+$/, "");
  const items = posts
    // The one live filter: the feed never carries a draft, whatever the caller passes.
    .filter((post) => post.kind === "posts" && post.status === "live")
    .map((post) => {
      const link = `${origin}${postPath(post.slug)}`;
      return [
        "    <item>",
        `      <title>${xmlEscape(plain(post.data["title"]))}</title>`,
        `      <link>${xmlEscape(link)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(link)}</guid>`,
        `      <pubDate>${rfc822(plain(post.data["date"]))}</pubDate>`,
        `      <description>${xmlEscape(plain(post.data["description"]))}</description>`,
        "    </item>",
      ].join("\n");
    });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xmlEscape(plain(site.name))}</title>`,
    `    <link>${xmlEscape(`${origin}${BLOG_PATH}`)}</link>`,
    `    <description>${xmlEscape(plain(site.description))}</description>`,
    `    <atom:link href="${xmlEscape(`${origin}${BLOG_PATH}/feed.xml`)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
