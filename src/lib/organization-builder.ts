// No imports on purpose: Node's test runner loads this file directly (src/lib/organization-builder.test.ts).
// src/lib/site-organization.ts feeds it from the site settings. It is the template's organization-jsonld.ts, kept apart
// because this site's own organization-jsonld.ts (the homepage JSON-LD that ships today) imports site content by alias.

export type OrganizationJsonLdInput = {
  name?: string | null;
  /** Site origin, no path. */
  url?: string | null;
  description?: string | null;
  email?: string | null;
  /** Site-relative path to the logo, such as "/brand/logo.png". */
  logoPath?: string | null;
  founderName?: string | null;
  founderJobTitle?: string | null;
};

export type OrganizationJsonLd = {
  "@context": "https://schema.org";
  "@type": "Organization";
  "@id": string;
  name: string;
  url: string;
  logo?: string;
  description?: string;
  email?: string;
  founder?: { "@type": "Person"; name: string; jobTitle?: string };
};

/** A value is usable when it is a non-empty string with no [[placeholder]] in it. */
function usable(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim() !== "" && !value.includes("[[");
}

/**
 * Pure builder: plain strings in, a schema.org Organization out. Any field that is empty or still a placeholder is
 * left out. Returns null when the name or the URL is not usable, so the page renders no script at all.
 */
export function buildOrganizationJsonLd(input: OrganizationJsonLdInput): OrganizationJsonLd | null {
  const { name, description, email, logoPath, founderName, founderJobTitle } = input;
  const rawUrl = input.url;
  if (!usable(name) || !usable(rawUrl)) return null;
  const url = rawUrl.trim().replace(/\/+$/, "");
  if (!/^https?:\/\/[^/\s]+/.test(url)) return null;

  const data: OrganizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name: name.trim(),
    url,
  };
  if (usable(logoPath) && logoPath.trim().startsWith("/")) data.logo = `${url}${logoPath.trim()}`;
  if (usable(description)) data.description = description.trim();
  if (usable(email)) data.email = email.trim();
  if (usable(founderName)) {
    data.founder = { "@type": "Person", name: founderName.trim() };
    if (usable(founderJobTitle)) data.founder.jobTitle = founderJobTitle.trim();
  }
  return data;
}
