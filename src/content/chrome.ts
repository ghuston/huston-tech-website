/** Words the site's frame and the business-details block announce or show that no page file holds. */
export const chrome = {
  noticeLabel: "Notice",
  footerNavLabel: "Footer",
  /** The logo link's accessible name; the business name comes first so a spoken "go to <name>" matches. */
  logoHomeLabel: (name: string) => `${name}, home`,
  addressHeading: "Address",
  contactHeading: "Contact",
  hoursHeading: "Hours",
} as const;
