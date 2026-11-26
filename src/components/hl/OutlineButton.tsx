import { ArrowLabel } from "./Arrow";
import { HlLink } from "./HlLink";

/**
 * Quiet companion to the primary `Button`, for a row of equal actions (the /card Call, Text and Email row): white fill,
 * 1px `ink-2` border (the form-field border, 7.6:1 on white), ink Outfit 600 label, 54px tall, centered. Hover and focus
 * draw the rust slow underline like every other link (§7.10); no color change.
 */
export function OutlineButton({ href, children, className = "" }: { href: string; children: string; className?: string }) {
  return (
    <HlLink
      href={href}
      className={`inline-flex min-h-13.5 items-center justify-center rounded-btn border border-ink-2 bg-white px-3 font-ui text-btn font-semibold text-ink ${className}`}
    >
      <ArrowLabel>{children}</ArrowLabel>
    </HlLink>
  );
}
