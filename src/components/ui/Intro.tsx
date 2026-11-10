import type { ElementType, ReactNode } from "react";

type Props = {
  as?: ElementType;
  /** Starts the intro after `--delay-hero-line`, for the second line of a two-line headline. */
  second?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Headline intro: a CSS-only fade with an 8px rise (see motion.css). The text is in the initial HTML and the
 * animation needs no JS, so a headline can never stay hidden or offset.
 */
export function Intro({ as: Tag = "span", second = false, className = "", children }: Props) {
  return <Tag className={`intro ${second ? "intro-second" : ""} ${className}`}>{children}</Tag>;
}
