/** The 1px line that fades out at its ends (§4); separates lists of ideas instead of boxing them. Decorative. */
export function FadingDivider({ direction = "horizontal", className = "" }: { direction?: "horizontal" | "vertical"; className?: string }) {
  return <div aria-hidden="true" className={`${direction === "vertical" ? "hl-divider-v" : "hl-divider-h"} ${className}`} />;
}
