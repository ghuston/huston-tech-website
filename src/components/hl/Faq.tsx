import { Text } from "@/components/ui/Text";
import { FadingDivider } from "./FadingDivider";

type FaqProps = { items: readonly { question: string; answer: string }[] };

/**
 * FAQ accordion (docs/STYLE-GUIDE.md §7.29): native details/summary, so it works without JS and by keyboard. No height
 * animation; the icon is a green ring that gains the logo's rust dot when open, changing instantly.
 */
export function Faq({ items }: FaqProps) {
  return (
    <div>
      {items.map((item, index) => (
        <div key={item.question}>
          {index > 0 ? <FadingDivider /> : null}
          <details className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-3 font-ui text-deck font-semibold leading-snug [&::-webkit-details-marker]:hidden">
              <span>
                <Text>{item.question}</Text>
              </span>
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 shrink-0" fill="none">
                <circle cx="10" cy="10" r="8.5" stroke="var(--hl-green)" strokeWidth="1.75" />
                <circle cx="10" cy="10" r="4" fill="var(--hl-rust)" className="opacity-0 group-open:opacity-100" />
              </svg>
            </summary>
            <p className="max-w-answer pb-6 text-control leading-list">
              <Text>{item.answer}</Text>
            </p>
          </details>
        </div>
      ))}
    </div>
  );
}
