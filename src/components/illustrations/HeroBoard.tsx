import { Arrow } from "./Arrow";
import { StatusChip } from "@/components/ui/StatusChip";

const stages = [
  { label: "Inquiry", tone: "neutral" },
  { label: "Owner assigned", tone: "sage" },
  { label: "Reply sent", tone: "signal" },
  { label: "First visit booked", tone: "note" },
] as const;

/** Decorative pipeline board for the hero. Stage names echo the follow-up fix described on Services. */
export function HeroBoard() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md select-none lg:mx-0">
      <div className="absolute -right-3 -top-5 z-10 w-36 rotate-[4deg] bg-note p-4 shadow-note">
        <div className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 -rotate-2 bg-signal/25" />
        <div className="space-y-2.5 pt-1">
          <div className="h-2 w-full rounded-full bg-ink/25" />
          <div className="h-2 w-4/5 rounded-full bg-ink/25" />
          <div className="h-2 w-3/5 rounded-full bg-ink/25" />
        </div>
      </div>

      <div className="rounded-[14px] border border-line bg-surface p-5 shadow-lift sm:p-6">
        <div className="mb-5 flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-signal/70" />
          <span className="size-2.5 rounded-full bg-note" />
          <span className="size-2.5 rounded-full bg-sage/70" />
        </div>
        <ol className="space-y-1">
          {stages.map((stage, i) => (
            <li key={stage.label}>
              <div className="flex items-center gap-3 rounded-[10px] border border-line bg-paper p-3">
                <StatusChip tone={stage.tone}>{stage.label}</StatusChip>
                <div className="ml-auto hidden h-2 w-16 rounded-full bg-line xs:block" />
              </div>
              {i < stages.length - 1 ? <Arrow direction="down" className="mx-auto my-0.5 h-5 w-14 text-ink/50" /> : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
