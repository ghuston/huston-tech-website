"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { bookCallShortLabel } from "@/content/site";

const HIDDEN_ON = ["/contact", "/contact/thanks"];
const SHOW_AFTER_PX = 520;

export function MobileCtaBar({ href }: { href: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (HIDDEN_ON.includes(pathname) || !scrolled) return null;

  const external = /^https?:\/\//.test(href);
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 p-3 backdrop-blur sm:hidden">
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="flex min-h-12 w-full items-center justify-center rounded-[6px] bg-ink px-6 font-semibold text-paper"
      >
        {bookCallShortLabel}
      </a>
    </div>
  );
}
