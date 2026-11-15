import { siteConfig } from "@/content/site";
import { Placeholder } from "./Placeholder";

/** Email link, or a visible placeholder while `siteConfig.email` is null. */
export function ContactEmail() {
  if (siteConfig.email) {
    return (
      <a href={`mailto:${siteConfig.email}`} className="text-sage underline underline-offset-4">
        {siteConfig.email}
      </a>
    );
  }
  return <Placeholder>[[email address]]</Placeholder>;
}
