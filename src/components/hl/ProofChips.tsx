import type { ProofStripContent } from "@/content/home";

/**
 * The proof figures (docs/STYLE-GUIDE.md §7.15), replacing v2's big-number strip: a row of chips on the page
 * background, then the small print. The figures are client-reported survey scores from the three systems projects.
 */
export function ProofChips({ content }: { content: ProofStripContent }) {
  return (
    <div>
      <ul className="flex flex-wrap gap-4">
        {content.stats.map((stat) => (
          <li
            key={`${stat.value}-${stat.label}`}
            className="inline-flex items-center gap-[10px] rounded-btn border border-ink/10 bg-white px-[14px] py-[10px] shadow-chip"
          >
            <i aria-hidden="true" className="size-[9px] shrink-0 rounded-pill bg-green" />
            <span className="text-[12px] leading-[1.3] text-ink-2">
              <b className="block font-ui text-[14px] font-semibold leading-[1.2] text-ink">{stat.value}</b>
              {stat.label}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-[60ch] text-small text-ink-2">{content.footnote}</p>
    </div>
  );
}
