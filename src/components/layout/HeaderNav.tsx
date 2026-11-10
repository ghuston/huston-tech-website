"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { bookCallMobileLabel, bookCallShortLabel } from "@/content/site";
import { mainNav } from "@/content/nav";

type Props = { bookHref: string };

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const linkClasses =
  "inline-flex min-h-11 items-center rounded-md px-3 text-[0.95rem] font-medium transition-colors duration-150 hover:text-signal motion-reduce:transition-none";

export function HeaderNav({ bookHref }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuOpen = open && openedAt === pathname;
  const bookExternal = /^https?:\/\//.test(bookHref);

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

  const bookClasses =
    "inline-flex min-h-11 items-center whitespace-nowrap rounded-[10px] bg-signal px-4 text-[0.95rem] font-semibold text-white transition-colors duration-150 hover:bg-signal-deep motion-reduce:transition-none";
  const bookProps = bookExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <>
      <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
            className={`${linkClasses} ${isCurrent(pathname, item.href) ? "text-signal" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center justify-self-end gap-2">
        <a href={bookHref} className={bookClasses} {...bookProps}>
          <span className="lg:hidden">{bookCallMobileLabel}</span>
          <span className="hidden lg:inline">{bookCallShortLabel}</span>
        </a>
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => {
            setOpenedAt(pathname);
            setOpen((value) => !value);
          }}
          className="inline-flex size-11 items-center justify-center rounded-[10px] border-2 border-ink lg:hidden"
        >
          <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      <nav
        id="mobile-menu"
        aria-label="Mobile"
        hidden={!menuOpen}
        className="col-span-full border-t border-line pb-4 pt-2 lg:hidden"
      >
        <ul className="grid gap-1">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                className={`flex min-h-12 items-center rounded-md px-2 font-display text-xl font-semibold ${isCurrent(pathname, item.href) ? "text-signal" : ""}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
