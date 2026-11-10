import Link from "next/link";
import { siteConfig } from "@/content/site";

export function Logo() {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center rounded-md font-sans text-[1.35rem] font-extrabold tracking-[-0.04em]">
      {siteConfig.name}
    </Link>
  );
}
