import type { Offer } from "@/content/site";
import { Text } from "@/components/ui/Text";
import { Button } from "./Button";
import { Container } from "./Container";
import { Door } from "./Door";
import { Glow } from "./Glow";

type DoorBandProps = {
  /** The two offers from site.ts: each door's H2 is the offering's name. */
  doors: readonly Offer[];
  /** The band's accessible name. It has no visible heading, so the two door titles carry the structure. */
  label: string;
};

/**
 * The two doors (docs/STYLE-GUIDE.md §7.8), where "Say hello" lands (`id="hello"`). Each door's leaf swings open on
 * hover or keyboard focus to show the green behind it; on phones they stack and, instead of swinging, each leaf opens
 * a little once as each door comes into view (§9.4, Door). The seam glow straddles the band's top edge, so it blends
 * into the section above.
 */
export function DoorBand({ doors, label }: DoorBandProps) {
  return (
    <section id="hello" aria-label={label} className="scroll-mt-6 md:scroll-mt-12">
      <Glow variant="seam" className="left-1/2 -top-65 -ml-162.5" />
      <Container className="relative grid gap-4.5 md:grid-cols-2 md:gap-7">
        {doors.map((door) => (
          <Door key={door.href}>
            <h2 className="font-ui text-h3 font-bold">{door.name}</h2>
            <p className="mb-7 mt-3 text-blurb leading-compact md:pr-6">
              <Text>{door.line}</Text>
            </p>
            <Button href={door.href} fullWidthOnMobile className="mt-auto">
              {door.button}
            </Button>
          </Door>
        ))}
      </Container>
    </section>
  );
}
