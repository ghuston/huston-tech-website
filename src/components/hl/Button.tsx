import { ArrowLabel } from "./Arrow";
import { HlLink } from "./HlLink";

type ButtonProps = {
  href: string;
  /** The label as written in the copy, with its trailing arrow character when it has one. */
  children: string;
  fullWidthOnMobile?: boolean;
  className?: string;
};

/** Primary button (§7.10): ink fill, silver label, 54px tall. Hover and focus draw a silver underline; no color change. */
export function Button({ href, children, fullWidthOnMobile = false, className = "" }: ButtonProps) {
  const width = fullWidthOnMobile ? "w-full justify-center md:w-auto md:justify-start" : "";
  return (
    <HlLink
      href={href}
      className={`inline-flex min-h-[54px] items-center rounded-btn bg-ink pl-[22px] pr-6 font-ui text-btn font-semibold text-silver [--hl-u-color:var(--hl-silver)] ${width} ${className}`}
    >
      <ArrowLabel>{children}</ArrowLabel>
    </HlLink>
  );
}
