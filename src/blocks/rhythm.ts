// Vertical rhythm: the padding every block gets, owned by the renderer so no block carries its own (spec 5.9).
import type { AnyBlockDefinition } from "./schema.ts";

const RHYTHM = {
  hero: { full: "pt-18 pb-16", bottom: "pb-16" },
  section: { full: "py-16 md:py-24", bottom: "pb-16 md:pb-24" },
  compact: { full: "py-12 md:py-16", bottom: "pb-12 md:pb-16" },
} as const;

/** The padding classes for the block at `index`. A block that joins the hero and comes right after it keeps only its bottom padding. */
export function spacingFor(def: AnyBlockDefinition, index: number, previous: AnyBlockDefinition | undefined): string {
  const row = RHYTHM[def.placement.rhythm];
  const joinsHero = index > 0 && def.placement.joinsHero === true && previous?.placement.rhythm === "hero";
  return joinsHero ? row.bottom : row.full;
}
