import type { ReactNode } from "react";

type PillProps = {
  children: ReactNode;
  /** An optional leading icon (for example the tick in the supporting line). Decorative: pass an aria-hidden element. */
  icon?: ReactNode;
  className?: string;
};

/** White pill with a hairline border (§7.4). Not a link and not interactive. */
export function Pill({ children, icon, className = "" }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-[9px] rounded-pill border border-hairline bg-white/80 py-2 pl-2.5 pr-3.5 font-ui text-[15px] font-medium leading-tight text-ink ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
