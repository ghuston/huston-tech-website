import { homeMeta } from "@/content/home";
import { siteConfig } from "@/content/site";
import { getBusiness } from "./settings";

/** Square badge in public/brand (viewBox 760 x 760, SVG, so it scales past 112 px). */
const LOGO_PATH = "/brand/huston-logic-badge-black.svg";

/**
 * schema.org Organization for the homepage. Every value comes from `site.ts` or the homepage metadata; a field whose
 * source is empty is left out rather than guessed. The public email and the LinkedIn address come from business.json. The LinkedIn URL is the founder's `sameAs`, not the organization's.
 */
export function organizationJsonLd(): Record<string, unknown> {
  const business = getBusiness();
  const linkedIn = business.social.find((entry) => entry.network === "linkedin")?.url;
  const founder: Record<string, unknown> = { "@type": "Person", name: siteConfig.founder };
  if (linkedIn) founder.sameAs = linkedIn;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: business.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}${LOGO_PATH}`,
    description: homeMeta.description,
  };
  if (business.email.trim()) data.email = business.email.trim();
  data.founder = founder;
  return data;
}

// The template's pure builder, used by site-organization.ts. Nothing on this site's pages calls it yet.
export { buildOrganizationJsonLd, type OrganizationJsonLd, type OrganizationJsonLdInput } from "./organization-builder.ts";
