type TwoVoiceProps = {
  line1: string;
  line2: string;
  /** The heading level. The Home H1 is drawn in Hero.tsx; this serves the two-voice H2s. */
  as?: "h2" | "h3";
  id?: string;
  className?: string;
};

/**
 * The two-voice heading (docs/STYLE-GUIDE.md §3): line 1 in Outfit 700, line 2 in Newsreader italic in rust, on its own
 * line directly under it. It appears on exactly four headings. Never put rust on a whole heading or italicize one word.
 */
export function TwoVoice({ line1, line2, as: Tag = "h2", id, className = "" }: TwoVoiceProps) {
  return (
    <Tag id={id} className={`max-w-[17em] font-ui text-h2-two font-bold ${className}`}>
      <span className="block">{line1}</span>{" "}
      <span className="block font-voice text-[1.07em] font-normal italic leading-[1.1] tracking-[-0.02em] text-rust">{line2}</span>
    </Tag>
  );
}
