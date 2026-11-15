import { Text } from "@/components/ui/Text";
import { Button } from "./Button";
import { Container } from "./Container";
import { Door } from "./Door";
import { Glow } from "./Glow";

type DoorBandProps = {
  doors: readonly { title: string; line: string; button: string; href: string }[];
  /** The band's accessible name. It has no visible heading, so the two door titles carry the structure. */
  label: string;
};

/**
 * The two doors (docs/STYLE-GUIDE.md §7.8), where "Say hello" lands (`id="hello"`). Each door's leaf swings open on
 * hover or keyboard focus to show the green behind it; on phones they stack and do not swing. The seam glow straddles
 * the band's top edge, so it blends into the arc above.
 */
export function DoorBand({ doors, label }: DoorBandProps) {
  return (
    <section id="hello" aria-label={label} className="relative pb-[72px] pt-8 md:pb-[110px] md:pt-16">
      <Glow variant="seam" className="left-1/2 top-[-260px] -ml-[650px]" />
      <Container className="relative grid gap-[18px] md:grid-cols-2 md:gap-7">
        {doors.map((door) => (
          <Door key={door.href}>
            <h2 className="font-ui text-h3 font-bold">{door.title}</h2>
            <p className="mb-7 mt-3 text-blurb leading-[1.45] md:pr-6">
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
