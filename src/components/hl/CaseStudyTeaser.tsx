import { TextLink } from "./TextLink";
import { TiltCard } from "./PointerTilt";

type CaseStudyTeaserProps = {
  name: string;
  body: string;
  href: string;
  linkLabel: string;
};

/**
 * A case-study teaser on the tilt-and-glow card (docs/STYLE-GUIDE.md §6.3, §7.16). Text only until blurred
 * screenshots exist: no placeholder image. The card is not a link itself; its "Read the project" link is, and keyboard
 * focus on it shows the glow centered (no tilt).
 */
export function CaseStudyTeaser({ name, body, href, linkLabel }: CaseStudyTeaserProps) {
  return (
    <TiltCard>
      <h3 className="font-ui text-item font-semibold">{name}</h3>
      <p className="mt-2 text-[17px] leading-[1.55]">{body}</p>
      <div className="mt-4">
        <TextLink href={href}>{linkLabel}</TextLink>
      </div>
    </TiltCard>
  );
}
