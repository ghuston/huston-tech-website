import { Container } from "@/components/hl/Container";
import { FormView } from "@/components/hl/FormView";
import { Text } from "@/components/ui/Text";
import { providers } from "@/content/providers";
import { formById, viewProps } from "@/lib/forms";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { formDefinition } from "./definition";

/**
 * One form in a panel. The client component gets `viewProps` only, so a download form's link never reaches the browser:
 * it is mailed after the submission (docs/superpowers/specs/2026-11-25-forms-and-downloads-design.md, R9).
 */
export function FormBlock({ content, variant, anchor, headingId }: BlockProps<ContentOf<typeof formDefinition.fields>>) {
  const definition = formById(content.form);
  if (definition === null) return null;
  const beside = variant === "beside";
  const text = (
    <>
      {content.heading ? (
        <h2 id={headingId} className="font-ui text-card-title font-bold">
          <Text>{content.heading}</Text>
        </h2>
      ) : null}
      {content.intro ? (
        <p className={`${content.heading ? "mt-4 " : ""}max-w-narrow text-body`}>
          <Text>{content.intro}</Text>
        </p>
      ) : null}
    </>
  );
  const hasText = Boolean(content.heading || content.intro);
  const view = <FormView {...viewProps(content.form, definition)} noScriptEmail={providers.email} />;
  return (
    <section id={anchor} aria-labelledby={content.heading ? headingId : undefined} className="scroll-mt-24">
      <Container>
        {beside ? (
          <div className="grid items-start gap-12 split:grid-cols-[5fr_7fr] split:gap-12">
            {hasText ? <div>{text}</div> : null}
            <div className={hasText ? "" : "split:col-span-2"}>{view}</div>
          </div>
        ) : (
          <div className="mx-auto max-w-faq">
            {hasText ? <div className="mb-8">{text}</div> : null}
            {view}
          </div>
        )}
      </Container>
    </section>
  );
}
