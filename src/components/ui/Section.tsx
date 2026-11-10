import type { ReactNode } from "react";
import { Container } from "./Container";

type Tone = "paper" | "sage" | "ink" | "surface";

type Props = {
  id?: string;
  /** Id of the heading inside, for the section's accessible name. */
  labelledBy?: string;
  tone?: Tone;
  children: ReactNode;
  className?: string;
  prose?: boolean;
};

const tones: Record<Tone, string> = {
  paper: "bg-paper text-ink",
  sage: "bg-sage-tint text-ink",
  surface: "bg-surface text-ink",
  ink: "on-dark bg-ink text-paper",
};

export function Section({ id, labelledBy, tone = "paper", children, className = "", prose }: Props) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`scroll-mt-24 py-16 lg:py-24 ${tones[tone]} ${className}`}>
      <Container prose={prose}>{children}</Container>
    </section>
  );
}
