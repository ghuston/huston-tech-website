/** The links on the thank-you page (src/content/contact.ts), named for the content check. Imports nothing, so the Worker can bundle it. */
export type ThanksLinks = { after: { href: string }; meanwhile: { links: readonly { href: string }[] } };

export function thanksPageLinks(thanks: ThanksLinks): { where: string; href: string }[] {
  return [
    { where: 'contact.ts, thanks page "after" link', href: thanks.after.href },
    ...thanks.meanwhile.links.map((link, index) => ({ where: `contact.ts, thanks page link ${index + 1}`, href: link.href })),
  ];
}
