// The components for this site's own blocks, keyed by block type. See README.md in this folder.
import type { BlockComponent } from "@/blocks/types";
import { PageHeroBlock } from "./page-hero/PageHeroBlock";
import { ClosingCallBlock } from "./closing-call/ClosingCallBlock";
import { HomeHeroBlock } from "./home-hero/HomeHeroBlock";
import { HomeInstallingBlock } from "./home-installing/HomeInstallingBlock";
import { HomeDoorsBlock } from "./home-doors/HomeDoorsBlock";
import { HomeWhyBlock } from "./home-why/HomeWhyBlock";
import { HomeProofBlock } from "./home-proof/HomeProofBlock";
import { HomeAboutBlock } from "./home-about/HomeAboutBlock";
import { ContactPanelBlock } from "./contact-panel/ContactPanelBlock";
import { ContactNextBlock } from "./contact-next/ContactNextBlock";
import { PrivacyTextBlock } from "./privacy-text/PrivacyTextBlock";
import { InsightsIndexBlock } from "./insights-index/InsightsIndexBlock";

export const siteBlockComponents: Record<string, BlockComponent> = {
  "page-hero": PageHeroBlock,
  "closing-call": ClosingCallBlock,
  "home-hero": HomeHeroBlock,
  "home-installing": HomeInstallingBlock,
  "home-doors": HomeDoorsBlock,
  "home-why": HomeWhyBlock,
  "home-proof": HomeProofBlock,
  "home-about": HomeAboutBlock,
  "contact-panel": ContactPanelBlock,
  "contact-next": ContactNextBlock,
  "privacy-text": PrivacyTextBlock,
  "insights-index": InsightsIndexBlock,
};
