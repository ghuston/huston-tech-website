// Pure helpers that turn the settings files into what the header, footer, notice and business-details block show.
// No React, no file reads, so they have plain tests (chrome-view.test.ts).
import type { Logo } from "../settings/brand.ts";
import { SOCIAL_NETWORKS, formatHours, telHref, type BusinessData } from "../settings/business.ts";
import { noticeShows, todayIn, type NoticeData } from "../settings/notice.ts";

/** Where the logo shows; the image is scaled to this height in pixels (docs: ruling 20). */
export const LOGO_HEIGHT = { header: 40, footer: 36 } as const;

export type LogoImage = { src: string; alt: string; width: number; height: number };

/** The logo image at the height of its place, width kept in proportion; null when the business name is shown as text. */
export function logoImage(logo: Logo | null, place: keyof typeof LOGO_HEIGHT): LogoImage | null {
  if (logo === null) return null;
  const height = LOGO_HEIGHT[place];
  return { src: logo.src, alt: logo.alt, width: Math.round((logo.width / logo.height) * height), height };
}

const REAL_EMAIL = /^[^\s@[\]]+@[^\s@[\]]+\.[^\s@[\]]+$/;

export type ContactLine = { text: string; href: string | null };

/** The phone and email as shown. A line is left out when empty; its link is null for a [[placeholder]] or anything that is not real. */
export function contactLines(business: BusinessData): { phone: ContactLine | null; email: ContactLine | null } {
  const phone = business.phone.trim();
  const email = business.email.trim();
  return {
    phone: phone === "" ? null : { text: phone, href: telHref(phone) },
    email: email === "" ? null : { text: email, href: REAL_EMAIL.test(email) ? `mailto:${email}` : null },
  };
}

/** The social links as text: the network's name and its address, in the order the owner wrote them. */
export function socialLinks(business: BusinessData): { label: string; url: string }[] {
  return business.social.map((entry) => ({ label: SOCIAL_NETWORKS.find((n) => n.id === entry.network)?.label ?? entry.network, url: entry.url }));
}

export type BusinessDetailsView = {
  address: string[];
  contact: ContactLine[];
  hours: { days: string; time: string }[];
  hoursNote: string | null;
};

/** What the business-details block shows, with every empty part left out. */
export function businessDetailsView(business: BusinessData): BusinessDetailsView {
  const { phone, email } = contactLines(business);
  const note = business.hoursNote?.trim() ?? "";
  return {
    address: business.address.map((line) => line.trim()).filter((line) => line !== ""),
    contact: [phone, email].filter((line): line is ContactLine => line !== null),
    hours: formatHours(business.hours),
    hoursNote: note === "" ? null : note,
  };
}

/** The notice to put above the header, or null when it is empty or past its last day (`today` in the site's time zone). */
export function noticeToShow(notice: NoticeData, timeZone: string, now: Date): NoticeData | null {
  return noticeShows(notice, todayIn(timeZone, now)) ? notice : null;
}
