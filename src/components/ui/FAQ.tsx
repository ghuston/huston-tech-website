import { Text } from "./Text";

export type FaqItem = { question: string; answer: string };

export function FAQ({ items }: { items: FaqItem[] }) {
  return (
    <div className="max-w-[var(--container-prose)] divide-y divide-line rounded-[14px] border border-line bg-surface">
      {items.map((item) => (
        <details key={item.question} className="group px-5 sm:px-6">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-xl font-semibold leading-snug [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-signal-tint font-mono text-lg text-signal-deep disclosure-icon"
            >
              +
            </span>
          </summary>
          <p className="pb-5 text-ink/85">
            <Text>{item.answer}</Text>
          </p>
        </details>
      ))}
    </div>
  );
}
