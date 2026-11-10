const ARROWS = { "→": "right", "↓": "down", "↑": "up" } as const;

type ArrowChar = keyof typeof ARROWS;

function trailingArrow(label: string): { text: string; arrow: ArrowChar } | null {
  const last = label.slice(-1);
  if (!(last in ARROWS)) return null;
  return { text: label.slice(0, -1).trimEnd(), arrow: last as ArrowChar };
}

/**
 * Renders a link or button label. A trailing arrow character (→ ↓ ↑) becomes a decorative span that moves 3px
 * in its direction when the parent link or button is hovered or keyboard-focused (see motion.css).
 */
export function ArrowLabel({ children }: { children: string }) {
  const parsed = trailingArrow(children);
  if (!parsed) return <>{children}</>;
  return (
    <span>
      {parsed.text}{" "}
      <span aria-hidden="true" className="arrow" data-dir={ARROWS[parsed.arrow]}>
        {parsed.arrow}
      </span>
    </span>
  );
}
