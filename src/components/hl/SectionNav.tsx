"use client";

import { useEffect, useState } from "react";

type SectionNavProps = {
  label: string;
  items: readonly { label: string; href: string }[];
  /** The Services sub-nav sticks under the header (§7.28); the Past Work section nav does not (§7.30). */
  sticky?: boolean;
};

/**
 * In-page section links. An IntersectionObserver keeps the current section's underline drawn (`aria-current`);
 * without JS no link is marked and every link still jumps to its section. Native scrolling is never touched.
 */
export function SectionNav({ label, items, sticky = false }: SectionNavProps) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0 || typeof IntersectionObserver === "undefined") return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = targets.find((el) => visible.has(el.id));
        if (first) setCurrent(first.id);
      },
      { rootMargin: "-150px 0px -55% 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  const position = sticky ? "sticky top-[60px] z-30 bg-silver/[.97] md:top-[72px]" : "";

  return (
    <nav aria-label={label} className={`hl-secnav ${position}`}>
      <div className="mx-auto w-full max-w-[1320px] px-5 md:px-10">
        <ul className="-mx-5 flex gap-7 overflow-x-auto px-5 md:mx-0 md:px-0">
          {items.map((item) => (
            <li key={item.href} className="shrink-0">
              <a
                href={item.href}
                aria-current={current === item.href.slice(1) ? "location" : undefined}
                className="inline-flex min-h-11 items-center whitespace-nowrap font-ui text-[16px] font-medium"
              >
                <span className="hl-u">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
