import { Button } from "@/components/hl/Button";
import { Container } from "@/components/hl/Container";
import { ContactForm } from "@/components/hl/ContactForm";
import { Text } from "@/components/ui/Text";
import { siteConfig } from "@/content/site";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { contactFormDefinition } from "./definition";

/** The booking column (the scheduler, or a note until one is set) beside the note form. */
export function ContactFormBlock({ content, anchor, headingId }: BlockProps<ContentOf<typeof contactFormDefinition.fields>>) {
  return (
    <section aria-labelledby={headingId}>
      <Container className="grid items-start gap-12 split:grid-cols-[5fr_7fr] split:gap-12">
        <div id={anchor} className="scroll-mt-24">
          <h2 id={headingId} className="font-ui text-card-title font-bold">
            <Text>{content.heading}</Text>
          </h2>
          <p className="mt-4 max-w-narrow text-body">
            <Text>{content.body}</Text>
          </p>
          <div className="mt-6">
            {siteConfig.schedulerUrl ? (
              <Button href={siteConfig.schedulerUrl} fullWidthOnMobile>
                {content.buttonLabel}
              </Button>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  className="inline-flex min-h-13.5 w-full cursor-not-allowed items-center justify-center rounded-btn bg-ink/40 px-6 font-ui text-btn font-semibold text-white md:w-auto md:justify-start"
                >
                  {content.buttonLabel}
                </button>
                <p className="mt-4 text-small">
                  <Text>{content.unsetNote}</Text>
                </p>
              </>
            )}
          </div>
        </div>
        <ContactForm idPrefix="contact-form-block" />
      </Container>
    </section>
  );
}
