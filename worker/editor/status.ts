import type { EditorConfig } from "../config.ts";
import type { GitHub, Pull } from "./github.ts";
import type { AssetsLike } from "./types.ts";
import type { ChangeState, ChangeView } from "./views.ts";
import { AGENCY_NAME } from "./words.ts";

/** Where an editor change stands: checking, stuck, going live, live or stopped. Never says live without proof. */

export const BRANCH_PREFIX = "change/owner-";
const FAILED = ["failure", "timed_out", "cancelled", "action_required"];
const SLOW_MINUTES = 30;
/** A live time is only a measurement when the first look came this soon after the merge. */
const MEASURED_MINUTES = 60;
/** An open change that shows no check at all after this long has no required checks to wait for. */
const NO_CHECKS_MINUTES = 30;
export const NO_CHECKS = "required checks missing";

export type { ChangeState };
export type ChangeStatus = ChangeView;

export const isEditorPull = (pull: Pull, config: EditorConfig): boolean => {
  const bot = config.github.botLogin;
  return pull.headRef.startsWith(BRANCH_PREFIX) && bot !== null && pull.author.toLowerCase() === bot.toLowerCase();
};

/** The editor's own pull requests, newest first: every open one, or the newest 100 of any state. */
export async function editorPulls(github: GitHub, config: EditorConfig, state: "open" | "all"): Promise<Pull[]> {
  return (await github.listPulls(state)).filter((pull) => isEditorPull(pull, config)).sort((a, b) => b.number - a.number);
}

export const changeTitle = (pull: Pull): string => pull.title.replace(/^change: /, "");

/** The deployed site's commit, read once per call through the ASSETS binding; null when it cannot be read or is not named. */
export function deployedReader(assets: AssetsLike, siteUrl: string): () => Promise<string | null> {
  let cached: Promise<string | null> | undefined;
  const read = async (): Promise<string | null> => {
    try {
      const response = await assets.fetch(new Request(`${siteUrl}/site-version.json`));
      if (!response.ok) return null;
      const data: unknown = await response.json();
      const commit = typeof data === "object" && data !== null && "commit" in data ? data.commit : null;
      return typeof commit === "string" && commit !== "" ? commit : null;
    } catch {
      return null;
    }
  };
  return () => (cached ??= read());
}

const minutesBetween = (from: string, to: string): number => Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 60_000));
const utcTime = (iso: string): string => `${iso.slice(0, 16).replace("T", " ")} UTC`;
const SLOW_NOTE = ` This is taking longer than usual. ${AGENCY_NAME} can see it.`;

export function statusLine(status: ChangeStatus): string {
  const n = status.change;
  switch (status.state) {
    case "checking":
      return `Change ${n} is being checked. It is not live yet.`;
    case "stuck":
      return `Change ${n} is stuck: a check found a problem (${(status.failedChecks ?? []).join(", ")}). It is not live. ${AGENCY_NAME} can see it on the site's repo; you can withdraw it with undo.`;
    case "going live":
      return `Change ${n} passed its checks and is being published. ${status.unconfirmed ? "I can't confirm it is live yet." : "It is not live yet."}${status.slow ? SLOW_NOTE : ""}`;
    case "live":
      return status.minutesToLive !== undefined
        ? `Change ${n} is live. It went live ${status.minutesToLive} minutes after it was published.`
        : `Change ${n} is live (confirmed ${utcTime(status.liveAt ?? "")}).`;
    case "stopped":
      return `Change ${n} was stopped before it went live. Nothing changed on the site.`;
    case "unknown":
      return `Change ${n}: Status unavailable right now.`;
  }
}

export interface StatusReaderDeps {
  config: EditorConfig;
  github: GitHub;
  kv: KVNamespace;
  now: () => Date;
}

export function createStatusReader({ config, github, kv, now }: StatusReaderDeps) {
  const ignored = (name: string): boolean => config.ignoredChecks.some((entry) => name === entry || name.startsWith(`${entry}:`) || name.startsWith(`${entry} `));

  async function read(pull: Pull, deployed: () => Promise<string | null>): Promise<ChangeStatus> {
    const base = { change: pull.number, title: changeTitle(pull), publishedAt: pull.createdAt };
    if (pull.state === "open") {
      const runs = (await github.checkRuns(pull.headSha)).filter((run) => !ignored(run.name));
      const failed = runs.filter((run) => run.status === "completed" && run.conclusion !== null && FAILED.includes(run.conclusion)).map((run) => run.name);
      if (failed.length > 0) return { ...base, state: "stuck", failedChecks: failed };
      if (runs.length === 0 && minutesBetween(pull.createdAt, now().toISOString()) > NO_CHECKS_MINUTES) return { ...base, state: "stuck", failedChecks: [NO_CHECKS] };
      return { ...base, state: "checking" };
    }
    if (!pull.merged) return { ...base, state: "stopped" };

    const mergedAt = pull.mergedAt ?? pull.closedAt ?? pull.createdAt;
    const live = (liveAt: string): ChangeStatus => ({
      ...base,
      state: "live",
      liveAt,
      ...(minutesBetween(mergedAt, liveAt) <= MEASURED_MINUTES ? { minutesToLive: minutesBetween(pull.createdAt, liveAt) } : {}),
    });
    const stored = await kv.get(`live:${pull.number}`, "text");
    if (typeof stored === "string") return live(stored);

    const slow = minutesBetween(mergedAt, now().toISOString()) > SLOW_MINUTES;
    const commit = await deployed();
    if (commit === null || pull.mergeCommitSha === null) return { ...base, state: "going live", unconfirmed: true, ...(slow ? { slow } : {}) };
    const relation = await github.compare(pull.mergeCommitSha, commit);
    if (relation !== "identical" && relation !== "ahead") return { ...base, state: "going live", ...(slow ? { slow } : {}) };
    const liveAt = now().toISOString();
    await kv.put(`live:${pull.number}`, liveAt);
    return live(liveAt);
  }

  return { read };
}
