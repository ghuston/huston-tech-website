import type { ReactNode } from "react";
import { StatusChip } from "./StatusChip";

/** Mono "status chip" label that sits above a page or section heading. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <StatusChip tone="signal">{children}</StatusChip>;
}
