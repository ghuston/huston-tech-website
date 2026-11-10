import { FrameworkIcon } from "@/components/illustrations/FrameworkIcon";
import { StepConnector } from "@/components/illustrations/StepConnector";
import { framework, type FrameworkStep, type FrameworkStepKey } from "@/content/site";
import { getStep } from "@/lib/framework";
import { BookCallButton } from "./BookCallButton";
import { InViewOnce } from "./InViewOnce";
import { Callout } from "./Callout";
import { Text } from "./Text";

export type DetailedStepContent = {
  key: FrameworkStepKey;
  /** Short descriptor shown under the step name, e.g. "the Workflow Review". */
  subtitle: string;
  /** Shown in parentheses after the subtitle. */
  meta?: string;
  paragraphs: string[];
  list?: { label?: string; items: string[] };
  afterList?: string;
  /** The "you can stop here" stop-point, rendered in a sage-tint box. */
  callout?: { lead: string; body: string };
  proof?: string;
};

export type StepZeroContent = { heading?: string; body: string };

type CompactProps = {
  variant: "compact";
  /** Visually hidden H2 that names the block for screen readers. */
  srHeading: string;
};

type DetailedProps = {
  variant: "detailed";
  stepZero: StepZeroContent;
  steps: DetailedStepContent[];
};

/**
 * The Find it / Fix it / Flick it framework. Step names, numbers and one-liners come from `site.ts`.
 * Step zero (the free call) is never a list item.
 */
export function ProcessSteps(props: CompactProps | DetailedProps) {
  return props.variant === "compact" ? <CompactSteps {...props} /> : <DetailedSteps {...props} />;
}

function CompactSteps({ srHeading }: CompactProps) {
  return (
    <div>
      <h2 className="sr-only">{srHeading}</h2>
      <InViewOnce
        as="ol"
        className="diagram grid divide-y divide-rule border-y border-rule md:grid-cols-3 md:divide-x md:divide-y-0"
      >
        {framework.steps.map((step, i) => (
          <li key={step.key} data-step={i} className="flex flex-col items-center px-6 py-9 text-center md:py-12">
            <FrameworkIcon
              step={step.key}
              className="size-20 text-signal [stroke-width:1.8] md:size-24 md:[stroke-width:1.5]"
            />
            <span aria-hidden="true" className="mt-7 font-mono text-xs tracking-[0.12em] text-ink">
              {step.number}
            </span>
            <h3 className="mt-1 text-[1.9rem] font-semibold leading-tight">{step.label}</h3>
            <p className="mt-2 max-w-[17rem] text-base text-ink">{step.oneLiner}</p>
          </li>
        ))}
      </InViewOnce>
    </div>
  );
}

function DetailedSteps({ stepZero, steps }: DetailedProps) {
  return (
    <div>
      <div className="mb-12 max-w-[var(--container-prose)] lg:mb-14">
        {stepZero.heading ? <p className="font-display text-2xl font-semibold leading-snug">{stepZero.heading}</p> : null}
        <p className={stepZero.heading ? "mt-2 text-ink/85" : "text-ink/85"}>
          <Text>{stepZero.body}</Text>
        </p>
        <div className="mt-5">
          <BookCallButton fullWidthOnMobile />
        </div>
      </div>
      <ol className="grid gap-x-14 gap-y-12 lg:grid-cols-3">
        {steps.map((content, i) => {
          const step = getStep(content.key);
          return (
            <li key={content.key} className="relative rounded-[14px] border border-line bg-surface p-6 sm:p-8">
              <StepHeading step={step} content={content} />
              <div className="mt-4 space-y-4 text-ink/85">
                {content.paragraphs.map((paragraph) => (
                  <p key={paragraph}>
                    <Text>{paragraph}</Text>
                  </p>
                ))}
                {content.list ? (
                  <div>
                    {content.list.label ? (
                      <p className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.12em] text-ink">{content.list.label}</p>
                    ) : null}
                    <ul className="list-disc space-y-1.5 pl-5 marker:text-signal">
                      {content.list.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {content.afterList ? (
                  <p>
                    <Text>{content.afterList}</Text>
                  </p>
                ) : null}
              </div>
              {content.callout ? (
                <Callout tone="sage" className="mt-6">
                  <p>
                    <strong>{content.callout.lead}</strong> <Text>{content.callout.body}</Text>
                  </p>
                </Callout>
              ) : null}
              {content.proof ? <p className="mt-6 border-t border-line pt-4 text-[0.98rem] italic text-muted">{content.proof}</p> : null}
              {i < steps.length - 1 ? <Connectors /> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepHeading({ step, content }: { step: FrameworkStep; content: DetailedStepContent }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <FrameworkIcon step={step.key} className="size-9 shrink-0 text-signal" />
        <span aria-hidden="true" className="font-mono text-xs font-medium tracking-[0.12em] text-signal">
          {step.number}
        </span>
      </div>
      <h3 className="mt-3 text-[1.75rem] font-semibold leading-snug">{step.label}</h3>
      <p className="mt-1 font-display text-lg italic text-signal-deep">
        {content.subtitle}
        {content.meta ? ` (${content.meta})` : ""}
      </p>
    </>
  );
}

/**
 * Connector from one detailed step card to the next: a horizontal line in the column gap at `lg` and above,
 * a vertical line in the row gap below it. Both are decorative.
 */
function Connectors() {
  return (
    <>
      <StepConnector direction="right" className="absolute left-full top-24 hidden h-6 w-14 text-ink/40 lg:block" />
      <StepConnector
        direction="down"
        className="absolute left-1/2 top-full h-12 w-6 -translate-x-1/2 text-ink/40 lg:hidden"
      />
    </>
  );
}
