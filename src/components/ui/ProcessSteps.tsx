import { Arrow } from "@/components/illustrations/Arrow";
import { Text } from "./Text";

export type ProcessStep = { title: string; body: string };

export function ProcessSteps({ steps }: { steps: ProcessStep[] }) {
  return (
    <ol className="grid gap-14 lg:grid-cols-3 lg:gap-16">
      {steps.map((step, i) => (
        <li key={step.title} className="relative rounded-[14px] border border-line bg-surface p-6 sm:p-8">
          <span className="mb-4 inline-grid size-11 place-items-center rounded-full bg-ink font-mono text-base font-medium text-note">
            {i + 1}
          </span>
          <h3 className="text-2xl leading-snug">{step.title}</h3>
          <p className="mt-3 text-ink/85">
            <Text>{step.body}</Text>
          </p>
          {i < steps.length - 1 ? (
            <>
              <Arrow direction="down" className="absolute -bottom-12 left-1/2 h-9 w-16 -translate-x-1/2 text-signal lg:hidden" />
              <Arrow className="absolute -right-14 top-1/2 hidden h-9 w-16 -translate-y-1/2 text-signal lg:block" />
            </>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
