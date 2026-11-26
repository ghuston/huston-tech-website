// This site's own blocks. See README.md in this folder. The template ships this list empty and never changes it, so a
// template update leaves the site's blocks alone.
import type { AnyBlockDefinition } from "../blocks/schema.ts";
import { pageHeroDefinition } from "./page-hero/definition.ts";
import { closingCallDefinition } from "./closing-call/definition.ts";
import { homeHeroDefinition } from "./home-hero/definition.ts";
import { homeInstallingDefinition } from "./home-installing/definition.ts";
import { homeDoorsDefinition } from "./home-doors/definition.ts";
import { homeWhyDefinition } from "./home-why/definition.ts";
import { homeProofDefinition } from "./home-proof/definition.ts";
import { homeAboutDefinition } from "./home-about/definition.ts";
import { contactPanelDefinition } from "./contact-panel/definition.ts";
import { contactNextDefinition } from "./contact-next/definition.ts";
import { privacyTextDefinition } from "./privacy-text/definition.ts";
import { insightsIndexDefinition } from "./insights-index/definition.ts";

export const siteBlocks: AnyBlockDefinition[] = [
  pageHeroDefinition,
  closingCallDefinition,
  homeHeroDefinition,
  homeInstallingDefinition,
  homeDoorsDefinition,
  homeWhyDefinition,
  homeProofDefinition,
  homeAboutDefinition,
  contactPanelDefinition,
  contactNextDefinition,
  privacyTextDefinition,
  insightsIndexDefinition,
];
