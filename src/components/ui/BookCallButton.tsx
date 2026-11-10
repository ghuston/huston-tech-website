import { bookCallLabel, SCHEDULER_FALLBACK_HREF, siteConfig } from "@/content/site";
import { Button } from "./Button";

type Props = {
  variant?: "primary" | "secondary" | "onDark";
  label?: string;
  className?: string;
  fullWidthOnMobile?: boolean;
};

/** Every "book a call" CTA resolves its target here, so one setting in `site.ts` switches them all. */
export function bookCallHref(): string {
  return siteConfig.schedulerUrl ?? SCHEDULER_FALLBACK_HREF;
}

export function BookCallButton({ variant = "primary", label = bookCallLabel, className, fullWidthOnMobile }: Props) {
  return (
    <Button href={bookCallHref()} variant={variant} className={className} fullWidthOnMobile={fullWidthOnMobile}>
      {label}
    </Button>
  );
}
