import Image from "next/image";
import Link from "next/link";
import { Badge, Wordmark } from "@/components/hl/Marks";
import { chrome } from "@/content/chrome";
import { logoImage } from "@/lib/chrome-view";
import { getBrand, getBusiness } from "@/lib/settings";
import { BadgeTurn } from "./BadgeTurn";

const sizes = {
  // docs/STYLE-GUIDE.md §7.1: badge 34 with the wordmark 21 tall (30 and 18 on phones).
  header: { badge: "size-[30px] md:size-[34px]", word: "h-[18px] md:h-[21px]" },
  // §7.26: the footer logo is 28px tall.
  footer: { badge: "size-7", word: "h-[17px]" },
} as const;

/**
 * The badge and wordmark, linking home. The names come from `public/brand`; they are never redrawn. An uploaded logo
 * (brand.json `logo`) replaces them only when the owner sets one; it is null today.
 */
export function Logo({ size = "header" }: { size?: keyof typeof sizes }) {
  const image = logoImage(getBrand().logo, size);
  return (
    <Link href="/" aria-label={chrome.logoHomeLabel(image ? image.alt : getBusiness().name)} className="inline-flex min-h-11 items-center gap-[10px] rounded-btn text-ink">
      {image ? (
        <Image src={image.src} alt="" width={image.width} height={image.height} unoptimized />
      ) : size === "header" ? (
        <BadgeTurn>
          <Badge className={`hl-turn-face ${sizes[size].badge}`} />
          <Badge className={`hl-turn-face hl-turn-back ${sizes[size].badge}`} />
        </BadgeTurn>
      ) : (
        <Badge className={sizes[size].badge} />
      )}
      {image ? null : <Wordmark className={sizes[size].word} />}
    </Link>
  );
}
