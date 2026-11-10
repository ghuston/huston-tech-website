type Props = { direction: "right" | "down"; className?: string };

/** Thin connector with a small chevron between framework steps. Decorative only. */
export function StepConnector({ direction, className = "" }: Props) {
  return direction === "right" ? (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 48 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 12h40M38 6l6 6-6 6" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 4v40M6 38l6 6 6-6" />
    </svg>
  );
}
