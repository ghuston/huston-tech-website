import { framework, siteConfig, type FrameworkStep, type FrameworkStepKey } from "@/content/site";

export function getStep(key: FrameworkStepKey): FrameworkStep {
  const step = framework.steps.find((s) => s.key === key);
  if (!step) throw new Error(`Unknown framework step: ${key}`);
  return step;
}

/** "Find it · Fix it · Flick it" */
export function stepsDotted(): string {
  return framework.steps.map((s) => s.label).join(" · ");
}

/** "Find it, Fix it, Flick it" */
export function stepsList(): string {
  return framework.steps.map((s) => s.label).join(", ");
}

/** "Find it. Fix it. Flick it." */
export function stepsSentence(): string {
  return framework.steps.map((s) => `${s.label}.`).join(" ");
}

/** "Find · Fix · Flick" */
export function shortsDotted(): string {
  return framework.steps.map((s) => s.short).join(" · ");
}

/**
 * Fills framework tokens in a content string so the step names are defined only in `site.ts`:
 * `{find}`, `{fix}`, `{flick}` (labels), `{steps}` (dotted), `{stepsList}` (commas), `{stepsSentence}`, `{shorts}`.
 */
export function fw(template: string): string {
  return template
    .replaceAll("{find}", getStep("find").label)
    .replaceAll("{fix}", getStep("fix").label)
    .replaceAll("{flick}", getStep("flick").label)
    .replaceAll("{stepsSentence}", stepsSentence())
    .replaceAll("{stepsList}", stepsList())
    .replaceAll("{steps}", stepsDotted())
    .replaceAll("{shorts}", shortsDotted());
}

/** Fills `{price}` with the published Review price. Only call when `siteConfig.reviewPrice` is set. */
export function withPrice(template: string): string {
  const price = siteConfig.reviewPrice;
  if (price === null) throw new Error("withPrice called while reviewPrice is null");
  return template.replaceAll("{price}", price);
}
