import Link from "next/link";
import { ArrowLabel } from "@/components/hl/Arrow";
import { Container } from "@/components/hl/Container";
import { HlLink } from "@/components/hl/HlLink";
import { RingMark } from "@/components/hl/Marks";
import { Text } from "@/components/ui/Text";
import { footerLinks, partnerLink, privacyLink } from "@/content/nav";
import { siteConfig } from "@/content/site";
import { Logo } from "./Logo";

const linkClass = "inline-flex min-h-11 items-center font-ui text-[16px] font-medium text-ink";

/** Site footer (docs/STYLE-GUIDE.md §7.26, Rev 7.1 B10): fades in from the page, no hard edge. */
export function Footer() {
  return (
    <footer className="hl hl-footer relative overflow-hidden pb-28 pt-24 md:pb-12">
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

          <nav aria-label="Footer">
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
            {siteConfig.email ? (
              <li>
                <HlLink href={`mailto:${siteConfig.email}`} className={linkClass}>
                  <ArrowLabel>{siteConfig.email}</ArrowLabel>
                </HlLink>
              </li>
            ) : null}
            {siteConfig.linkedInUrl ? (
              <li>
                <HlLink href={siteConfig.linkedInUrl} className={linkClass}>
                  <ArrowLabel>LinkedIn</ArrowLabel>
                </HlLink>
              </li>
            ) : null}
            <li>
              <HlLink href={partnerLink.href} className={linkClass}>
                <ArrowLabel>{partnerLink.label}</ArrowLabel>
              </HlLink>
            </li>
          </ul>
        </div>

        <p className="mt-12 text-small text-ink-2">
          <Link href={privacyLink.href} className="inline-flex min-h-11 items-center underline underline-offset-4">
            {privacyLink.label}
          </Link>{" "}
          · &copy; {siteConfig.copyrightYear} {siteConfig.name}
        </p>
      </Container>
    </footer>
  );
}
