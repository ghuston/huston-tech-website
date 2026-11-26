import type { CheckRun, CommitFile, GitHub, Pull, TreeEntry } from "./github.ts";
import { GitHubError } from "./github.ts";

/** In-memory GitHub for the editor's tests. Commits are maps of path -> content; nothing touches the network. */

interface Commit {
  files: Record<string, string>;
  parent: string | null;
  message: string;
}
interface PullRecord {
  pull: Pull;
  baseCommit: string;
  autoMerge: boolean;
}
export interface FakeIssue {
  number: number;
  url: string;
  title: string;
  body: string;
  labels: string[];
}

const BYTES_PREFIX = "bytes:base64:";

/** A binary file is kept as text with this prefix, so the fake's commits stay maps of path to string. */
const encodeBytes = (bytes: Uint8Array): string => BYTES_PREFIX + Buffer.from(bytes).toString("base64");

/** A small stable string hash (cyrb53); not git-compatible, only needs to change when its input changes. */
function hash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}

export class FakeGitHub implements GitHub {
  /** When true, enableAutoMerge answers "clean", as GitHub does for an already-mergeable pull request. */
  autoMergeClean = false;
  /** When true, enableAutoMerge answers "not_allowed", as GitHub does when the repository has auto-merge off. */
  autoMergeNotAllowed = false;
  /** The login pull requests are opened as. */
  botLogin = "editor-bot[bot]";
  private clockSource: (() => number) | null = null;
  readonly issues: FakeIssue[] = [];
  private readonly commits = new Map<string, Commit>();
  private readonly branches = new Map<string, string>();
  private readonly records: PullRecord[] = [];
  private readonly checks = new Map<string, CheckRun[]>();
  private commitCount = 0;
  private clock = Date.parse("2026-01-01T00:00:00.000Z");

  constructor(files: Record<string, string>) {
    this.branches.set("main", this.addCommit({ ...files }, null, "initial"));
  }

  get pulls(): readonly Pull[] {
    return this.records.map((record) => this.view(record));
  }

  /** Makes every timestamp the fake writes follow the given clock (the tests' movable one). */
  useClock(source: () => number): void {
    this.clockSource = source;
  }

  setChecks(sha: string, runs: CheckRun[]): void {
    this.checks.set(sha, runs);
  }

  /** Simulates a squash merge onto main: one new commit carrying what the pull request changed. */
  merge(number: number): void {
    const record = this.record(number);
    const base = this.commitFiles(record.baseCommit);
    const head = this.commitFiles(this.headSha(record));
    const next = { ...this.commitFiles(this.mainSha()) };
    for (const [path, content] of Object.entries(head)) if (base[path] !== content) next[path] = content;
    const sha = this.addCommit(next, this.mainSha(), `squash #${number}`);
    this.branches.set("main", sha);
    record.pull = { ...record.pull, state: "closed", merged: true, headSha: this.headSha(record), mergedAt: this.tick(), closedAt: this.tick(), mergeCommitSha: sha };
  }

  /** True once auto-merge was switched on for the pull request. */
  autoMergeOn(number: number): boolean {
    return this.record(number).autoMerge;
  }

  close(number: number): void {
    const record = this.record(number);
    record.pull = { ...record.pull, state: "closed", closedAt: this.tick() };
  }

  /** The files on a branch name or a commit sha. */
  filesOn(branchOrCommit: string): Record<string, string> {
    return { ...this.commitFiles(this.resolve(branchOrCommit)) };
  }

  async headOfMain() {
    const commit = this.mainSha();
    return { commit, tree: `tree:${commit}` };
  }

  async tree(treeSha: string): Promise<TreeEntry[]> {
    const files = this.commitFiles(treeSha.replace(/^tree:/, ""));
    const folders = new Map<string, string[]>();
    const entries: TreeEntry[] = [];
    for (const [path, content] of Object.entries(files)) {
      entries.push({ path, sha: hash(content), type: "blob" });
      const parts = path.split("/");
      for (let i = 1; i < parts.length; i++) {
        const folder = parts.slice(0, i).join("/");
        folders.set(folder, [...(folders.get(folder) ?? []), `${path}\0${content}`]);
      }
    }
    for (const [path, pairs] of folders) entries.push({ path, sha: hash(pairs.sort().join("\n")), type: "tree" });
    return entries;
  }

  async fileAt(commit: string, path: string) {
    return this.commitFiles(this.resolve(commit))[path] ?? null;
  }

  /** The bytes of a binary file committed through createCommit, or null when the path holds text or nothing. */
  bytesOn(branchOrCommit: string, path: string): Uint8Array | null {
    const text = this.commitFiles(this.resolve(branchOrCommit))[path];
    return text?.startsWith(BYTES_PREFIX) ? new Uint8Array(Buffer.from(text.slice(BYTES_PREFIX.length), "base64")) : null;
  }

  async createCommit({ baseCommit, files, message }: { baseCommit: string; files: CommitFile[]; message: string }) {
    const next = { ...this.commitFiles(this.resolve(baseCommit)) };
    for (const file of files) next[file.path] = "bytes" in file ? encodeBytes(file.bytes) : file.content;
    return this.addCommit(next, this.resolve(baseCommit), message);
  }

  async setBranch(name: string, sha: string) {
    this.commitFiles(sha);
    this.branches.set(name, sha);
  }

  async deleteBranch(name: string) {
    this.branches.delete(name);
  }

  async branchHead(name: string) {
    return this.branches.get(name) ?? null;
  }

  async listBranches(prefix: string) {
    return [...this.branches].filter(([name]) => name.startsWith(prefix)).map(([name, sha]) => ({ name, sha }));
  }

  async openPull({ head, title, body }: { head: string; title: string; body: string }) {
    const sha = this.branches.get(head);
    if (!sha) throw new GitHubError(422, "open pull request");
    const number = this.records.length + 1;
    const pull: Pull = {
      number,
      nodeId: `PR_node_${number}`,
      title,
      state: "open",
      merged: false,
      mergedAt: null,
      createdAt: this.tick(),
      closedAt: null,
      headRef: head,
      headSha: sha,
      mergeCommitSha: null,
      author: this.botLogin,
      body,
      url: `https://github.com/fake/fake/pull/${number}`,
    };
    this.records.push({ pull, baseCommit: this.mainSha(), autoMerge: false });
    return this.view(this.record(number));
  }

  async enableAutoMerge(nodeId: string) {
    const record = this.records.find((r) => r.pull.nodeId === nodeId);
    if (!record) throw new GitHubError(404, "enable auto-merge");
    if (this.autoMergeNotAllowed) return "not_allowed" as const;
    if (this.autoMergeClean) return "clean" as const;
    record.autoMerge = true;
    return "queued" as const;
  }

  async closePull(number: number) {
    this.close(number);
  }

  async getPull(number: number) {
    const record = this.records.find((r) => r.pull.number === number);
    return record ? this.view(record) : null;
  }

  async listPulls(state: "open" | "all") {
    return this.records
      .filter((r) => state === "all" || r.pull.state === "open")
      .map((r) => this.view(r))
      .reverse()
      .slice(0, state === "open" ? 300 : 100);
  }

  async pullFiles(number: number) {
    const record = this.record(number);
    const base = this.commitFiles(record.baseCommit);
    const head = this.commitFiles(this.headSha(record));
    return Object.entries(head)
      .filter(([path, content]) => base[path] !== content)
      .map(([path]) => ({ path, status: path in base ? "modified" : "added" }));
  }

  async checkRuns(sha: string) {
    return [...(this.checks.get(sha) ?? [])];
  }

  async compare(base: string, head: string) {
    const baseSha = this.resolve(base);
    const headSha = this.resolve(head);
    if (baseSha === headSha) return "identical" as const;
    if (this.ancestors(headSha).includes(baseSha)) return "ahead" as const;
    if (this.ancestors(baseSha).includes(headSha)) return "behind" as const;
    return "diverged" as const;
  }

  async commitParent(sha: string) {
    const parent = this.commits.get(this.resolve(sha))?.parent;
    if (!parent) throw new GitHubError(404, "read commit parent");
    return parent;
  }

  async openIssue({ title, body, labels }: { title: string; body: string; labels: string[] }) {
    const number = this.issues.length + 1;
    const url = `https://github.com/fake/fake/issues/${number}`;
    this.issues.push({ number, url, title, body, labels });
    return { number, url };
  }

  private addCommit(files: Record<string, string>, parent: string | null, message: string): string {
    const sha = `c${++this.commitCount}-${hash(message + JSON.stringify(files)).slice(0, 8)}`;
    this.commits.set(sha, { files, parent, message });
    return sha;
  }

  private mainSha(): string {
    const sha = this.branches.get("main");
    if (!sha) throw new GitHubError(404, "read branch");
    return sha;
  }

  private resolve(branchOrCommit: string): string {
    return this.branches.get(branchOrCommit) ?? branchOrCommit;
  }

  private commitFiles(sha: string): Record<string, string> {
    const commit = this.commits.get(sha);
    if (!commit) throw new GitHubError(404, "read commit");
    return commit.files;
  }

  private ancestors(sha: string): string[] {
    const chain: string[] = [];
    for (let next = this.commits.get(sha)?.parent ?? null; next; next = this.commits.get(next)?.parent ?? null) chain.push(next);
    return chain;
  }

  private record(number: number): PullRecord {
    const record = this.records.find((r) => r.pull.number === number);
    if (!record) throw new GitHubError(404, "read pull request");
    return record;
  }

  private headSha(record: PullRecord): string {
    return this.branches.get(record.pull.headRef) ?? record.pull.headSha;
  }

  /** A merged pull request keeps the head it had when it merged. */
  private view(record: PullRecord): Pull {
    return record.pull.merged ? { ...record.pull } : { ...record.pull, headSha: this.headSha(record) };
  }

  private tick(): string {
    if (this.clockSource) return new Date(this.clockSource()).toISOString();
    this.clock += 60_000;
    return new Date(this.clock).toISOString();
  }
}
