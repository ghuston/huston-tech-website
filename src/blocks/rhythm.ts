// Vertical rhythm: the padding every block gets, owned by the renderer so no block carries its own (spec 5.9).
import { siteRhythms } from "../site-blocks/design.ts";
import type { RhythmRow } from "../site-blocks/design.ts";
import type { AnyBlockDefinition } from "./schema.ts";

const RHYTHM = {
  hero: { full: "pt-18 pb-16", bottom: "pb-16" },
  section: { full: "py-16 md:py-24", bottom: "pb-16 md:pb-24" },
  compact: { full: "py-12 md:py-16", bottom: "pb-12 md:pb-16" },
} as const satisfies Record<string, RhythmRow>;

/** The template's rhythm names, in order. */
export const BUILT_IN_RHYTHMS: readonly string[] = Object.keys(RHYTHM);

/** Every rhythm a block may name: the template's, then this site's (src/site-blocks/design.ts). A site name cannot replace a template one. */
export function rhythmTable(extra: Readonly<Record<string, RhythmRow>> = siteRhythms): Record<string, RhythmRow> {
  return { ...extra, ...RHYTHM };
}

/** The padding classes for the block at `index`. A block that joins the hero and comes right after it keeps only its bottom padding. */
export function spacingFor(def: AnyBlockDefinition, index: number, previous: AnyBlockDefinition | undefined, extra: Readonly<Record<string, RhythmRow>> = siteRhythms): string {
  const row = rhythmTable(extra)[def.placement.rhythm];
  if (row === undefined) throw new Error(`The block "${def.type}" names the rhythm "${def.placement.rhythm}", which is not defined.`);
  const joinsHero = index > 0 && def.placement.joinsHero === true && previous?.placement.rhythm === "hero";
  return joinsHero ? row.bottom : row.full;
}
