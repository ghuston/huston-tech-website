import { DoorBand } from "@/components/hl/DoorBand";
import { offers } from "@/content/site";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { homeDoorsDefinition } from "./definition";

/** The two doors. Their words are the site's two offers (site.ts); DoorBand sets the section's `hello` id. */
export function HomeDoorsBlock({ content }: BlockProps<ContentOf<typeof homeDoorsDefinition.fields>>) {
  return <DoorBand doors={[offers.website, offers.system]} label={content.label} />;
}
