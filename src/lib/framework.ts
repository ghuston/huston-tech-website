import { framework, siteConfig, type FrameworkStep, type FrameworkStepKey } from "@/content/site";

export function getStep(key: FrameworkStepKey): FrameworkStep {
  const step = framework.steps.find((s) => s.key === key);
  if (!step) throw new Error(`Unknown framework step: ${key}`);
  return step;
}

/** "Scope it · Shape it · Ship it" */
export function stepsDotted(): string {
  return framework.steps.map((s) => s.label).join(" · ");
}

/** "Scope it, Shape it, Ship it" */
export function stepsList(): string {
  return framework.steps.map((s) => s.label).join(", ");
}

/** "Scope it. Shape it. Ship it." */
export function stepsSentence(): string {
  return framework.steps.map((s) => `${s.label}.`).join(" ");
}

/**
 * Fills framework tokens in a content string so the step names are defined only in `site.ts`:
 * `{scope}`, `{shape}`, `{ship}` (labels), `{steps}` (dotted), `{stepsList}` (commas), `{stepsSentence}`.
 */
export function fw(template: string): string {
  return template
    .replaceAll("{scope}", getStep("scope").label)
    .replaceAll("{shape}", getStep("shape").label)
    .replaceAll("{ship}", getStep("ship").label)
    .replaceAll("{stepsSentence}", stepsSentence())
    .replaceAll("{stepsList}", stepsList())
    .replaceAll("{steps}", stepsDotted());
}

/** Fills `{price}` with the published Review price. Only call when `siteConfig.reviewPrice` is set. */
export function withPrice(template: string): string {
  const price = siteConfig.reviewPrice;
  if (price === null) throw new Error("withPrice called while reviewPrice is null");
  return template.replaceAll("{price}", price);
}
