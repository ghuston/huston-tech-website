import type { ReactNode } from "react";

type Tone = "signal" | "sage" | "note" | "ink" | "neutral";

const tones: Record<Tone, string> = {
  signal: "bg-signal-tint text-signal-deep",
  sage: "bg-sage-tint text-sage",
  note: "bg-note text-ink",
  ink: "bg-ink text-paper",
  neutral: "bg-surface text-muted border border-line",
};

const dots: Record<Tone, string> = {
  signal: "bg-signal",
  sage: "bg-sage",
  note: "bg-ink",
  ink: "bg-note",
  neutral: "bg-muted",
};

type Props = { children: ReactNode; tone?: Tone; dot?: boolean; className?: string };

/** Pipeline-style status label, echoing CRM stage chips. */
export function StatusChip({ children, tone = "neutral", dot = true, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.12em] ${tones[tone]} ${className}`}
    >
      {dot ? <span aria-hidden="true" className={`size-1.5 rounded-full ${dots[tone]}`} /> : null}
      {children}
    </span>
  );
}
