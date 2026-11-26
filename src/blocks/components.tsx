import { siteBlockComponents } from "@/site-blocks/components";
import { BusinessDetailsBlock } from "./library/business-details/BusinessDetailsBlock";
import { ClosingCtaBlock } from "./library/closing-cta/ClosingCtaBlock";
import { ContactFormBlock } from "./library/contact-form/ContactFormBlock";
import { EpisodeListBlock } from "./library/episode-list/EpisodeListBlock";
import { FaqBlock } from "./library/faq/FaqBlock";
import { FormBlock } from "./library/form/FormBlock";
import { GalleryBlock } from "./library/gallery/GalleryBlock";
import { HeroBlock } from "./library/hero/HeroBlock";
import { HighlightsBlock } from "./library/highlights/HighlightsBlock";
import { LatestPostsBlock } from "./library/latest-posts/LatestPostsBlock";
import { LegalSectionsBlock } from "./library/legal-sections/LegalSectionsBlock";
import { PhotoTextBlock } from "./library/photo-text/PhotoTextBlock";
import { PostIndexBlock } from "./library/post-index/PostIndexBlock";
import { ProseBlock } from "./library/prose/ProseBlock";
import { StepsBlock } from "./library/steps/StepsBlock";
import { TeamBlock } from "./library/team/TeamBlock";
import { TestimonialsBlock } from "./library/testimonials/TestimonialsBlock";
import { VideoBlock } from "./library/video/VideoBlock";
import { VideoGridBlock } from "./library/video-grid/VideoGridBlock";
import { VideoListBlock } from "./library/video-list/VideoListBlock";
import type { BlockComponent } from "./types";

export type { BlockComponent, BlockProps } from "./types";

/** Block type to component: the library's, then this site's own. */
export const blockComponents: Record<string, BlockComponent> = {
  hero: HeroBlock,
  highlights: HighlightsBlock,
  prose: ProseBlock,
  faq: FaqBlock,
  "closing-cta": ClosingCtaBlock,
  "contact-form": ContactFormBlock,
  form: FormBlock,
  steps: StepsBlock,
  "legal-sections": LegalSectionsBlock,
  video: VideoBlock,
  "video-grid": VideoGridBlock,
  "photo-text": PhotoTextBlock,
  gallery: GalleryBlock,
  "latest-posts": LatestPostsBlock,
  "post-index": PostIndexBlock,
  "business-details": BusinessDetailsBlock,
  "video-list": VideoListBlock,
  "episode-list": EpisodeListBlock,
  testimonials: TestimonialsBlock,
  team: TeamBlock,
  ...siteBlockComponents,
};
