import { blog } from "@/content/blog";
import { indexPath } from "@/lib/blog";
import { HlLink } from "./HlLink";

const linkClass = "inline-flex min-h-11 items-center font-ui font-medium text-green";

/** Links between the blog's index pages: plain links, no script. "Newer posts" and "Older posts" appear only where there is a page to go to. */
export function Pager({ page, total }: { page: number; total: number }) {
  if (total <= 1) return null;
  return (
    <nav aria-label={blog.pagerLabel} className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6">
      <div className="min-w-32">
        {page > 1 ? (
          <HlLink href={indexPath(page - 1)} className={linkClass}>
            <span className="hl-u">{blog.newer}</span>
          </HlLink>
        ) : null}
      </div>
      <p aria-current="page" className="font-ui text-small font-medium text-ink-2">{blog.pageOf(page, total)}</p>
      <div className="flex min-w-32 justify-end">
        {page < total ? (
          <HlLink href={indexPath(page + 1)} className={linkClass}>
            <span className="hl-u">{blog.older}</span>
          </HlLink>
        ) : null}
      </div>
    </nav>
  );
}
