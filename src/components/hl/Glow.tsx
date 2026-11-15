type GlowProps = {
  variant: "green" | "white" | "seam";
  /** Absolute offsets for this seam, for example "right-[-260px] top-[-120px]". One glow per seam (§2). */
  className?: string;
};

/** A soft radial glow that blends two sections or sits behind the hero stack (§2). Decorative; no blur filter. */
export function Glow({ variant, className = "" }: GlowProps) {
  return <div aria-hidden="true" className={`hl-glow hl-glow-${variant} ${className}`} />;
}
