// The site's settings files (business details, brand, notice), checked at build. Server only.
import type { BrandData } from "../settings/brand.ts";
import type { BusinessData } from "../settings/business.ts";
import type { NoticeData } from "../settings/notice.ts";
import { getSiteContent } from "./site-content.ts";

export const getBusiness = (): BusinessData => getSiteContent().business;
export const getBrand = (): BrandData => getSiteContent().brand;
export const getNotice = (): NoticeData => getSiteContent().notice;
