/** What the owner page and the tools say about proposals and changes. Import-free, so the owner page stays loadable on its own. */

/** A change waiting for the owner's yes. */
export interface ProposalView {
  id: string;
  summary: string;
  createdAt: string;
  changeList: string;
  previewLink: string | null;
  /** The uploads this proposal puts on the site. */
  uploads: { id: string; name: string; kind: "photo" | "pdf" }[];
}

export type ChangeState = "checking" | "stuck" | "going live" | "live" | "stopped" | "unknown";

/** One published change and where it stands. */
export interface ChangeView {
  change: number;
  state: ChangeState;
  title: string;
  publishedAt: string;
  liveAt?: string;
  /** Minutes from publishing to going live; only set when the first sighting was close to the merge. */
  minutesToLive?: number;
  failedChecks?: string[];
  /** True when the site does not report which commit it runs, so "live" cannot be confirmed. */
  unconfirmed?: boolean;
  /** True when a merged change has not shown up live for longer than expected. */
  slow?: boolean;
}

/** One upload as the tools and the owner page list it. */
export interface UploadView {
  id: string;
  name: string;
  kind: "photo" | "pdf";
  bytes: number;
  width?: number;
  height?: number;
  pages?: number;
  uploadedAt: string;
  expiresAt: string;
  onSite: boolean;
}
