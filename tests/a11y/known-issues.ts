// Known accessibility findings that are allowed to pass. Keep this EMPTY unless there is a written reason.
// Each entry silences ONE axe rule on ONE selector (never a whole element, never a whole rule site-wide).
// Never add an entry just to get CI green: fix the site, or record why axe is wrong here.
// The test fails if an entry no longer matches anything, so stale entries get deleted.

export type KnownIssue = {
  /** axe rule id, for example "color-contrast". */
  rule: string;
  /** CSS selector of the node axe reports (as shown in the Playwright report). */
  selector: string;
  /** What is flagged and why it is a false positive or an accepted, tracked issue. Link the PR or issue. */
  reason: string;
  /** Date added, YYYY-MM-DD. */
  since: string;
};

export const KNOWN_ISSUES: KnownIssue[] = [];
