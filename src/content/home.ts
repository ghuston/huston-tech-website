import { siteConfig } from "./site";

// Home's words are in src/content/pages/home.json (docs/website-rev8.md, B1). What stays here is read by other code:
// the page title and description (root layout, JSON-LD).

export const homeMeta = {
  title: "Huston Logic | Personal Software and Websites for Small Businesses",
  description: siteConfig.oneLiner,
};
