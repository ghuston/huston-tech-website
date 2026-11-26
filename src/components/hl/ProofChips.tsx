import { InViewOnce } from "@/components/ui/InViewOnce";

export type ProofStripContent = {
  stats: { value: string; label: string }[];
  footnote: string;
};

/**
 * The proof chips (docs/STYLE-GUIDE.md §7.15): a wrapping row of white chips, each a green dot, the figure in Outfit
 * 600 and its label, then the small print. The figures are client-reported survey scores from the systems projects.
 * The chips are the Proof section's one moment (§9.4): once in view they pop in one after another (`--i`, hl.css);
 * numbers never count up.
 */
export function ProofChips({ content }: { content: ProofStripContent }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-3.5">
      <InViewOnce as="ul" className="hl-chips flex flex-wrap gap-2.5 md:gap-3">
        {content.stats.map((stat) => (
          <li
            key={`${stat.value}-${stat.label}`}
            data-chip=""
            className="inline-flex items-center gap-2.5 rounded-btn border border-ink/10 bg-white px-3.5 py-2.5 text-fine leading-fine text-ink-2 shadow-chip"
          >
            <span aria-hidden="true" className="size-2.25 flex-none rounded-pill bg-green" />
            <span>
              <b className="font-ui text-note font-semibold text-ink">{stat.value}</b> {stat.label}
            </span>
          </li>
        ))}
      </InViewOnce>
      <p className="max-w-intro text-small text-ink-2">{content.footnote}</p>
    </div>
  );
}
