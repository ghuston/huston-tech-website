import type { ReactNode } from "react";

type Props = {
  id: string;
  children: ReactNode;
  intro?: ReactNode;
  className?: string;
};

export function SectionHeading({ id, children, intro, className = "" }: Props) {
  return (
    <header className={`mb-10 max-w-[var(--container-prose)] lg:mb-14 ${className}`}>
      <h2 id={id} className="text-[1.75rem] leading-tight sm:text-4xl lg:text-[2.5rem]">
        {children}
      </h2>
      {intro ? <p className="mt-4 text-muted">{intro}</p> : null}
    </header>
  );
}
