type TickProps = {
  className?: string;
  /** Marks the check stroke with `data-tick`, so a section's in-view moment can draw it (docs/STYLE-GUIDE.md §9.4). */
  draw?: boolean;
};

/** A check in a circle (the supporting-line pill, the results in "What I'm installing now"). Decorative. */
export function CircleTick({ className = "", draw = false }: TickProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
      className={`text-green ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="8.2" />
      <path d="M6.4 10.3l2.4 2.4 4.8-5" data-tick={draw ? "" : undefined} />
    </svg>
  );
}

/** A bare check, for the stations of the "Why hire me" track. Decorative. */
export function CheckTick({ className = "", draw = false }: TickProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
      className={`text-green ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5.5 10.3l3 3 6-6.4" data-tick={draw ? "" : undefined} />
    </svg>
  );
}
