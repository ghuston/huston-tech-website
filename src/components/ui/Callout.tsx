import type { ReactNode } from "react";

type Tone = "sage" | "note" | "signal";

const tones: Record<Tone, string> = {
  sage: "bg-sage-tint border-sage/25",
  note: "bg-note border-ink/15",
  signal: "bg-signal-tint border-signal/25",
};

type Props = { title?: string; tone?: Tone; children: ReactNode; className?: string };

export function Callout({ title, tone = "sage", children, className = "" }: Props) {
  return (
    <aside className={`rounded-[14px] border p-5 sm:p-6 ${tones[tone]} ${className}`}>
      {title ? <p className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.12em] text-ink">{title}</p> : null}
      <div className="space-y-3">{children}</div>
    </aside>
  );
}
