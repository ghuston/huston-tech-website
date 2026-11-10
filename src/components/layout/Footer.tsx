import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ContactEmail } from "@/components/ui/ContactEmail";
import { Placeholder } from "@/components/ui/Placeholder";
import { footerNav, partnerLink, privacyLink } from "@/content/nav";
import { siteConfig } from "@/content/site";
import { Logo } from "./Logo";

const linkClass = "inline-flex min-h-11 items-center underline-offset-4 hover:underline";

export function Footer() {
  return (
    <footer className="border-t border-paper/10 bg-ink-deep pb-28 pt-14 text-paper sm:pb-12 on-dark">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="[&_span:first-child]:bg-note [&_span:first-child]:text-ink">
              <Logo />
            </div>
            <p className="max-w-sm text-sm text-paper/80">{siteConfig.oneLiner.split(". ")[0]}.</p>
          </div>

          <nav aria-label="Footer">
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-paper/70">Explore</p>
            <ul>
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-paper/70">Get in touch</p>
            <ul>
              <li className="flex min-h-11 items-center">
                <ContactEmail />
              </li>
              <li className="flex min-h-11 items-center">
                {siteConfig.linkedInUrl ? (
                  <a href={siteConfig.linkedInUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                    LinkedIn
                  </a>
                ) : (
                  <span>
                    LinkedIn <Placeholder>[[LinkedIn URL]]</Placeholder>
                  </span>
                )}
              </li>
              <li>
                <Link href={partnerLink.href} className={linkClass}>
                  {partnerLink.label}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-paper/20 pt-6 text-sm text-paper/75 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {siteConfig.copyrightYear} {siteConfig.name}
          </p>
          <Link href={privacyLink.href} className={linkClass}>
            {privacyLink.label}
          </Link>
        </div>
      </Container>
    </footer>
  );
}
