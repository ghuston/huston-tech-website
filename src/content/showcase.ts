import type { BusinessData } from "../settings/business.ts";

/** The words of the /blocks page: the block showcase (not in the menu, search results or sitemap). */
export const showcase = {
  title: "Block showcase",
  description: "Every section design this site has, with example content.",
  intro: "Each section below shows one block and one of its designed variants with its example content. This page is not in the menu or in search results.",
  blockWord: "Block",
  variantWord: "variant",
} as const;

const open = { opens: "09:00", closes: "17:00" } as const;

/**
 * The business the /blocks showcase shows in the business-details block, so the example has a full address, phone, email,
 * hours and links to judge the design by, whatever the real business.json holds. Obviously example values (a reserved
 * example.com address and a fictional 555 number); nothing here reaches a real page.
 */
export const exampleBusiness: BusinessData = {
  name: "Example Business",
  phone: "(555) 010-0199",
  email: "hello@example.com",
  address: ["123 Example Street", "Sample City, ST 00000"],
  hours: { monday: open, tuesday: open, wednesday: open, thursday: open, friday: open, saturday: { opens: "10:00", closes: "14:00" }, sunday: "closed" },
  hoursNote: "Example hours only.",
  social: [
    { network: "instagram", url: "https://www.instagram.com/example" },
    { network: "linkedin", url: "https://www.linkedin.com/company/example" },
  ],
};
