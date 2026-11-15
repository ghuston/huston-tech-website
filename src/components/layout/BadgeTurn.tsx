"use client";

import { useEffect, useRef, type ReactNode } from "react";

// docs/STYLE-GUIDE.md §9.3: one full turn per 900px of scrolling.
const DEGREES_PER_PX = 0.4;

/**
 * The header badge turns about its vertical axis with the scroll position and stops the moment scrolling stops.
 * The angle is a pure function of scrollY: no easing, no loop. Only transform changes. One passive scroll listener
 * schedules at most one animation frame; it never touches scrolling. Not attached under reduced motion.
 */
export function BadgeTurn({ children }: { children: ReactNode }) {
  const turn = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = turn.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const paint = () => {
      frame = 0;
      el.style.transform = `rotateY(${(window.scrollY * DEGREES_PER_PX) % 360}deg)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const sync = () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      frame = 0;
      el.style.transform = "";
      if (reduced.matches) return;
      window.addEventListener("scroll", onScroll, { passive: true });
      paint();
    };
    sync();
    reduced.addEventListener("change", sync);
    return () => {
      reduced.removeEventListener("change", sync);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      el.style.transform = "";
    };
  }, []);

  return (
    <span className="hl-turn">
      <span ref={turn} className="hl-turn-inner">
        {children}
      </span>
    </span>
  );
}
