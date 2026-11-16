export type NavItem = { label: string; href: string };

/**
 * Revision 7.1 navigation (docs/website-plan.md, A7 and B10). The Websites and Workflows links point at anchors on
 * /services, and Say hello at the Contact page.
 */
export const headerNav: NavItem[] = [
  { label: "How I work", href: "/how-i-work" },
  { label: "Websites", href: "/services#websites" },
  { label: "Workflows", href: "/services#workflows" },
  { label: "Past work", href: "/past-work" },
  { label: "About", href: "/about" },
  { label: "Say hello →", href: "/contact" },
];

export const footerLinks: NavItem[] = [
  { label: "How I work", href: "/how-i-work" },
  { label: "Websites", href: "/services#websites" },
  { label: "Workflows", href: "/services#workflows" },
  { label: "Past work", href: "/past-work" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const partnerLink: NavItem = {
  label: "Zoho partners: need overflow help?",
  href: "/contact?topic=partner",
};

export const privacyLink: NavItem = { label: "Privacy", href: "/privacy" };

/** The mobile menu button's text (docs/STYLE-GUIDE.md §7.1); `aria-expanded` says whether it is open. */
export const menuLabel = "Menu";
