import { LineIcon } from "@/components/illustrations/LineIcon";
import { Text } from "@/components/ui/Text";
import { framework, type FrameworkStepKey } from "@/content/site";
import { FadingDivider } from "./FadingDivider";

type CaseStudyPhasesProps = {
  /** "Scope it · Shape it · Ship it at a glance". */
  label: string;
  phases: Record<FrameworkStepKey, string>;
};

/**
 * The Scoped / Shaped / Shipped strip (docs/STYLE-GUIDE.md §7.19): a description list in three columns with fading
 * dividers. Terms come from `framework.steps[].past` in site.ts. It describes what happened in each phase; it never
 * claims a formal paid Review took place.
 */
export function CaseStudyPhases({ label, phases }: CaseStudyPhasesProps) {
  return (
    <div>
      <p className="font-ui text-[15px] font-semibold text-green">{label}</p>
      <dl className="mt-5 grid gap-10 md:grid-cols-3 md:gap-12">
        {framework.steps.map((step, index) => (
          <div key={step.key} className="relative">
            {index > 0 ? <FadingDivider direction="vertical" className="absolute -left-6 bottom-0 top-0 hidden md:block" /> : null}
            <dt>
              <LineIcon step={step.key} className="w-8 text-green" />
              <span className="mt-3 block font-ui text-[18px] font-semibold">{step.past}</span>
            </dt>
            <dd className="mt-2 text-[17px] leading-[1.55]">
              <Text>{phases[step.key]}</Text>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
