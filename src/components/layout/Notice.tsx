import { Container } from "@/components/hl/Container";
import { HlLink } from "@/components/hl/HlLink";
import { Text } from "@/components/ui/Text";
import { chrome } from "@/content/chrome";
import { noticeToShow } from "@/lib/chrome-view";
import { getNotice } from "@/lib/settings";
import { siteConfig as base } from "../../../site.config";

/**
 * The site notice (src/content/notice.json): one line above the header while it has text and its last day has not
 * passed in the site's time zone, judged at build time. No motion and no close button. The keyboard focus ring is silver here:
 * the rust ring does not reach 3:1 against the dark bar.
 */
export function Notice() {
  const notice = noticeToShow(getNotice(), base.business.timeZone, new Date());
  if (notice === null) return null;
  return (
    <section aria-label={chrome.noticeLabel} className="bg-ink py-2 text-center text-small text-silver">
      <Container>
        <p>
          <Text>{notice.text}</Text>
          {notice.link ? (
            <>
              {" "}
              <HlLink href={notice.link.href} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 focus-visible:outline-silver">
                <Text>{notice.link.label}</Text>
              </HlLink>
            </>
          ) : null}
        </p>
      </Container>
    </section>
  );
}
