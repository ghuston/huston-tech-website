import type { ReactNode } from "react";
import { InViewOnce } from "@/components/ui/InViewOnce";

/**
 * One door of the two-door band (§7.8): a white leaf on a green frame that swings open on hover or keyboard focus
 * to show the green behind it. The rust knob is the logo's dot. The caller supplies the heading, line and button.
 * On phones it does not swing; instead the leaf opens a little once when half the door is in view (§9.4, the door
 * observes itself so each one plays where it can be seen). Nothing moves under reduced motion (hl.css).
 */
export function Door({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <InViewOnce className={`hl-door ${className}`} threshold={0.5}>
      <div className="hl-leaf">{children}</div>
    </InViewOnce>
  );
}
