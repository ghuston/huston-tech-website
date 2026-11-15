import { ArrowLabel } from "./Arrow";
import { HlLink } from "./HlLink";

type TextLinkProps = {
  href: string;
  children: string;
  /** Inside a paragraph: inherits the text color and keeps a faint permanent underline so it is findable without hover. */
  inline?: boolean;
  className?: string;
};

/** Text link (§7.10). Standalone links are green Outfit 500 with a 44px target; the slow rust underline draws on hover and focus. */
export function TextLink({ href, children, inline = false, className = "" }: TextLinkProps) {
  const style = inline
    ? "text-inherit underline decoration-ink/35 underline-offset-[.25em]"
    : "inline-flex min-h-11 items-center font-ui font-medium text-green";
  return (
    <HlLink href={href} className={`${style} ${className}`}>
      <ArrowLabel>{children}</ArrowLabel>
    </HlLink>
  );
}
