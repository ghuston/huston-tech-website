import { Container } from "@/components/hl/Container";
import { Photo } from "@/components/hl/Photo";
import { Text } from "@/components/ui/Text";
import { initials, itemText } from "@/blocks/list-format";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf, ImageFocus } from "@/blocks/schema";
import type { teamDefinition } from "./definition";

type ImageValue = { src: string; alt: string; focus?: ImageFocus };
type Member = { slug: string; name: string; role: string; bio?: string; photo?: ImageValue };

/** A photo or, without one, a tinted panel of the same 4:5 shape with the person's initials (calm, in the quieter ink), so every card has one shape. */
function Portrait({ member }: { member: Member }) {
  if (member.photo) {
    return <Photo image={member.photo} shape="4:5" sizes="(min-width: 1320px) 400px, (min-width: 1024px) 30vw, 50vw" />;
  }
  return (
    <div aria-hidden="true" className="grid aspect-photo-4-5 w-full place-items-center rounded-card bg-tint font-ui text-item font-semibold text-ink-2">
      {initials(member.name)}
    </div>
  );
}

/** The people of the Team collection, in the order the collection sets. `grid` has portraits; `list` is names and roles only. */
export function TeamBlock({ content, variant, anchor, headingId, items }: BlockProps<ContentOf<typeof teamDefinition.fields>>) {
  const members = items.flatMap((item): Member[] => {
    const name = itemText(item.data, "name");
    const role = itemText(item.data, "role");
    if (name === undefined || role === undefined) return [];
    const photo = item.data.photo as ImageValue | undefined;
    return [{ slug: item.slug, name, role, bio: itemText(item.data, "bio"), photo }];
  });
  const list = variant === "list";
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24">
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          <Text>{content.heading}</Text>
        </h2>
        {content.intro ? (
          <p className="mt-4 max-w-intro text-blurb">
            <Text>{content.intro}</Text>
          </p>
        ) : null}
        {list ? (
          <ul role="list" className="mt-10 grid gap-x-12 md:grid-cols-2">
            {members.map((member) => (
              <li key={member.slug} className="border-t border-hairline py-5">
                <p className="font-ui text-item font-semibold">
                  <Text>{member.name}</Text>
                </p>
                <p className="mt-1 text-list text-ink-2">
                  <Text>{member.role}</Text>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <ul role="list" className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:gap-x-8 md:gap-y-12 lg:grid-cols-3">
            {members.map((member) => (
              <li key={member.slug}>
                <Portrait member={member} />
                <p className="mt-5 font-ui text-item font-semibold">
                  <Text>{member.name}</Text>
                </p>
                <p className="mt-1 text-list text-ink-2">
                  <Text>{member.role}</Text>
                </p>
                {member.bio ? (
                  <p className="mt-3 text-label">
                    <Text>{member.bio}</Text>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
