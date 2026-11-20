export type ProofStripContent = {
  stats: { value: string; label: string }[];
  footnote: string;
};

/**
 * The proof chips (docs/STYLE-GUIDE.md §7.15): a wrapping row of white chips, each a green dot, the figure in Outfit
 * 600 and its label, then the small print. The figures are client-reported survey scores from the systems projects.
 * Each chip carries `data-chip` for the Proof section's in-view moment (§9.4); numbers never count up.
 */
export function ProofChips({ content }: { content: ProofStripContent }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-3.5">
      <ul className="flex flex-wrap gap-2.5 md:gap-3">
        {content.stats.map((stat) => (
          <li
            key={`${stat.value}-${stat.label}`}
            data-chip=""
            className="inline-flex items-center gap-2.5 rounded-btn border border-ink/10 bg-white px-3.5 py-2.5 text-[13px] leading-[1.3] text-ink-2 shadow-chip"
          >
            <span aria-hidden="true" className="size-[9px] flex-none rounded-pill bg-green" />
            <span>
              <b className="font-ui text-[14px] font-semibold text-ink">{stat.value}</b> {stat.label}
            </span>
          </li>
        ))}
      </ul>
      <p className="max-w-[60ch] text-small text-ink-2">{content.footnote}</p>
    </div>
  );
}
