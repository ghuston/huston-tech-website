import { Button } from "@/components/hl/Button";
import { Container } from "@/components/hl/Container";
import { ContactForm } from "@/components/hl/ContactForm";
import { ContactFlowArt } from "@/components/illustrations/BrandArt";
import { Text } from "@/components/ui/Text";
import { siteConfig } from "@/content/site";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { contactPanelDefinition } from "./definition";

const h2 = "font-ui text-head font-bold leading-tight tracking-head";

/** Contact (docs/website-plan.md B7, STYLE-GUIDE §7.32): the scheduler column, then the note form. The `book` id is where "/contact#book" lands. */
export function ContactPanelBlock({ content, anchor }: BlockProps<ContentOf<typeof contactPanelDefinition.fields>>) {
  return (
    <section>
      <Container className="grid items-start gap-12 split:grid-cols-[5fr_7fr] split:gap-12">
        <div id={anchor} className="scroll-mt-24">
          <h2 className={h2}>{content.heading}</h2>
          <p className="mt-4 max-w-narrow text-body">{content.body}</p>
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
          {/* The note's path, drawn: form → inbox, sheet row and reply. Beside the form only; on narrow screens the form comes first. */}
          <ContactFlowArt draw className="mt-14 hidden max-w-aside split:block" />
        </div>
        <ContactForm />
      </Container>
    </section>
  );
}
