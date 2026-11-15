import type { ReactNode } from "react";
import { HlLink } from "./HlLink";

type CardProps = {
  children: ReactNode;
  /** With an href the card is a link that lifts 2px on hover and focus (the compact hero door, §7.5). */
  href?: string;
  as?: "div" | "article" | "figure" | "li";
  className?: string;
};

/**
 * A box for something you could hold: a page, a message, a spreadsheet, a screenshot (§4). Lists of ideas are not
 * boxed; they use FadingDivider. Padding is left to the caller.
 */
export function Card({ children, href, as: Tag = "div", className = "" }: CardProps) {
  if (href) {
    return (
      <HlLink href={href} className={`hl-lift block rounded-card border border-hairline bg-white ${className}`}>
        {children}
      </HlLink>
    );
  }
  return <Tag className={`rounded-card border border-ink/10 bg-white shadow-card ${className}`}>{children}</Tag>;
}
