import { SiteChrome } from "@/components/layout/SiteChrome";

/** Every page with the site header and footer. The root layout holds the document shell; /card sits outside this group. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
