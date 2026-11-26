import { InViewOnce } from "@/components/ui/InViewOnce";
import { CircleTick } from "./Tick";

type TalkPair = { said: string; result: string };

/**
 * What the owner says and what the system does (docs/website-rev8.md B1 §2): each pair is a dark message bubble on
 * the right, then its result with a green tick. The list is the section's one moment (docs/STYLE-GUIDE.md §9.4): once
 * it is 35% in view each bubble slides in and its tick draws, pair by pair (`--i`, hl.css). Without JS or with reduced
 * motion the pairs simply show.
 */
export function TalkPairs({ pairs }: { pairs: readonly TalkPair[] }) {
  return (
    <InViewOnce as="ul" className="hl-pairs flex flex-col gap-5.5 md:gap-6.5" threshold={0.35}>
      {pairs.map((pair) => (
        <li key={pair.said} data-pair="" className="flex flex-col gap-2">
          <p className="hl-bubble self-end">{pair.said}</p>
          <p className="flex gap-2 text-chip leading-blurb">
            <CircleTick draw className="mt-0.5 size-4.5 flex-none" />
            <span>{pair.result}</span>
          </p>
        </li>
      ))}
    </InViewOnce>
  );
}
