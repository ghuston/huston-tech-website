"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The pointer module (docs/STYLE-GUIDE.md §9): the card stack tilts toward the cursor, at most `max` degrees on each
 * axis, eased by 0.12 per frame, and settles flat when the pointer leaves. Only transform changes.
 *
 * It attaches nothing unless a mouse or trackpad is in use and the visitor has not asked for reduced motion, so touch
 * screens and reduced-motion visitors get the resting layout. The cards' hover drift is CSS (hl.css).
 */
export function StackTilt({ max = 5, children }: { max?: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stack = ref.current;
    const host = stack?.parentElement;
    if (!stack || !host) return;
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
      stack.style.transform = `rotateX(${y.toFixed(2)}deg) rotateY(${x.toFixed(2)}deg)`;
      if (Math.abs(targetX - x) > 0.01 || Math.abs(targetY - y) > 0.01) {
        frame = requestAnimationFrame(step);
      } else {
        frame = 0;
        if (!targetX && !targetY) stack.style.transform = "";
      }
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };
    const onMove = (event: PointerEvent) => {
      const box = host.getBoundingClientRect();
      targetX = ((event.clientX - box.left) / box.width - 0.5) * 2 * max;
      targetY = -((event.clientY - box.top) / box.height - 0.5) * 2 * max;
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
      stack.style.transform = "";
    };
  }, [max]);

  return (
    <div ref={ref} className="hl-stack" aria-hidden="true">
      {children}
    </div>
  );
}
