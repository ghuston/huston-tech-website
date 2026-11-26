"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLabel } from "@/components/hl/Arrow";
import { HlLink } from "@/components/hl/HlLink";
import { menuLabel } from "@/content/nav";
import type { MenuItem } from "@/lib/pages";

/** A hash link points at a section, not a page, so it is never the current page. */
function isCurrent(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

const desktopLink = "inline-flex min-h-11 items-center font-ui text-nav font-medium text-ink";
const mobileLink = "flex min-h-14 items-center font-ui text-[20px] font-medium text-ink";

export function HeaderNav({ items }: { items: readonly MenuItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // The menu closes by itself when the page changes.
  const menuOpen = open && openedAt === pathname;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <nav aria-label="Main" className="hidden items-center justify-end gap-[30px] md:flex">
        {items.map((item) => (
          <HlLink
            key={item.href}
            href={item.href}
            aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
            className={desktopLink}
          >
            <ArrowLabel>{item.label}</ArrowLabel>
          </HlLink>
        ))}
      </nav>

      <div className="flex justify-end md:hidden">
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => {
            setOpenedAt(pathname);
            setOpen((value) => !value);
          }}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-btn px-0.5 font-ui text-[16px] font-medium text-ink"
        >
          <span className="hl-u">{menuLabel}</span>
        </button>
      </div>

      <nav id="mobile-menu" aria-label="Mobile" data-open={menuOpen} inert={!menuOpen} className="panel col-span-full md:hidden">
        <div className="panel-inner">
          <ul className="pb-3">
            {items.map((item, index) => (
              <li key={item.href}>
                {index > 0 ? <div aria-hidden="true" className="hl-divider-h" /> : null}
                <HlLink
                  href={item.href}
                  aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                  className={mobileLink}
                  onClick={() => setOpen(false)}
                >
                  <ArrowLabel>{item.label}</ArrowLabel>
                </HlLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
