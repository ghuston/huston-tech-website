import { CircleTick } from "./Tick";

type TalkPair = { said: string; result: string };

/**
 * What the owner says and what the system does (docs/website-rev8.md B1 §2): each pair is a dark message bubble on
 * the right, then its result with a green tick. `data-pair` and the tick's `data-tick` are the hooks for the
 * section's in-view moment (docs/STYLE-GUIDE.md §9.4); without it the pairs simply show.
 */
export function TalkPairs({ pairs }: { pairs: readonly TalkPair[] }) {
  return (
    <ul className="flex flex-col gap-[22px] md:gap-[26px]">
      {pairs.map((pair) => (
        <li key={pair.said} data-pair="" className="flex flex-col gap-2">
          <p className="hl-bubble self-end">{pair.said}</p>
          <p className="flex gap-2 text-[16px] leading-[1.4]">
            <CircleTick draw className="mt-0.5 size-[18px] flex-none" />
            <span>{pair.result}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
