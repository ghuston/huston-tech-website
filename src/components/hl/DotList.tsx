import { Text } from "@/components/ui/Text";

/** A list with a 7px green dot as its bullet, 12px from the text (docs/STYLE-GUIDE.md §7.28, §7.30). Items take **bold** and [[placeholders]]. */
export function DotList({ items, className = "" }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={`space-y-3 text-control leading-list ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-dot size-1.75 shrink-0 rounded-pill bg-green" />
          <span>
            <Text>{item}</Text>
          </span>
        </li>
      ))}
    </ul>
  );
}
