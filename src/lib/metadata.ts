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

export const OG_IMAGE_PATH = "/og.png";
export const OG_IMAGE_ALT = "Huston Tech: business systems and workflow help for small teams";

const ogImages = [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: OG_IMAGE_ALT }];

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path}`;
}

export function pageMetadata({ title, description, path, noindex = false }: PageMetaInput): Metadata {
  return {
    title: { absolute: title },
    alternates: { canonical: path },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
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
