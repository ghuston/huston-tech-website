const ARROWS = { "→": "right", "↘": "down-right", "↓": "down" } as const;

export type ArrowDirection = (typeof ARROWS)[keyof typeof ARROWS];

const PATHS: Record<ArrowDirection, string> = {
  right: "M2 8h11.5M9.5 4l4 4-4 4",
  "down-right": "M4 4l8 8M12 5.5V12H5.5",
  down: "M8 2v11.5M4 9.5l4 4 4-4",
};

/** → goes to another page, ↘ jumps to a section on the page, ↓ downloads. Nudges 3px on hover and focus (hl.css). */
export function Arrow({ direction }: { direction: ArrowDirection }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="hl-arrow"
      data-dir={direction}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[direction]} />
    </svg>
  );
}

/**
 * A link or button label. Copy keeps its trailing arrow character exactly as written in docs/website-plan.md
 * ("Start a website →"); a trailing → ↘ ↓ becomes the SVG arrow, and the text carries the slow underline.
 */
export function ArrowLabel({ children }: { children: string }) {
  const last = children.slice(-1);
  if (!(last in ARROWS)) return <span className="hl-u">{children}</span>;
  return (
    <>
      <span className="hl-u">{children.slice(0, -1).trimEnd()}</span>
      <Arrow direction={ARROWS[last as keyof typeof ARROWS]} />
    </>
  );
}
