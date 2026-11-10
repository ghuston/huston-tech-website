import Link from "next/link";
import { FrameworkIcon } from "@/components/illustrations/FrameworkIcon";
import { StepConnector } from "@/components/illustrations/StepConnector";
import { framework, type FrameworkStep, type FrameworkStepKey } from "@/content/site";
import { getStep } from "@/lib/framework";
import { BookCallButton } from "./BookCallButton";
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
  link: { label: string; href: string };
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

function CompactSteps({ srHeading, link }: CompactProps) {
  return (
    <div>
      <h2 className="sr-only">{srHeading}</h2>
      <ol className="grid gap-x-12 gap-y-10 md:grid-cols-3">
        {framework.steps.map((step, i) => (
          <li
            key={step.key}
            className="relative flex gap-4 rounded-[14px] border border-line bg-surface p-5 sm:p-6 md:block"
          >
            <FrameworkIcon step={step.key} className="size-9 shrink-0 text-ink md:mb-4 md:size-10" />
            <div>
              <span aria-hidden="true" className="font-mono text-xs font-medium tracking-[0.12em] text-signal">
                {step.number}
              </span>
              <h3 className="mt-1 text-2xl font-semibold leading-snug">{step.label}</h3>
              <p className="mt-2 text-ink/85">{step.oneLiner}</p>
            </div>
            {i < framework.steps.length - 1 ? <Connectors gapClass="md" /> : null}
          </li>
        ))}
      </ol>
      <p className="mt-6">
        <Link href={link.href} className="inline-flex min-h-11 items-center font-semibold text-sage underline underline-offset-4">
          {link.label}
        </Link>
      </p>
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
              {i < steps.length - 1 ? <Connectors gapClass="lg" /> : null}
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
        <FrameworkIcon step={step.key} className="size-9 shrink-0 text-ink" />
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
 * Connector from one step card to the next: a horizontal line in the column gap at `gapClass` and above,
 * a vertical line in the row gap below it. Both are decorative.
 */
function Connectors({ gapClass }: { gapClass: "md" | "lg" }) {
  const horizontal =
    gapClass === "md"
      ? "hidden md:block absolute left-full top-1/2 h-6 w-12 -translate-y-1/2"
      : "hidden lg:block absolute left-full top-24 h-6 w-14";
  const vertical =
    gapClass === "md"
      ? "md:hidden absolute left-1/2 top-full h-10 w-5 -translate-x-1/2"
      : "lg:hidden absolute left-1/2 top-full h-12 w-6 -translate-x-1/2";
  return (
    <>
      <StepConnector direction="right" className={`${horizontal} text-ink/40`} />
      <StepConnector direction="down" className={`${vertical} text-ink/40`} />
    </>
  );
}
