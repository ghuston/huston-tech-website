// The single list of site routes. The sitemap, the accessibility check (tests/a11y) and Lighthouse CI (lighthouserc.cjs)
// all read it, so a new page added here is listed for search engines and scanned by CI.
// No imports and no TypeScript-only syntax (enums, path aliases): Playwright and plain Node (type stripping) load it directly.

export const indexableRoutes = ["/", "/services", "/past-work", "/about", "/insights", "/contact", "/privacy"];

/** Real pages that stay out of the sitemap (noindex). */
export const noindexRoutes = ["/contact/thanks"];
