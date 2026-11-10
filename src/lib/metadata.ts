import type { Metadata } from "next";
import { siteConfig } from "@/content/site";

type PageMetaInput = {
  /** Full `<title>` text, exactly as specified in the content docs. */
  title: string;
  description: string;
  /** Route path starting with "/". Used for the canonical URL. */
  path: string;
  noindex?: boolean;
};

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path === "/" ? "" : path}`;
}

export function pageMetadata({ title, description, path, noindex = false }: PageMetaInput): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: "en_US",
      title,
      description,
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
