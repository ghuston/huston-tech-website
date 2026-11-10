import type { ProofStripContent } from "@/content/home";

export function ProofStrip({ content }: { content: ProofStripContent }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface p-6 sm:p-8">
      <ul className="grid gap-6 sm:grid-cols-3 sm:gap-8">
        {content.stats.map((stat) => (
          <li key={stat.label} className="sm:border-l sm:border-line sm:pl-8 sm:first:border-l-0 sm:first:pl-0">
            <p className="font-display text-5xl font-bold leading-none text-signal sm:text-6xl">{stat.value}</p>
            <p className="mt-3 text-[0.98rem] text-ink/85">{stat.label}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 border-t border-line pt-4 text-sm text-muted">{content.footnote}</p>
    </div>
  );
}
