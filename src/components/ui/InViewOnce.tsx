"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type Props = {
  as?: ElementType;
  className?: string;
  id?: string;
  children?: ReactNode;
  "aria-hidden"?: boolean;
};

/**
 * Marks its element `data-played` the first time it scrolls into view, then stops observing, so CSS animations
 * released by `[data-played]` run exactly once. No scroll or touch listeners. Where IntersectionObserver is missing,
 * `data-motion="off"` shows the finished styling instead of leaving a paused first frame.
 */
export function InViewOnce({ as: Tag = "div", className, id, children, "aria-hidden": ariaHidden }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.motion = "off";
      el.dataset.played = "true";
      return;
    }
    const play = () => {
      el.dataset.played = "true";
    };
    // Releasing on focus keeps keyboard users on the finished styling without restarting a finished animation.
    el.addEventListener("focusin", play);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          play();
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => {
      el.removeEventListener("focusin", play);
      observer.disconnect();
    };
  }, []);

  return (
    <Tag ref={ref} id={id} className={className} aria-hidden={ariaHidden || undefined}>
      {children}
    </Tag>
  );
}
