import { CellDividers } from "./CellDividers";
import { Container } from "./Container";

type ReasonListProps = {
  heading: string;
  items: readonly { title: string; body: string }[];
};

/** Why people hire me (docs/STYLE-GUIDE.md §7.21): the reasons in a 2-column grid (one column on phones), fading dividers, no cards. */
export function ReasonList({ heading, items }: ReasonListProps) {
  return (
    <section aria-labelledby="why-title" className="py-16 md:py-24">
      <Container>
        <h2 id="why-title" className="font-ui text-h2 font-bold">
          {heading}
        </h2>
        <ul className="mt-12 grid gap-x-12 gap-y-14 md:grid-cols-2">
          {items.map((item, index) => (
            <li key={item.title} className="relative">
              <p className="font-ui text-item font-semibold">{item.title}</p>
              <p className="mt-2 text-[17px] leading-[1.55]">{item.body}</p>
              <CellDividers index={index} total={items.length} md={2} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
