import { FrameworkIcon } from "@/components/illustrations/FrameworkIcon";
import { InkRule } from "@/components/ui/Reveal";
import { Text } from "@/components/ui/Text";
import { framework } from "@/content/site";
import type { CasePhases } from "@/content/past-work";

type Props = { heading: string; phases: CasePhases };

/** Found / Fixed / Flicked strip. Marked up as a definition list at every breakpoint. */
export function CaseStudyPhases({ heading, phases }: Props) {
  return (
    <div className="mt-10 rounded-[14px] border border-line bg-surface p-6 sm:p-8">
      <div className="relative">
        <h3 className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-signal-deep">{heading}</h3>
        <InkRule />
      </div>
      <dl className="mt-5 grid gap-6">
        {framework.steps.map((step) => (
          <div key={step.key} className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 sm:grid-cols-[auto_8rem_1fr]">
            <FrameworkIcon step={step.key} className="row-span-2 size-7 text-ink [stroke-width:5.1] sm:row-span-1" />
            <dt className="font-display text-xl font-semibold leading-snug">{step.past}</dt>
            <dd className="col-start-2 text-ink/85 sm:col-start-3">
              <Text>{phases[step.key]}</Text>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
