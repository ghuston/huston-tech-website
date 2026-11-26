import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/blocks/BlockRenderer";
import { getPage, getPages } from "@/lib/pages";
import { pageMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

// Only the live pages in src/content/pages are built; any other address is the 404.
export const dynamicParams = false;

/** True while a page still has its own route folder (src/app/(site)/<slug>/page.tsx): that route wins, so [slug] must not build it too. */
const hasOwnRoute = (slug: string) => existsSync(join(process.cwd(), "src/app/(site)", slug, "page.tsx"));

export function generateStaticParams() {
  return getPages()
    .filter((page) => page.path !== "/")
    .map((page) => ({ slug: page.path.slice(1) }))
    .filter(({ slug }) => !hasOwnRoute(slug));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(`/${slug}`);
  if (!page) return {};
  return pageMetadata({ title: page.title, description: page.description, path: page.path });
}

/** Every page except the home page: the blocks of its file in src/content/pages. */
export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const page = getPage(`/${slug}`);
  if (!page) notFound();
  // Keyed by path: moving between two pages of this route gives fresh block wrappers, so each page gets its entrance.
  return <BlockRenderer key={page.path} blocks={page.blocks} />;
}
