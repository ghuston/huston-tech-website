import { AboutTeaser } from "@/components/hl/AboutTeaser";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { homeAboutDefinition } from "./definition";

/** The about teaser. AboutTeaser draws its own section, whose heading id is `about-teaser-title` (anchor "about-teaser"). */
export function HomeAboutBlock({ content }: BlockProps<ContentOf<typeof homeAboutDefinition.fields>>) {
  return <AboutTeaser heading={content.heading} body={content.body} link={content.link} />;
}
