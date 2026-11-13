import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/metadata";
import { indexableRoutes } from "@/lib/routes";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return indexableRoutes.map((path) => ({ url: absoluteUrl(path) }));
}
