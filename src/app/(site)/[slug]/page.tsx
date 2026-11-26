import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/blocks/BlockRenderer";
import { JsonLd } from "@/components/ui/JsonLd";
import { personJsonLd } from "@/lib/jsonld";
import { getPage, getPages } from "@/lib/pages";
import { pageMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

// Only the live pages in src/content/pages are built; any other address is the 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getPages()
    .filter((page) => page.path !== "/")
    .map((page) => ({ slug: page.path.slice(1) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(`/${slug}`);
  if (!page) return {};
  return pageMetadata({ title: page.title, description: page.description, path: page.path });
}

/** The structured data a page carries besides its blocks: the Person on /about (the Organization is on Home). */
const jsonLdFor: Record<string, () => Record<string, unknown>> = { "/about": personJsonLd };

/** Every page except the home page: the blocks of its file in src/content/pages. */
export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const page = getPage(`/${slug}`);
  if (!page) notFound();
  const jsonLd = jsonLdFor[page.path];
  // Keyed by path: moving between two pages of this route gives fresh block wrappers, so each page gets its entrance.
  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd()} /> : null}
      <BlockRenderer key={page.path} blocks={page.blocks} />
    </>
  );
}
