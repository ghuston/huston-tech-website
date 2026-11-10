export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: "Services", href: "/services" },
  { label: "Past Work", href: "/past-work" },
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
];

export const footerNav: NavItem[] = [{ label: "Home", href: "/" }, ...mainNav, { label: "Contact", href: "/contact" }];

export const partnerLink: NavItem = {
  label: "Zoho partners: need overflow help?",
  href: "/contact?topic=partner",
};

export const privacyLink: NavItem = { label: "Privacy", href: "/privacy" };
