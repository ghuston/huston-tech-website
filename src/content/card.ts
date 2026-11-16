import { siteConfig } from "./site";

/**
 * The NFC business card at /card and the contact file at /grant.vcf. Copy: Grant's brief for the card (Nov 16, 2026),
 * not docs/website-plan.md Section B. The page is noindex and stays out of the nav and the sitemap.
 */
export const card = {
  meta: {
    title: "Grant Huston | Huston Logic",
    description: "Grant Huston, Founder, Huston Logic. Personal websites and software.",
  },
  name: "Grant Huston",
  givenName: "Grant",
  familyName: "Huston",
  jobTitle: "Founder",
  role: "Founder, Huston Logic",
  lines: ["Personal websites and software", "For the parts of the job you never signed up for"] as const,
  /** Grant's mobile number. The placeholder fails `npm run check:placeholders` until it is set. */
  phone: "[[+1-PHONE-PLACEHOLDER]]",
  email: siteConfig.email,
  saveLabel: "Save my contact ↓",
  vcardPath: "/grant.vcf",
  vcardFileName: "Grant-Huston.vcf",
  actions: { call: "Call", text: "Text", email: "Email" },
  links: [
    { label: "See my work →", href: "/" },
    { label: "Start a project →", href: "/contact" },
  ],
};
