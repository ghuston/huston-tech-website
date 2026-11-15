export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: "Services", href: "/services" },
  { label: "Past Work", href: "/past-work" },
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
];

export const footerNav: NavItem[] = [{ label: "Home", href: "/" }, ...mainNav, { label: "Contact", href: "/contact" }];

/**
 * Revision 7.1 navigation (docs/website-plan.md, A7). Not wired up yet: the v1 header and footer above still read
 * `mainNav` and `footerNav`, because /how-i-work, the #websites and #workflows anchors and the #hello band do not
 * exist until later PRs. The v3 header and footer (PR 5) switch to these two lists. A trailing "↘" jumps to a section.
 */
export const headerNav: NavItem[] = [
  { label: "How I work", href: "/how-i-work" },
  { label: "Websites", href: "/services#websites" },
  { label: "Workflows", href: "/services#workflows" },
  { label: "Past work", href: "/past-work" },
  { label: "About", href: "/about" },
  { label: "Say hello ↘", href: "/#hello" },
];

export const footerLinks: NavItem[] = [
  { label: "How I work", href: "/how-i-work" },
  { label: "Websites", href: "/services#websites" },
  { label: "Workflows", href: "/services#workflows" },
  { label: "Past work", href: "/past-work" },
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
];

export const partnerLink: NavItem = {
  label: "Zoho partners: need overflow help?",
  href: "/contact?topic=partner",
};

export const privacyLink: NavItem = { label: "Privacy", href: "/privacy" };
