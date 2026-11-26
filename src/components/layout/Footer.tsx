import Link from "next/link";
import { ArrowLabel } from "@/components/hl/Arrow";
import { Container } from "@/components/hl/Container";
import { HlLink } from "@/components/hl/HlLink";
import { RingMark } from "@/components/hl/Marks";
import { Text } from "@/components/ui/Text";
import { chrome } from "@/content/chrome";
import { siteConfig } from "@/content/site";
import { contactLines, socialLinks } from "@/lib/chrome-view";
import { getMenu } from "@/lib/pages";
import { getBusiness } from "@/lib/settings";
import { Logo } from "./Logo";

const linkClass = "inline-flex min-h-11 items-center font-ui text-[16px] font-medium text-ink";

/** Site footer (docs/STYLE-GUIDE.md §7.26, Rev 7.1 B10): fades in from the page, no hard edge. */
export function Footer() {
  const footerLinks = getMenu("footer");
  const [privacyLink] = getMenu("legal");
  const business = getBusiness();
  const { phone, email } = contactLines(business);
  const socials = socialLinks(business);
  return (
    <footer className="hl-footer relative overflow-hidden pb-12 pt-24">
      <RingMark className="pointer-events-none absolute -bottom-[180px] -right-[180px] size-[360px] fill-white opacity-85" />
      <Container className="relative">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Logo size="footer" />
            <p className="mt-5 max-w-sm font-voice text-[22px] italic leading-snug">{siteConfig.tagline}</p>
            <p className="mt-3 max-w-sm text-[15px]">
              <Text>{siteConfig.footerBrandLine}</Text>
            </p>
          </div>

          <nav aria-label={chrome.footerNavLabel}>
            <ul>
              {footerLinks.map((item) => (
                <li key={item.label}>
                  <HlLink href={item.href} className={linkClass}>
                    <ArrowLabel>{item.label}</ArrowLabel>
                  </HlLink>
                </li>
              ))}
            </ul>
          </nav>

          <ul>
            {phone ? (
              <li>
                {phone.href ? (
                  <HlLink href={phone.href} className={linkClass}>
                    <ArrowLabel>{phone.text}</ArrowLabel>
                  </HlLink>
                ) : (
                  <span className={linkClass}>
                    <Text>{phone.text}</Text>
                  </span>
                )}
              </li>
            ) : null}
            {email ? (
              <li>
                {email.href ? (
                  <HlLink href={email.href} className={linkClass}>
                    <ArrowLabel>{email.text}</ArrowLabel>
                  </HlLink>
                ) : (
                  <span className={linkClass}>
                    <Text>{email.text}</Text>
                  </span>
                )}
              </li>
            ) : null}
            {socials.map((social) => (
              <li key={social.url}>
                <HlLink href={social.url} className={linkClass}>
                  <ArrowLabel>{social.label}</ArrowLabel>
                </HlLink>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-12 text-small text-ink-2">
          {privacyLink ? (
            <>
              <Link href={privacyLink.href} className="inline-flex min-h-11 items-center underline underline-offset-4">
                {privacyLink.label}
              </Link>{" "}
              ·{" "}
            </>
          ) : null}
          &copy; {siteConfig.copyrightYear} <Text>{business.name}</Text>
        </p>
      </Container>
    </footer>
  );
}
