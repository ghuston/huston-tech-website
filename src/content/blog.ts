/** The blog's interface words: the pager, the draft tag, the empty state and the feed link. Post copy lives in the post files. */
export const blog = {
  indexHeading: "Posts",
  pagerLabel: "Blog pages",
  newer: "Newer posts",
  older: "Older posts",
  /** "Page 2 of 4". */
  pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
  draftTag: "Draft: not on your live site",
  backToBlog: "All posts",
  updatedWord: "Updated",
  readPost: "Read the post",
  feedTitle: "Blog posts",
} as const;
