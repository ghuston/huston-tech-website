import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "onDark" | "link";

type ButtonProps = {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
  fullWidthOnMobile?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 motion-reduce:transition-none";

const variants: Record<Variant, string> = {
  primary:
    "min-h-12 rounded-[10px] bg-signal px-6 py-3 text-white hover:bg-signal-deep border border-transparent",
  secondary:
    "min-h-12 rounded-[10px] border-2 border-ink px-6 py-3 text-ink hover:bg-ink hover:text-paper",
  onDark:
    "min-h-12 rounded-[10px] bg-paper px-6 py-3 text-ink hover:bg-note border border-transparent",
  link: "min-h-11 text-sage underline decoration-sage/40 underline-offset-4 hover:decoration-sage",
};

function isExternal(href: string) {
  return /^(https?:)?\/\//.test(href) || href.startsWith("mailto:");
}

export function Button({ href, variant = "primary", children, className = "", fullWidthOnMobile = false }: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${fullWidthOnMobile ? "w-full sm:w-auto" : ""} ${className}`;
  if (isExternal(href)) {
    const opensNewTab = !href.startsWith("mailto:");
    return (
      <a
        href={href}
        className={classes}
        {...(opensNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
