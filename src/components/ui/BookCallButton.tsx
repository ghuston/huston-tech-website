import { SCHEDULER_FALLBACK_HREF, siteConfig } from "@/content/site";

/** Every "book a call" CTA resolves its target here, so one setting in `site.ts` switches them all. */
export function bookCallHref(): string {
  return siteConfig.schedulerUrl ?? SCHEDULER_FALLBACK_HREF;
}
