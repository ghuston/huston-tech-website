"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

/**
 * The one pointer module (docs/STYLE-GUIDE.md §9): an element tilts toward the cursor, at most `max` degrees on each
 * axis, eased by 0.12 per frame, and settles flat when the pointer leaves. Only transform changes. With `glow` it also
 * sets --mx and --my (percentages) so a mint glow can follow the cursor (§6.3).
 *
 * It attaches nothing unless a mouse or trackpad is in use and the visitor has not asked for reduced motion, so touch
 * screens and reduced-motion visitors get the resting layout. Hover drift and the glow's fade are CSS (hl.css).
 */
function useTilt(ref: RefObject<HTMLDivElement | null>, hostIs: "parent" | "self", max: number, glow: boolean) {
  useEffect(() => {
    const el = ref.current;
    const host = hostIs === "self" ? el : el?.parentElement;
    if (!el || !host) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;

    const step = () => {
      x += (targetX - x) * 0.12;
      y += (targetY - y) * 0.12;
      // The hero stage supplies the stack's perspective; a lone card brings its own.
      el.style.transform = `${hostIs === "self" ? "perspective(1000px) " : ""}rotateX(${y.toFixed(2)}deg) rotateY(${x.toFixed(2)}deg)`;
      if (Math.abs(targetX - x) > 0.01 || Math.abs(targetY - y) > 0.01) {
        frame = requestAnimationFrame(step);
      } else {
        frame = 0;
        if (!targetX && !targetY) el.style.transform = "";
      }
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };
    const onMove = (event: PointerEvent) => {
      const box = host.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width;
      const py = (event.clientY - box.top) / box.height;
      targetX = (px - 0.5) * 2 * max;
      targetY = -(py - 0.5) * 2 * max;
      if (glow) {
        el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      }
      start();
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      start();
    };

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      el.style.transform = "";
    };
  }, [ref, hostIs, max, glow]);
}

/** The hero's card stack: tilts toward the cursor over the whole stage (its parent), max 5 degrees. */
export function StackTilt({ max = 5, children }: { max?: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref, "parent", max, false);
  return (
    <div ref={ref} className="hl-stack" aria-hidden="true">
      {children}
    </div>
  );
}

/** A card that shows real work (§6.3): tilts up to 3 degrees and a mint glow follows the cursor. Focus shows the glow centered. */
export function TiltCard({ max = 3, className = "", children }: { max?: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref, "self", max, true);
  return (
    <div ref={ref} className={`hl-tilt-card ${className}`}>
      {children}
    </div>
  );
}
