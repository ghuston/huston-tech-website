import type { Metadata } from "next";
import { siteConfig } from "@/content/site";

type PageMetaInput = {
  /** Full `<title>` text, exactly as specified in the content docs. */
  title: string;
  description: string;
  /** Route path starting with "/". Used for the canonical URL. */
  path: string;
  noindex?: boolean;
  /** An article (a blog post): sets og:type article and the published time. */
  article?: { publishedTime: string; modifiedTime?: string };
  /** Adds the RSS feed as an alternate link. */
  feed?: boolean;
};

export const FEED_PATH = "/blog/feed.xml";
export const OG_IMAGE_PATH = "/og.png";
export const OG_IMAGE_ALT = "Huston Logic: Personal websites and software.";

const ogImages = [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: OG_IMAGE_ALT }];

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path}`;
}

export function pageMetadata({ title, description, path, noindex = false, article, feed = false }: PageMetaInput): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path, ...(feed ? { types: { "application/rss+xml": FEED_PATH } } : {}) },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      ...(article === undefined
        ? { type: "website" as const }
        : { type: "article" as const, publishedTime: article.publishedTime, ...(article.modifiedTime === undefined ? {} : { modifiedTime: article.modifiedTime }) }),
      siteName: siteConfig.name,
      locale: "en_US",
      title,
      description,
      url: path,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}
