"use client";

import { useEffect, useRef, type ReactNode } from "react";

// docs/STYLE-GUIDE.md §9.3: one full turn per 900px of scrolling.
const DEGREES_PER_PX = 0.4;
// The badge is a flat face at every multiple of 180deg (front, or back turned to read correctly), never edge-on.
const REST_STEP = 180;
const SETTLE_AFTER_MS = 150;
const SETTLE_TRANSITION = "transform 0.4s var(--hl-ease)";

/** The current rotateY angle of an element mid-transition, read from its computed transform. */
function currentAngle(el: HTMLElement) {
  const match = /^matrix3d\((.+)\)$/.exec(getComputedStyle(el).transform);
  if (!match) return null;
  const cells = match[1].split(",").map(Number);
  return (Math.atan2(-cells[2], cells[0]) * 180) / Math.PI;
}

/**
 * The header badge turns about its vertical axis with the scroll position. Once scrolling has stopped for 150ms it
 * eases to the nearest multiple of 180deg, so it never rests edge-on. While scrolling, the angle follows scrollY
 * (plus an offset that keeps it continuous after each settle). One passive scroll listener schedules at most one
 * animation frame; it never touches scrolling. Not attached under reduced motion.
 */
export function BadgeTurn({ children }: { children: ReactNode }) {
  const turn = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = turn.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let timer = 0;
    let offset = 0;
    let angle = 0;
    let settling = false;

    const paint = () => {
      frame = 0;
      angle = (window.scrollY * DEGREES_PER_PX + offset) % 360;
      el.style.transform = `rotateY(${angle}deg)`;
    };
    const settle = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      angle = (window.scrollY * DEGREES_PER_PX + offset) % 360;
      const target = Math.round(angle / REST_STEP) * REST_STEP;
      offset = (offset + target - angle) % 360;
      angle = target;
      settling = true;
      el.style.transition = SETTLE_TRANSITION;
      el.style.transform = `rotateY(${target}deg)`;
    };
    const onScroll = () => {
      if (settling) {
        // Scrolling resumed mid-ease: carry on from where the badge is now, with no jump.
        const now = currentAngle(el);
        if (now !== null) offset += now - (window.scrollY * DEGREES_PER_PX + offset);
        settling = false;
        el.style.transition = "none";
      }
      if (!frame) frame = requestAnimationFrame(paint);
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, SETTLE_AFTER_MS);
    };
    const reset = () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      frame = 0;
      settling = false;
      el.style.transition = "";
      el.style.transform = "";
    };
    const sync = () => {
      reset();
      if (reduced.matches) return;
      offset = 0;
      window.addEventListener("scroll", onScroll, { passive: true });
      paint();
      timer = window.setTimeout(settle, SETTLE_AFTER_MS);
    };
    sync();
    reduced.addEventListener("change", sync);
    return () => {
      reduced.removeEventListener("change", sync);
      reset();
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
