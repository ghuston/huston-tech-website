// The single list of site routes. The sitemap, the accessibility check (tests/a11y) and Lighthouse CI (lighthouserc.cjs)
// all read it, so a page added as a file in src/content/pages is listed for search engines and scanned by CI.
// Plain Node (type stripping) and Playwright load this file: relative imports with .ts, no aliases, no enums.
import { pickItems } from "../collections/pick.ts";
import type { LoadedItem } from "../collections/schema.ts";
import { extraPageNumbers, indexPath, postPath } from "./blog.ts";
import { readItemFiles } from "./content-files.ts";
import { showDrafts } from "./drafts.ts";
import { readPageFiles } from "./page-files.ts";

type RoutePage = { path: string; status?: unknown; menu?: { order?: unknown; places?: unknown } };

const live = readPageFiles()
  .flatMap(({ data, error }) => (error === undefined && typeof data === "object" && data !== null ? [data as RoutePage] : []))
  .filter((page) => page.status === "live" && typeof page.path === "string");

const orderOf = (page: RoutePage) => (typeof page.menu?.order === "number" ? page.menu.order : Number.MAX_SAFE_INTEGER);
const inMenu = (page: RoutePage, place: string) => {
  const places = page.menu?.places;
  return Array.isArray(places) && places.includes(place);
};

// 0: the home page; 1: header or footer menu pages; 2: pages only in the legal menu; 3: the rest.
const groupOf = (page: RoutePage) => (page.path === "/" ? 0 : inMenu(page, "header") || inMenu(page, "footer") ? 1 : inMenu(page, "legal") ? 2 : 3);

/** Live pages: the home page, then the header and footer menu pages by order, then the legal ones by order, then the rest by path. An archived page is left out. */
export const pageRoutes: string[] = live
  .sort((a, b) => groupOf(a) - groupOf(b) || (groupOf(a) < 3 ? orderOf(a) - orderOf(b) : 0) || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
  .map((page) => page.path);

/**
 * The blog's routes from post slugs, newest first. `live` are the live posts (indexed, in the sitemap); `visible` are the
 * posts this build shows (live, plus drafts outside production). Draft post pages are built but never indexed.
 */
export function blogRoutes(live: readonly string[], visible: readonly string[]): { posts: string[]; indexPages: string[]; draftPosts: string[] } {
  return {
    posts: live.map(postPath),
    indexPages: extraPageNumbers(visible.length).map(indexPath),
    draftPosts: visible.filter((slug) => !live.includes(slug)).map(postPath),
  };
}

const postItems: LoadedItem[] = readItemFiles()
  .flatMap(({ kind, slug, data, error }) =>
    kind === "posts" && error === undefined && typeof data === "object" && data !== null && !Array.isArray(data)
      ? [{ kind, slug, status: (data as { status?: unknown }).status, data } as unknown as LoadedItem]
      : [],
  );
/** The post slugs a build shows, in the order the blog lists them (the same `pickItems` the pages use). */
export const postSlugs = (items: readonly LoadedItem[], drafts: boolean): string[] => pickItems(items, "posts", drafts).map((item) => item.slug);
const blog = blogRoutes(postSlugs(postItems, false), postSlugs(postItems, showDrafts()));

/** Every indexable route: the live pages, the blog's extra index pages and every live post. This is the sitemap. */
export const indexableRoutes: string[] = [...pageRoutes, ...blog.indexPages, ...blog.posts];

/** What CI audits (Lighthouse, the accessibility scan): the pages, plus the newest live post and /blog/page/2 when it exists. One of each kind of page. */
export const auditRoutes: string[] = [...pageRoutes, ...blog.posts.slice(0, 1), ...blog.indexPages.slice(0, 1)];

/** The block showcase: every block and variant with its example content. Built, scanned and audited, never indexed. */
export const showcaseRoute = "/blocks";

/** Real pages that stay out of the sitemap (noindex). `/card` is the NFC business card: a route of its own, outside the page files. */
export const noindexRoutes = ["/contact/thanks", "/card", showcaseRoute, ...blog.draftPosts];
