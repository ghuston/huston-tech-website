"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type Props = {
  as?: ElementType;
  className?: string;
  /** Share of the element that must be in view before it counts as seen. */
  threshold?: number;
  children: ReactNode;
};

/**
 * Marks its element `data-played` the first time it scrolls into view, then stops observing, so CSS animations
 * released by `[data-played]` run exactly once. No scroll or touch listeners; where IntersectionObserver is missing
 * the animation is released immediately.
 */
export function InViewOnce({ as: Tag = "div", className, threshold = 0.1, children }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Tells hl.css the script is alive, which disarms its 4s failsafe (see "Failsafe" in hl.css).
    document.documentElement.classList.add("hl-live");
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.played = "true";
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          el.dataset.played = "true";
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
