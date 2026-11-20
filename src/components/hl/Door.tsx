import type { ReactNode } from "react";

/**
 * One door of the two-door band (§7.8): a white leaf on a green frame that swings open on hover or keyboard focus
 * to show the green behind it. The rust knob is the logo's dot. The caller supplies the heading, line and button.
 * It does not swing on phones (DoorBand's in-view moment opens it a little once instead) or under reduced motion (hl.css).
 */
export function Door({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`hl-door ${className}`}>
      <div className="hl-leaf">{children}</div>
    </div>
  );
}
