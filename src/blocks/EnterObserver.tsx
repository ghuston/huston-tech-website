"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * The entrance motion (docs/STYLE-GUIDE.md §9, AGENTS.md "Motion rules"): marks each block with data-motion="enter" as
 * entered the first time it comes into view, and hl.css lets it rise into place. IntersectionObserver only, no scroll
 * listener. Nothing is hidden: a block waits 16px low at full opacity, so without JavaScript, under reduced motion, or
 * if this never runs, every block is readable. Renders nothing.
 */
export function EnterObserver() {
  // A page change can keep this component mounted (two pages from one route file), so the blocks are looked up again.
  const pathname = usePathname();
  useEffect(() => {
    const blocks = document.querySelectorAll<HTMLElement>('[data-motion="enter"]:not([data-entered])');
    const reveal = (element: Element) => element.setAttribute("data-entered", "");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      blocks.forEach(reveal);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // A block already above the screen (after a jump to an anchor) is placed at once, not left waiting low.
          if (!entry.isIntersecting && entry.boundingClientRect.bottom > 0) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    blocks.forEach((block) => observer.observe(block));
    return () => observer.disconnect();
  }, [pathname]);
  return null;
}
