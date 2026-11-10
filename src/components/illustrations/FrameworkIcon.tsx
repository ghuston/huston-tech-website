import type { FrameworkStepKey } from "@/content/site";

const fixedStroke = { strokeWidth: 1.5, vectorEffect: "non-scaling-stroke" } as const;

type Props = { step: FrameworkStepKey; className?: string };

/**
 * Thin geometric line illustrations for the framework steps: overlapping circles (one dashed), concentric circles
 * with a dot, and a diamond within a filled diamond. Parts carry `data-part` so the homepage diagram can animate
 * them (see motion.css); everywhere else they are static. Strokes are a constant 1.5px, except the two rings, whose
 * "draw" animation needs a scaled stroke: they use viewBox units (4 is about 1.5px at 36px) and callers override
 * them with `[stroke-width:n]` for other sizes. Decorative only.
 */
export function FrameworkIcon({ step, className = "size-9" }: Props) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      className={className}
    >
      {step === "find" ? (
        <>
          <circle data-part="find-dashed" cx="37" cy="48" r="27" strokeDasharray="3 4" {...fixedStroke} />
          <circle data-part="find-solid" cx="59" cy="48" r="27" {...fixedStroke} />
        </>
      ) : null}
      {step === "fix" ? (
        <>
          <circle data-part="fix-ring" cx="48" cy="48" r="36" pathLength={1} />
          <circle data-part="fix-ring" cx="48" cy="48" r="20" pathLength={1} />
          <circle data-part="fix-dot" cx="48" cy="48" r="5" fill="currentColor" stroke="none" />
        </>
      ) : null}
      {step === "flick" ? (
        <>
          <rect
            data-part="flick-outline"
            x="19.72"
            y="19.72"
            width="56.57"
            height="56.57"
            strokeLinejoin="miter"
            {...fixedStroke}
            style={{ transform: "rotate(45deg)" }}
          />
          <rect
            data-part="flick-center"
            x="33.86"
            y="33.86"
            width="28.28"
            height="28.28"
            fill="currentColor"
            stroke="none"
            style={{ transform: "rotate(45deg)" }}
          />
        </>
      ) : null}
    </svg>
  );
}
