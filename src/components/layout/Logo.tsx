import Link from "next/link";
import { siteConfig } from "@/content/site";

export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5 rounded-md" aria-label={`${siteConfig.name} home`}>
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-[9px] bg-ink font-display text-lg font-bold text-note transition-transform duration-150 group-hover:-rotate-3 motion-reduce:transition-none"
      >
        H
      </span>
      <span className="font-display text-xl font-bold tracking-tight">{siteConfig.name}</span>
    </Link>
  );
}
