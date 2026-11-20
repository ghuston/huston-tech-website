type PictureProps = {
  /** The file path without its extension: `/work/systems-1` serves `systems-1.avif`, falling back to `systems-1.webp`. */
  src: string;
  width: number;
  height: number;
  /** What the image shows, or "" when it is decorative. */
  alt: string;
  className?: string;
};

/**
 * A pre-sized screenshot (docs/STYLE-GUIDE.md §7.34): AVIF with a WebP fallback, explicit size, lazy-loaded. Never
 * used in the first screen. Both files must exist in public/.
 * A plain `picture`, not next/image: unoptimized in the static export, next/image renders one `img` with no AVIF
 * `source`.
 */
export function Picture({ src, width, height, alt, className = "" }: PictureProps) {
  return (
    <picture>
      <source type="image/avif" srcSet={`${src}.avif`} />
      <img src={`${src}.webp`} width={width} height={height} alt={alt} loading="lazy" decoding="async" className={className} />
    </picture>
  );
}
