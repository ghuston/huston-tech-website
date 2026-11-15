import Link from "next/link";
import { Badge, Wordmark } from "@/components/hl/Marks";
import { siteConfig } from "@/content/site";
import { BadgeTurn } from "./BadgeTurn";

const sizes = {
  // docs/STYLE-GUIDE.md §7.1: badge 34 with the wordmark 21 tall (30 and 18 on phones).
  header: { badge: "size-[30px] md:size-[34px]", word: "h-[18px] md:h-[21px]" },
  // §7.26: the footer logo is 28px tall.
  footer: { badge: "size-7", word: "h-[17px]" },
} as const;

/** The badge and wordmark, linking home. The names come from `public/brand`; they are never redrawn. */
export function Logo({ size = "header" }: { size?: keyof typeof sizes }) {
  return (
    <Link href="/" aria-label={`${siteConfig.name}, home`} className="inline-flex min-h-11 items-center gap-[10px] rounded-btn text-ink">
      {size === "header" ? (
        <BadgeTurn>
          <Badge className={`hl-turn-face ${sizes[size].badge}`} />
          <Badge className={`hl-turn-face hl-turn-back ${sizes[size].badge}`} />
        </BadgeTurn>
      ) : (
        <Badge className={sizes[size].badge} />
      )}
      <Wordmark className={sizes[size].word} />
    </Link>
  );
}
