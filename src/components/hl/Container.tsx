import type { ReactNode } from "react";

/** The page column (docs/STYLE-GUIDE.md §4): up to 1320px wide with 40px side padding (20px on phones). */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-page px-5 md:px-10 ${className}`}>{children}</div>;
}
