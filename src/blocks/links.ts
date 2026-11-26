import { bookCallHref } from "@/components/ui/BookCallButton";
import { BOOKING_LINK } from "./schema.ts";

/** The address a link field points to: `@booking` becomes the site's booking link, anything else is used as written. */
export function resolveHref(href: string): string {
  return href === BOOKING_LINK ? bookCallHref() : href;
}
