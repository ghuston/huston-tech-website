import { Hero } from "@/components/hl/Hero";
import { HeroStack } from "@/components/hl/HeroStack";
import { bookCallHref } from "@/components/ui/BookCallButton";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { homeHeroDefinition } from "./definition";

/** Home's first screen. Hero draws its own section and glow; the h1 id is `hero-title` (anchor "hero"). */
export function HomeHeroBlock({ content }: BlockProps<ContentOf<typeof homeHeroDefinition.fields>>) {
  const { stack, ...words } = content;
  return <Hero content={words} callHref={bookCallHref()} stack={<HeroStack content={stack} />} />;
}
