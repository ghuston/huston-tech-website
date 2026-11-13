// The single list of site routes. The sitemap and the accessibility check (tests/a11y) both read it,
// so a new page added here is listed for search engines and scanned by CI. No imports: Playwright loads it directly.

export const indexableRoutes = ["/", "/services", "/past-work", "/about", "/insights", "/contact", "/privacy"];

/** Real pages that stay out of the sitemap (noindex). */
export const noindexRoutes = ["/contact/thanks"];
