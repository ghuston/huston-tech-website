"use client";

import { useSearchParams } from "next/navigation";

type Props = { defaultText: string; partnerText: string; className?: string };

/** Shows the partner variant when the page is opened with ?topic=partner (a static page cannot read the query at build time). */
export function PartnerAwareHeading({ defaultText, partnerText, className }: Props) {
  const topic = useSearchParams().get("topic");
  return (
    <h2 className={className}>{topic === "partner" ? partnerText : defaultText}</h2>
  );
}
