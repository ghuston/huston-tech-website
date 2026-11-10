import type { ServiceBlock } from "@/content/services";
import { Text } from "./Text";

type Props = { block: ServiceBlock; goodFitLabel?: string };

export function ServiceCard({ block, goodFitLabel = "Good fit if:" }: Props) {
  const headingId = `svc-${block.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  return (
    <article
      id={block.id}
      aria-labelledby={headingId}
      className="scroll-mt-40 rounded-[14px] border border-line bg-surface p-6 transition-shadow duration-150 hover:shadow-lift motion-reduce:transition-none sm:p-8"
    >
      <h3 id={headingId} className="text-2xl leading-snug sm:text-[1.65rem]">
        {block.title}
      </h3>
      {block.tagline ? <p className="mt-2 font-display text-lg italic text-signal-deep">{block.tagline}</p> : null}
      <div className="mt-4 space-y-4 text-ink/85">
        {block.paragraphs.map((paragraph) => (
          <p key={paragraph}>
            <Text>{paragraph}</Text>
          </p>
        ))}
        {block.bullets ? (
          <ul className="list-disc space-y-1.5 pl-5 marker:text-signal">
            {block.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
        {block.afterBullets?.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {block.goodFit ? (
        <p className="mt-5 rounded-[10px] bg-sage-tint px-4 py-3 text-[0.98rem]">
          <strong className="font-semibold text-sage">{goodFitLabel}</strong> {block.goodFit}
        </p>
      ) : null}
      {block.note ? <p className="mt-4 text-[0.98rem] italic text-muted">{block.note}</p> : null}
    </article>
  );
}
