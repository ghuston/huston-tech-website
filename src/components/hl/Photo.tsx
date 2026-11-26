import Image from "next/image";
import type { ImageFocus, ImageShape } from "@/blocks/schema";

// One lookup per axis, written out in full so Tailwind sees every class.
const ASPECT: Record<ImageShape, string> = {
  "3:2": "aspect-photo-3-2",
  "4:3": "aspect-photo-4-3",
  "4:5": "aspect-photo-4-5",
  "1:1": "aspect-square",
  "16:9": "aspect-video",
};

const FOCUS: Record<ImageFocus, string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
};

type PhotoProps = {
  image: { src: string; alt: string; focus?: ImageFocus };
  shape: ImageShape;
  /** The `sizes` attribute: how wide the photo is at each screen width. */
  sizes: string;
  className?: string;
  /** True for a photo that is the page's largest first-screen element (a post's lead photo): it loads at once, first. */
  lead?: boolean;
};

/** A photo cropped to its slot's shape (never stretched). The box holds its space before the file arrives, so nothing shifts. */
export function Photo({ image, shape, sizes, className = "", lead = false }: PhotoProps) {
  return (
    <div className={`relative w-full overflow-hidden rounded-card bg-tint ${ASPECT[shape]} ${className}`}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        className={`object-cover ${FOCUS[image.focus ?? "center"]}`}
        preload={lead}
      />
    </div>
  );
}
