import { homeMeta } from "@/content/home";
import { siteConfig } from "@/content/site";

/** Square badge in public/brand (viewBox 760 x 760, SVG, so it scales past 112 px). */
const LOGO_PATH = "/brand/huston-logic-badge-black.svg";

/**
 * schema.org Organization for the homepage. Every value comes from `site.ts` or the homepage metadata; a field whose
 * source is empty is left out rather than guessed. The LinkedIn URL is the founder's `sameAs`, not the organization's.
 */
export function organizationJsonLd(): Record<string, unknown> {
  const founder: Record<string, unknown> = { "@type": "Person", name: siteConfig.founder };
  if (siteConfig.linkedInUrl) founder.sameAs = siteConfig.linkedInUrl;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}${LOGO_PATH}`,
    description: homeMeta.description,
  };
  if (siteConfig.email) data.email = siteConfig.email;
  data.founder = founder;
  return data;
}

// The template's pure builder, used by site-organization.ts. Nothing on this site's pages calls it yet.
export { buildOrganizationJsonLd, type OrganizationJsonLd, type OrganizationJsonLdInput } from "./organization-builder.ts";
