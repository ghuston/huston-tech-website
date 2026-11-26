import { siteConfig } from "@/content/site";
import { getBrand, getBusiness } from "./settings";
import { buildOrganizationJsonLd, type OrganizationJsonLd } from "./organization-jsonld";

/**
 * Feeds the builder from the business details (business.json: name, email), the brand logo (brand.json) and site.config.ts (through site.ts, for the NEXT_PUBLIC_SITE_URL override). Each optional field
 * is passed only when the site shows it: the public email is in the footer, the founder's name is in the
 * footer brand line. The owner role is not shown anywhere on the site, so it is not passed (no jobTitle).
 */
export function organizationJsonLd(): OrganizationJsonLd | null {
  const business = getBusiness();
  return buildOrganizationJsonLd({
    name: business.name,
    url: siteConfig.url,
    description: siteConfig.oneLiner,
    email: business.email,
    logoPath: getBrand().logo?.src ?? null,
    founderName: siteConfig.founder,
  });
}
