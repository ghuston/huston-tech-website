import type { ProofStripContent } from "@/content/home";

/**
 * The proof figures (docs/STYLE-GUIDE.md §7.15): a plain row of big numbers with hairline dividers, then the small
 * print. Three equal columns from 768px, full-width rows below. The figures are client-reported survey scores from the
 * three systems projects.
 */
export function ProofChips({ content }: { content: ProofStripContent }) {
  return (
    <div>
      <ul className="grid divide-y divide-hairline md:grid-cols-3 md:divide-x md:divide-y-0">
        {content.stats.map((stat) => (
          <li key={`${stat.value}-${stat.label}`} className="py-5 first:pt-0 last:pb-0 md:px-8 md:py-0 md:first:pl-0 md:last:pr-0">
            <b className="block font-ui text-step font-bold tracking-[-0.02em] text-green">{stat.value}</b>
            <span className="mt-1 block text-[15px] leading-[1.4] text-ink-2">{stat.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 max-w-[60ch] text-[15px] text-ink-2">{content.footnote}</p>
    </div>
  );
}
