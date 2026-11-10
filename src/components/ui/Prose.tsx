import type { ReactNode } from "react";

export function Prose({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`max-w-[var(--container-prose)] space-y-5 ${className}`}>{children}</div>;
}
