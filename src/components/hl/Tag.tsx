import type { ReactNode } from "react";

/** Small label pill (§7.15): green on tint. Used for "Systems project", case-study meta and the hero card labels. */
export function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block rounded-pill bg-tint px-[9px] py-[5px] font-ui text-tag font-semibold text-green ${className}`}>
      {children}
    </span>
  );
}
