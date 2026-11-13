import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Drift proof | Huston Tech",
  description: "Proof page that is deliberately missing from src/lib/routes.ts.",
  path: "/drift-proof",
  noindex: true,
});

export default function DriftProofPage() {
  return (
    <Section tone="paper">
      <h1 className="font-display text-4xl">Drift proof</h1>
      <p className="mt-4">This page exists only to prove the route-list check fails.</p>
    </Section>
  );
}
