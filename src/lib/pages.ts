// The site's pages, read from src/content/pages/*.json and checked with the site check (pages, items, settings). Server only.
// Any problem throws one error that lists every problem, so `next build` fails with plain words instead of a broken page.
import { menuHref } from "@/blocks/schema";
import type { MenuPlace, PageData } from "@/blocks/schema";
import { getSiteContent } from "./site-content";

export type MenuItem = { label: string; href: string };

/** Every page file, live and archived, checked. */
export function getAllPages(): PageData[] {
  return getSiteContent().pages;
}

/** The live pages. */
export function getPages(): PageData[] {
  return getAllPages().filter((page) => page.status === "live");
}

export function getPage(path: string): PageData | undefined {
  return getPages().find((page) => page.path === path);
}

/** The links for one menu place, by order then label. Archived pages never appear. */
export function getMenu(place: MenuPlace): MenuItem[] {
  return getPages()
    .flatMap((page) => (page.menu && page.menu.places.includes(place) ? [{ label: page.menu.label, href: menuHref(page.path, page.menu.anchor), order: page.menu.order }] : []))
    .sort((a, b) => a.order - b.order || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0))
    .map(({ label, href }) => ({ label, href }));
}
