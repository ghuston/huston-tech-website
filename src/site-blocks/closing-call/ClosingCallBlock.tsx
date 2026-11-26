import { Button } from "@/components/hl/Button";
import { ClosingCtaInner } from "@/components/hl/ClosingCta";
import { TextLink } from "@/components/hl/TextLink";
import { TwoVoice } from "@/components/hl/TwoVoice";
import { bookCallHref } from "@/components/ui/BookCallButton";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { closingCallDefinition } from "./definition";

/** The closing call to action. Two lines make the two-voice heading and a full-width phone button; one `heading` makes a plain H2. */
export function ClosingCallBlock({ content }: BlockProps<ContentOf<typeof closingCallDefinition.fields>>) {
  const twoVoice = content.line1 !== undefined && content.line2 !== undefined;
  const heading = twoVoice ? <TwoVoice line1={content.line1 as string} line2={content.line2 as string} /> : <h2 className="font-ui text-h2 font-bold">{content.heading}</h2>;
  return (
    <section>
      <ClosingCtaInner heading={heading} body={content.body}>
        <Button href={bookCallHref()} fullWidthOnMobile={twoVoice}>
          {content.cta}
        </Button>
        {content.secondary ? <TextLink href={content.secondary.href}>{content.secondary.label}</TextLink> : null}
      </ClosingCtaInner>
    </section>
  );
}
