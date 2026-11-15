import type { FrameworkStepKey } from "@/content/site";

/** Style guide v3 §8: the three step icons on a 200 × 150 viewBox. Static; the stroke and fills take `currentColor`. */
export function LineIcon({ step, className }: { step: FrameworkStepKey; className: string }) {
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
