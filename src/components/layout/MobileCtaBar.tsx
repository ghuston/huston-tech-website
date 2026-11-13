"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { bookCallShortLabel } from "@/content/site";

const HIDDEN_ON = ["/contact", "/contact/thanks"];
const SHOW_AFTER_PX = 520;

const neverChanges = () => () => {};

export function MobileCtaBar({ href }: { href: string }) {
  const pathname = usePathname();
  const hidden = HIDDEN_ON.includes(pathname);
  const marker = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  // Read from the browser, not state set in an effect; the server assumes support.
  const canObserve = useSyncExternalStore(
    neverChanges,
    () => typeof IntersectionObserver !== "undefined",
    () => true,
  );

  // An invisible marker sits SHOW_AFTER_PX down the page; the bar shows once the marker has scrolled above the top of the
  // screen and hides again when it comes back. IntersectionObserver instead of a scroll listener (AGENTS.md Motion rules).
  // Without IntersectionObserver the bar simply shows (fail open, like InViewOnce).
  useEffect(() => {
    const el = marker.current;
    if (!el || !canObserve) return;
    const observer = new IntersectionObserver(([entry]) => {
      setScrolled(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hidden, canObserve]);

  if (hidden) return null;

  const external = /^https?:\/\//.test(href);
  return (
    <>
      {/* Positioned against the page, not a parent: nothing between here and the root is positioned or transformed. */}
      <div ref={marker} aria-hidden="true" className="pointer-events-none absolute left-0 size-px" style={{ top: SHOW_AFTER_PX }} />
      {(scrolled || !canObserve) && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 p-3 backdrop-blur sm:hidden">
          <a
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="flex min-h-12 w-full items-center justify-center rounded-[6px] bg-ink px-6 font-semibold text-paper"
          >
            {bookCallShortLabel}
          </a>
        </div>
      )}
    </>
  );
}
