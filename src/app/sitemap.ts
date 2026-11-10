import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/metadata";

export const dynamic = "force-static";

const routes = ["/", "/services", "/past-work", "/about", "/insights", "/contact", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({ url: absoluteUrl(path) }));
}
