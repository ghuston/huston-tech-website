import type { FrameworkStepKey } from "@/content/site";

type Props = { step: FrameworkStepKey; className?: string };

/**
 * Thin geometric line illustrations for the framework steps: overlapping circles (one dashed), concentric circles
 * with a dot, and a diamond within a filled diamond. The stroke stays 1.5px at every size. Decorative only.
 */
export function FrameworkIcon({ step, className = "size-9" }: Props) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      {step === "find" ? (
        <>
          <circle cx="37" cy="48" r="27" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          <circle cx="59" cy="48" r="27" vectorEffect="non-scaling-stroke" />
        </>
      ) : null}
      {step === "fix" ? (
        <>
          <circle cx="48" cy="48" r="36" vectorEffect="non-scaling-stroke" />
          <circle cx="48" cy="48" r="20" vectorEffect="non-scaling-stroke" />
          <circle cx="48" cy="48" r="5" fill="currentColor" stroke="none" />
        </>
      ) : null}
      {step === "flick" ? (
        <>
          <path d="M48 8 88 48 48 88 8 48Z" strokeLinejoin="miter" vectorEffect="non-scaling-stroke" />
          <path d="M48 28 68 48 48 68 28 48Z" fill="currentColor" stroke="none" />
        </>
      ) : null}
    </svg>
  );
}
