import { Text } from "@/components/ui/Text";
import { Container } from "./Container";
import { FadingDivider } from "./FadingDivider";
import { TextLink } from "./TextLink";

type Link = { label: string; href: string };

type ServiceGroupsProps = {
  content: {
    heading: string;
    intro: string;
    groups: readonly {
      heading: string;
      items: readonly { title: string; body: string }[];
      link: Link;
    }[];
    zoho: { lead: string; body: string; link: Link };
  };
};

/** "Already on Zoho?" (docs/STYLE-GUIDE.md §7.13): one line on a tint panel. No border, no left rule, no icon. */
export function ZohoCallout({ lead, body, link }: { lead: string; body: string; link: Link }) {
  return (
    <div className="flex flex-col gap-2 rounded-card bg-tint px-6 py-5 md:flex-row md:items-center md:justify-between md:gap-6">
      <p className="text-[17px]">
        <span className="font-ui font-semibold text-green">{lead}</span> {body}
      </p>
      <TextLink href={link.href}>{link.label}</TextLink>
    </div>
  );
}

/**
 * What I do (docs/STYLE-GUIDE.md §7.12): two equal groups side by side, stacked on phones, then the Zoho callout.
 * No icons, no cards, no price badge: the price lives in the item's title as copy.
 */
export function ServiceGroups({ content }: ServiceGroupsProps) {
  return (
    <section aria-labelledby="what-i-do-title" className="py-16 md:py-24">
      <Container>
        <h2 id="what-i-do-title" className="font-ui text-h2 font-bold">
          {content.heading}
        </h2>
        <p className="mt-5 max-w-[60ch] text-body">{content.intro}</p>
        <div className="mt-12 grid gap-16 md:grid-cols-2">
          {content.groups.map((group) => (
            <div key={group.heading}>
              <h3 className="font-ui text-[28px] font-bold leading-tight tracking-[-0.03em]">{group.heading}</h3>
              <ul className="mt-6">
                {group.items.map((item, index) => (
                  <li key={item.title}>
                    {index > 0 ? <FadingDivider className="my-6" /> : null}
                    <p className="font-ui text-[20px] font-semibold leading-snug">
                      <Text>{item.title}</Text>
                    </p>
                    <p className="mt-2 text-[17px] leading-[1.55]">{item.body}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <TextLink href={group.link.href}>{group.link.label}</TextLink>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-14">
          <ZohoCallout {...content.zoho} />
        </div>
      </Container>
    </section>
  );
}
