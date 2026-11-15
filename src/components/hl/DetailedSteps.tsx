import { LineIcon } from "@/components/illustrations/LineIcon";
import { Text } from "@/components/ui/Text";
import type { FrameworkStepKey } from "@/content/site";
import { getStep } from "@/lib/framework";

export type StepColumn = {
  /** Plain text, with optional **bold** runs. */
  paragraph: string;
  /** What the person gets, as written in the copy (middle dots included). Home's short version has none. */
  youGet?: string;
  /** The "you can stop here" stop-point. Worded identically wherever it appears. */
  callout?: { lead: string; body: string };
};

export type DetailedStep = { key: FrameworkStepKey; website: StepColumn; workflow: StepColumn };

type DetailedStepsProps = {
  steps: DetailedStep[];
  labels: { website: string; workflow: string; youGet?: string };
  /** H2 on /how-i-work, where the copy writes the steps as H2s; H3 when the block sits under another H2. */
  headingLevel?: 2 | 3;
  /** The line under the steps, with its italic note. */
  proof?: { text: string; note: string };
};

function Column({ label, youGetLabel, column }: { label: string; youGetLabel?: string; column: StepColumn }) {
  return (
    <div>
      <p className="font-ui text-[15px] font-semibold text-green">{label}</p>
      <p className="mt-2 text-body">
        <Text>{column.paragraph}</Text>
      </p>
      {column.youGet ? (
        <p className="mt-4 text-body">
          <span className="font-ui font-semibold text-green">{youGetLabel}</span> {column.youGet}
        </p>
      ) : null}
      {column.callout ? (
        <div className="mt-6 rounded-card bg-tint px-5 py-[18px] text-body">
          <span className="font-ui text-[17px] font-semibold text-green">{column.callout.lead}</span> {column.callout.body}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The three steps in full (docs/STYLE-GUIDE.md §7.20): the arc's vertical form, a white track on the left with a
 * station for each step and the rust dot resting at the bottom, and Website and Workflow columns beside it.
 * Static; headings are built from `framework.steps`, so the names come only from site.ts.
 */
export function DetailedSteps({ steps, labels, headingLevel = 3, proof }: DetailedStepsProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div>
      <div className="relative">
        <div aria-hidden="true" className="absolute bottom-5 left-5 top-7 w-4 rounded-pill bg-white md:left-[31px] md:top-10" />
        <div aria-hidden="true" className="absolute bottom-0 left-5 size-4 rounded-pill bg-rust md:left-[31px]" />
        <ol className="relative">
          {steps.map((step) => {
            const info = getStep(step.key);
            return (
              <li key={step.key} className="relative grid grid-cols-[56px_1fr] gap-x-4 pb-16 last:pb-12 md:grid-cols-[78px_1fr] md:gap-x-8">
                <span className="relative z-10 grid size-14 place-items-center rounded-pill bg-white ring-1 ring-ink/10 md:size-[78px]">
                  <LineIcon step={step.key} className="w-10 text-green md:w-14" />
                </span>
                <div>
                  <Heading className="font-ui text-[28px] font-bold leading-[1.1] tracking-[-0.03em] md:text-[32px]">
                    <span className="text-green">{info.number}</span> · {info.label}. {info.oneLiner}
                  </Heading>
                  <div className="mt-6 grid gap-12 lg:grid-cols-2">
                    <Column label={labels.website} youGetLabel={labels.youGet} column={step.website} />
                    <Column label={labels.workflow} youGetLabel={labels.youGet} column={step.workflow} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      {proof ? (
        <p className="mt-4 text-[15px] text-ink-2">
          {proof.text} <em>{proof.note}</em>
        </p>
      ) : null}
    </div>
  );
}
