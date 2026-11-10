import type { ReactNode } from "react";
import { BookCallButton } from "./BookCallButton";
import { Button } from "./Button";
import { Section } from "./Section";

type Props = {
  id: string;
  heading: string;
  body?: string;
  secondary?: { label: string; href: string };
  microcopy?: ReactNode;
  buttonLabel?: string;
};

/** Closing call-to-action band shared by most pages. */
export function CTASection({ id, heading, body, secondary, microcopy, buttonLabel }: Props) {
  return (
    <Section tone="ink" labelledBy={id}>
      <div className="max-w-[var(--container-prose)]">
        <h2 id={id} className="text-[1.9rem] leading-tight sm:text-4xl lg:text-[2.6rem]">
          {heading}
        </h2>
        {body ? <p className="mt-4 text-lg text-paper/85">{body}</p> : null}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <BookCallButton variant="onDark" label={buttonLabel} fullWidthOnMobile />
          {secondary ? (
            <>
              <span className="hidden text-paper/70 sm:inline">or</span>
              <Button href={secondary.href} variant="link" className="!text-paper decoration-paper/50 hover:decoration-paper">
                {secondary.label}
              </Button>
            </>
          ) : null}
        </div>
        {microcopy ? <p className="mt-6 text-sm text-paper/75">{microcopy}</p> : null}
      </div>
    </Section>
  );
}
