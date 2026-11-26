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
import { TextSectionBlock } from "./text-section/TextSectionBlock";
import { TextStackBlock } from "./text-stack/TextStackBlock";
import { DotSectionBlock } from "./dot-section/DotSectionBlock";
import { AboutIntroBlock } from "./about-intro/AboutIntroBlock";
import { ArtSectionBlock } from "./art-section/ArtSectionBlock";
import { ProcessStepsBlock } from "./process-steps/ProcessStepsBlock";
import { StepListSectionBlock } from "./step-list-section/StepListSectionBlock";
import { SystemsDemoBlock } from "./systems-demo/SystemsDemoBlock";
import { SectionNavBlock } from "./section-nav/SectionNavBlock";
import { ReadingGuideBlock } from "./reading-guide/ReadingGuideBlock";
import { ServicesWebsitesBlock } from "./services-websites/ServicesWebsitesBlock";
import { ServiceListBlock } from "./service-list/ServiceListBlock";
import { ServiceGroupsBlock } from "./service-groups/ServiceGroupsBlock";
import { FaqListBlock } from "./faq-list/FaqListBlock";
import { CaseStudiesBlock } from "./case-studies/CaseStudiesBlock";
import { AgencySnapshotsBlock } from "./agency-snapshots/AgencySnapshotsBlock";

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
  "text-section": TextSectionBlock,
  "text-stack": TextStackBlock,
  "dot-section": DotSectionBlock,
  "about-intro": AboutIntroBlock,
  "art-section": ArtSectionBlock,
  "process-steps": ProcessStepsBlock,
  "step-list-section": StepListSectionBlock,
  "systems-demo": SystemsDemoBlock,
  "section-nav": SectionNavBlock,
  "reading-guide": ReadingGuideBlock,
  "services-websites": ServicesWebsitesBlock,
  "service-list": ServiceListBlock,
  "service-groups": ServiceGroupsBlock,
  "faq-list": FaqListBlock,
  "case-studies": CaseStudiesBlock,
  "agency-snapshots": AgencySnapshotsBlock,
};
