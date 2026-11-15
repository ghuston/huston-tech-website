import Link from "next/link";
import type { ReactNode } from "react";

type HlLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

function isExternal(href: string) {
  return /^(https?:)?\/\//.test(href) || href.startsWith("mailto:");
}

/** Internal links use next/link. External http(s) links open in a new tab with noopener noreferrer (AGENTS.md). */
export function HlLink({ href, className, children }: HlLinkProps) {
  if (isExternal(href)) {
    const opensNewTab = !href.startsWith("mailto:");
    return (
      <a href={href} className={className} {...(opensNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
