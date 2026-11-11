import type { ElementType, ReactNode } from "react";
import { InViewOnce } from "./InViewOnce";

type Effect = "rise" | "stagger" | "settle";

const effectClass: Record<Effect, string> = {
  rise: "rise",
  stagger: "rise-stagger",
  settle: "settle-group",
};

type RevealProps = {
  as?: ElementType;
  className?: string;
  id?: string;
  /** `rise` glides the wrapper. `stagger` glides each child. `settle` tilts each child into place. */
  effect?: Effect;
  children: ReactNode;
};

/** Scroll-triggered glide. Plays once; the resting layout is the finished state. */
export function Reveal({ as, className = "", id, effect = "rise", children }: RevealProps) {
  return (
    <InViewOnce as={as} id={id} className={`${effectClass[effect]} ${className}`}>
      {children}
    </InViewOnce>
  );
}

/** Pale yellow hand-drawn highlight. The words stay readable; only the stroke draws in. */
export function Mark({ children }: { children: ReactNode }) {
  return (
    <InViewOnce as="span" className="marker-sweep draw-on-view">
      {children}
    </InViewOnce>
  );
}

/**
 * Highlights the first exact occurrence of `phrase` in `text`. The marked words are sliced from `text`, so the
 * rendered copy stays the content string. If the phrase is no longer there, the whole string renders unmarked.
 */
export function MarkedText({ text, phrase }: { text: string; phrase: string }) {
  const at = text.indexOf(phrase);
  if (at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <Mark>{text.slice(at, at + phrase.length)}</Mark>
      {text.slice(at + phrase.length)}
    </>
  );
}

type UnderlineProps = {
  as?: ElementType;
  className?: string;
  id?: string;
  /** Also glide the heading in as the stroke draws. */
  rise?: boolean;
  children: ReactNode;
};

/** Rust underline that draws once when the element enters view, then stays. */
export function Underline({ as, className = "", id, rise = false, children }: UnderlineProps) {
  return (
    <InViewOnce as={as} id={id} className={`ink-underline draw-on-view ${rise ? "rise" : ""} ${className}`}>
      {children}
    </InViewOnce>
  );
}

/** One full-width rust stroke. Decorative; the caller reserves its place in the layout. */
export function InkRule({ className = "" }: { className?: string }) {
  return <InViewOnce aria-hidden className={`ink-rule draw-on-view ${className}`} />;
}
