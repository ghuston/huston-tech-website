import type { ReactNode } from "react";

/** The small line above a heading (§7.3): Outfit 500, green, sentence case. Only where the copy has an eyebrow. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-ui text-eyebrow font-medium text-green ${className}`}>{children}</p>;
}
