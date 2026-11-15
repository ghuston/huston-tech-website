import type { FrameworkStepKey } from "@/content/site";

const fixedStroke = { strokeWidth: 1.5, vectorEffect: "non-scaling-stroke" } as const;

type Props = {
  step: FrameworkStepKey;
  className?: string;
  /** "v3" is the style guide §8 geometry (static, 200 × 150). "v1" (default) is the old diagram's, removed with v1. */
  variant?: "v1" | "v3";
};

/** Style guide v3 §8: the three step icons on a 200 × 150 viewBox. Static; the stroke and fills take `currentColor`. */
function LineIconV3({ step, className }: { step: FrameworkStepKey; className: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 200 150"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className={className}
    >
      {step === "scope" ? (
        <>
          <circle data-hl="scope-dashed" cx="77.5" cy="75" r="66.5" strokeDasharray="4 3.5" vectorEffect="non-scaling-stroke" />
          <circle data-hl="scope-solid" cx="122.5" cy="75" r="66.5" vectorEffect="non-scaling-stroke" />
        </>
      ) : null}
      {step === "shape" ? (
        <>
          <circle data-hl="shape-outer" cx="100" cy="75" r="67" vectorEffect="non-scaling-stroke" />
          <circle data-hl="shape-inner" cx="100" cy="75" r="37" vectorEffect="non-scaling-stroke" />
          <circle data-hl="shape-dot" cx="100" cy="75" r="9" fill="currentColor" stroke="none" />
        </>
      ) : null}
      {step === "ship" ? (
        <>
          <path data-hl="ship-outline" d="M100 3 172 75 100 147 28 75Z" strokeLinejoin="miter" vectorEffect="non-scaling-stroke" />
          <path data-hl="ship-center" d="M100 34 141 75 100 116 59 75Z" fill="currentColor" stroke="none" />
        </>
      ) : null}
    </svg>
  );
}

/**
 * Thin geometric line illustrations for the framework steps: overlapping circles (one dashed), concentric circles
 * with a dot, and a diamond within a filled diamond. Parts carry `data-part` so the homepage diagram can animate
 * them (see motion.css); everywhere else they are static. Strokes are a constant 1.5px, except the two rings, whose
 * "draw" animation needs a scaled stroke: they use viewBox units (4 is about 1.5px at 36px) and callers override
 * them with `[stroke-width:n]` for other sizes. Decorative only.
 */
export function LineIcon({ step, className = "size-9", variant = "v1" }: Props) {
  if (variant === "v3") return <LineIconV3 step={step} className={className} />;
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
      {step === "scope" ? (
        <>
          <circle data-part="scope-dashed" cx="37" cy="48" r="27" strokeDasharray="3 4" {...fixedStroke} />
          <circle data-part="scope-solid" cx="59" cy="48" r="27" {...fixedStroke} />
        </>
      ) : null}
      {step === "shape" ? (
        <>
          <circle data-part="shape-ring" cx="48" cy="48" r="36" pathLength={1} />
          <circle data-part="shape-ring" cx="48" cy="48" r="20" pathLength={1} />
          <circle data-part="shape-dot" cx="48" cy="48" r="5" fill="currentColor" stroke="none" />
        </>
      ) : null}
      {step === "ship" ? (
        <>
          <rect
            data-part="ship-outline"
            x="19.72"
            y="19.72"
            width="56.57"
            height="56.57"
            strokeLinejoin="miter"
            {...fixedStroke}
            style={{ transform: "rotate(45deg)" }}
          />
          <rect
            data-part="ship-center"
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
