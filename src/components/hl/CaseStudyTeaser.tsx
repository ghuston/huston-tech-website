import { Picture } from "./Picture";
import { TextLink } from "./TextLink";
import { TiltCard } from "./PointerTilt";

type CaseStudyTeaserProps = {
  name: string;
  body: string;
  href: string;
  linkLabel: string;
  /** The project's screenshot (names blurred), as on Past work. `src` has no extension (see Picture). */
  image?: { src: string; alt: string; width: number; height: number };
};

/**
 * A case-study teaser on the tilt-and-glow card (docs/STYLE-GUIDE.md §6.3, §7.16). With a screenshot, it sits above
 * the text, and beside it on wide screens. The card is not a link itself; its "Read the project" link is, and keyboard
 * focus on it shows the glow centered (no tilt).
 */
export function CaseStudyTeaser({ name, body, href, linkLabel, image }: CaseStudyTeaserProps) {
  const text = (
    <div>
      <h3 className="font-ui text-item font-semibold">{name}</h3>
      <p className="mt-2 text-[17px] leading-[1.55]">{body}</p>
      <div className="mt-2">
        <TextLink href={href}>{linkLabel}</TextLink>
      </div>
    </div>
  );
  if (!image) return <TiltCard>{text}</TiltCard>;
  return (
    <TiltCard className="grid h-full content-start gap-5 p-[18px] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:content-center xl:items-center">
      <Picture
        src={image.src}
        width={image.width}
        height={image.height}
        alt={image.alt}
        className="block h-auto w-full rounded-field border border-hairline"
      />
      {text}
    </TiltCard>
  );
}
