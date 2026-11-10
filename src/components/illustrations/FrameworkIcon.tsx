import type { FrameworkStepKey } from "@/content/site";

type Props = { step: FrameworkStepKey; className?: string };

/** Thin geometric line icons for the framework steps. Decorative only; the step name carries the meaning. */
export function FrameworkIcon({ step, className = "size-9" }: Props) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {step === "find" ? (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M10.5 7.5v6M7.5 10.5h6" />
          <path d="m15.5 15.5 5 5" />
        </>
      ) : null}
      {step === "fix" ? (
        <path d="M15.2 3.8a5 5 0 0 0-4.6 6.9l-6.6 6.6a2.1 2.1 0 0 0 3 3l6.6-6.6a5 5 0 0 0 6.9-4.6c0-.5-.1-1-.2-1.4l-3 3-2.8-.6-.6-2.8 3-3a5 5 0 0 0-1.7-.5z" />
      ) : null}
      {step === "flick" ? (
        <>
          <rect x="2.5" y="7" width="19" height="10" rx="5" />
          <circle cx="16.5" cy="12" r="2.8" fill="var(--color-sage)" stroke="var(--color-sage)" />
        </>
      ) : null}
    </svg>
  );
}
