export type NavItem = { label: string; href: string };

/** Revision 8 navigation (docs/website-rev8.md, Section A). Say hello jumps to the doors on Home. */
export const headerNav: NavItem[] = [
  { label: "How I work", href: "/how-i-work" },
  { label: "Websites", href: "/services#websites" },
  { label: "Systems", href: "/systems" },
  { label: "Past work", href: "/past-work" },
  { label: "About", href: "/about" },
  { label: "Say hello ↘", href: "/#hello" },
];

export const footerLinks: NavItem[] = [
  { label: "How I work", href: "/how-i-work" },
  { label: "Websites", href: "/services#websites" },
  { label: "Systems", href: "/systems" },
  { label: "Past work", href: "/past-work" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const privacyLink: NavItem = { label: "Privacy", href: "/privacy" };

/** The mobile menu button's text (docs/STYLE-GUIDE.md §7.1); `aria-expanded` says whether it is open. */
export const menuLabel = "Menu";
