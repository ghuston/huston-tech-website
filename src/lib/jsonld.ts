import { siteConfig } from "@/content/site";

/** Facts only from the approved content docs: name, URL, what the business does, and the founder. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteConfig.url}/#business`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.oneLiner,
    founder: { "@type": "Person", name: siteConfig.founder },
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteConfig.url}/about#grant`,
    name: siteConfig.founder,
    jobTitle: "Business systems consultant",
    url: `${siteConfig.url}/about`,
    worksFor: { "@id": `${siteConfig.url}/#business` },
  };
}
