import { siteConfig } from "@/content/site";

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteConfig.url}/about#grant`,
    name: siteConfig.founder,
    jobTitle: "Business systems consultant",
    url: `${siteConfig.url}/about`,
    worksFor: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
  };
}
