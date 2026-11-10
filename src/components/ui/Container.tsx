import type { ElementType, ReactNode } from "react";

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Narrow reading column (about 720px) instead of the full site width. */
  prose?: boolean;
};

export function Container({ as: Tag = "div", children, className = "", prose = false }: Props) {
  return (
    <Tag className={`mx-auto w-full px-5 sm:px-8 ${prose ? "max-w-[calc(var(--container-prose)+4rem)]" : "max-w-[calc(var(--container-site)+4rem)]"} ${className}`}>
      {children}
    </Tag>
  );
}
