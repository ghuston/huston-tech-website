type Props = { direction?: "right" | "down"; className?: string };

/** Hand-drawn connector arrow. Decorative only. */
export function Arrow({ direction = "right", className = "" }: Props) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 64 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${direction === "down" ? "rotate-90" : ""} ${className}`}
    >
      <path d="M3 13c9-6 17 4 27-1s16-3 28 0" />
      <path d="M50 5c4 3 7 5 9 7-3 2-6 5-9 8" />
    </svg>
  );
}
