import { log, retryable, TIMEOUT_MS } from "../env.ts";
import { isObject, str, type Json } from "./json.ts";

/**
 * The owner chat tools' GitHub client. It signs in as the site's own GitHub App (an RS256 JWT made with Web Crypto,
 * exchanged for a 1-hour installation token limited to this one repository) and makes the few REST and GraphQL calls
 * the editor needs. No library. Errors never carry the token, the key, the URL or the response body.
 */

export type PullState = "open" | "closed";
export interface Pull {
  number: number;
  nodeId: string;
  title: string;
  state: PullState;
  merged: boolean;
  mergedAt: string | null;
  createdAt: string;
  closedAt: string | null;
  headRef: string;
  headSha: string;
  mergeCommitSha: string | null;
  author: string;
  body: string;
  url: string;
}
export interface TreeEntry {
  path: string;
  sha: string;
  type: "blob" | "tree";
}
export interface CheckRun {
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: string | null;
}

/** A file in a commit: text, or raw bytes (sent as a base64 blob first). */
export type CommitFile = { path: string; content: string } | { path: string; bytes: Uint8Array };

export interface GitHub {
  headOfMain(): Promise<{ commit: string; tree: string }>;
  tree(treeSha: string): Promise<TreeEntry[]>;
  fileAt(commit: string, path: string): Promise<string | null>;
  createCommit(input: { baseCommit: string; files: CommitFile[]; message: string }): Promise<string>;
  setBranch(name: string, sha: string): Promise<void>;
  deleteBranch(name: string): Promise<void>;
  /** The commit a branch points at, or null when there is no such branch. */
  branchHead(name: string): Promise<string | null>;
  /** Branches whose names start with the prefix. */
  listBranches(prefix: string): Promise<{ name: string; sha: string }[]>;
  openPull(input: { head: string; title: string; body: string }): Promise<Pull>;
  /** "clean": no required check is waiting, so GitHub would not queue it. "not_allowed": the repository has auto-merge switched off. */
  enableAutoMerge(nodeId: string): Promise<"queued" | "clean" | "not_allowed">;
  closePull(number: number): Promise<void>;
  getPull(number: number): Promise<Pull | null>;
  /** "open": every open pull request (up to 300). "all": the newest 100 of any state. */
  listPulls(state: "open" | "all"): Promise<Pull[]>;
  pullFiles(number: number): Promise<{ path: string; status: string }[]>;
  checkRuns(sha: string): Promise<CheckRun[]>;
  compare(base: string, head: string): Promise<"identical" | "ahead" | "behind" | "diverged">;
  commitParent(sha: string): Promise<string>;
  openIssue(input: { title: string; body: string; labels: string[] }): Promise<{ number: number; url: string }>;
}

export class GitHubError extends Error {
  readonly status: number;
  readonly operation: string;
  constructor(status: number, operation: string) {
    super(`GitHub ${operation} failed (${status})`);
    this.name = "GitHubError";
    this.status = status;
    this.operation = operation;
  }
}

export interface GitHubOptions {
  appId: string;
  installationId: string;
  owner: string;
  repo: string;
  branch?: string;
  privateKeyPem: string;
  userAgent: string;
  fetch?: typeof fetch;
  now?: () => number;
}

const API = "https://api.github.com";
const PERMISSIONS = { contents: "write", pull_requests: "write", issues: "write", checks: "read", metadata: "read" };
const OPEN_PAGES = 3;
const TOKEN_MARGIN_MS = 5 * 60 * 1000;

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlJson(value: object): string {
  return base64url(new TextEncoder().encode(JSON.stringify(value)));
}

function derLength(length: number): number[] {
  if (length < 128) return [length];
  if (length < 256) return [0x81, length];
  return [0x82, length >> 8, length & 0xff];
}

/** Wraps a PKCS#1 RSAPrivateKey (what GitHub gives out) in the PKCS#8 envelope Web Crypto imports. */
function pkcs1ToPkcs8(pkcs1: Uint8Array): Uint8Array {
  const algorithm = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  const octets = [0x04, ...derLength(pkcs1.length)];
  const inner = [0x02, 0x01, 0x00, ...algorithm, ...octets];
  const total = inner.length + pkcs1.length;
  return Uint8Array.from([0x30, ...derLength(total), ...inner, ...pkcs1]);
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const isPkcs1 = pem.includes("BEGIN RSA PRIVATE KEY");
  const body = pem.replace(/-----(BEGIN|END)( RSA)? PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", isPkcs1 ? pkcs1ToPkcs8(der) : der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

/** The App JWT: GitHub allows at most 10 minutes; iat is set back a minute for clock drift. */
export async function signAppJwt(appId: string, privateKeyPem: string, nowMs: number): Promise<string> {
  const seconds = Math.floor(nowMs / 1000);
  const header = base64urlJson({ alg: "RS256", typ: "JWT" });
  const claims = base64urlJson({ iat: seconds - 60, exp: seconds + 540, iss: appId });
  const key = await importPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  return `${header}.${claims}.${base64url(new Uint8Array(signature))}`;
}

function asJson(value: unknown): Json {
  return isObject(value) ? value : {};
}
const strOrNull = (value: unknown): string | null => (typeof value === "string" ? value : null);

function mapPull(raw: unknown): Pull {
  const pull = asJson(raw);
  const head = asJson(pull.head);
  const mergedAt = strOrNull(pull.merged_at);
  const merged = pull.merged === true || mergedAt !== null;
  return {
    number: typeof pull.number === "number" ? pull.number : 0,
    nodeId: str(pull.node_id),
    title: str(pull.title),
    state: pull.state === "closed" ? "closed" : "open",
    merged,
    mergedAt,
    createdAt: str(pull.created_at),
    closedAt: strOrNull(pull.closed_at),
    headRef: str(head.ref),
    headSha: str(head.sha),
    // For an open PR GitHub fills this with a temporary test-merge commit; only a merged PR has a real one.
    mergeCommitSha: merged ? strOrNull(pull.merge_commit_sha) : null,
    author: str(asJson(pull.user).login),
    body: str(pull.body),
    url: str(pull.html_url),
  };
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function decodeBase64Utf8(content: string): string {
  const binary = atob(content.replace(/\s+/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

/** Base64 of bytes, built in chunks so a large file never spreads into one huge argument list. */
export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

const AUTO_MERGE_MUTATION =
  "mutation($pullRequestId: ID!) { enablePullRequestAutoMerge(input: { pullRequestId: $pullRequestId, mergeMethod: SQUASH }) { pullRequest { number } } }";

export function createGitHub(opts: GitHubOptions): GitHub {
  const doFetch = opts.fetch ?? fetch;
  const now = opts.now ?? Date.now;
  const main = opts.branch ?? "main";
  const repoPath = `/repos/${encodeURIComponent(opts.owner)}/${encodeURIComponent(opts.repo)}`;
  let cached: { value: string; expiresAt: number } | null = null;

  function headers(bearer: string): Record<string, string> {
    return {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": opts.userAgent,
      authorization: `Bearer ${bearer}`,
    };
  }

  async function raw(operation: string, url: string, init: RequestInit): Promise<Response> {
    let last = 0;
    // Only reads (and the token exchange) are safe to send twice; a repeated write could open a second pull request.
    const attempts = (init.method ?? "GET") === "GET" || operation === "installation token" ? 2 : 1;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const response = await doFetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (!retryable(response.status) || attempt === attempts) return response;
        last = response.status;
      } catch {
        last = 0;
        if (attempt === attempts) break;
      }
    }
    log("github_error", { operation, status: last });
    throw new GitHubError(last, operation);
  }

  async function installationToken(): Promise<string> {
    if (cached && cached.expiresAt - TOKEN_MARGIN_MS > now()) return cached.value;
    let jwt: string;
    try {
      jwt = await signAppJwt(opts.appId, opts.privateKeyPem, now());
    } catch {
      log("github_error", { operation: "app key", status: 0 });
      throw new GitHubError(0, "app key");
    }
    const response = await raw("installation token", `${API}/app/installations/${encodeURIComponent(opts.installationId)}/access_tokens`, {
      method: "POST",
      headers: { ...headers(jwt), "content-type": "application/json" },
      body: JSON.stringify({ repositories: [opts.repo], permissions: PERMISSIONS }),
    });
    const data = response.ok ? asJson(await response.json().catch(() => null)) : {};
    const token = str(data.token);
    if (!token) {
      log("github_error", { operation: "installation token", status: response.status });
      throw new GitHubError(response.status, "installation token");
    }
    const expires = Date.parse(str(data.expires_at));
    cached = { value: token, expiresAt: Number.isNaN(expires) ? now() + 3600_000 : expires };
    return token;
  }

  /** One authorised call. A 401 clears the cached token and retries once; 404 returns null when `allow404`. */
  async function call(operation: string, method: string, path: string, body?: unknown, allow: readonly number[] = []): Promise<{ status: number; data: unknown }> {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const token = await installationToken();
      const response = await raw(operation, `${API}${path}`, {
        method,
        headers: { ...headers(token), ...(body === undefined ? {} : { "content-type": "application/json" }) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (response.status === 401 && attempt === 1) {
        cached = null;
        continue;
      }
      if (response.ok || allow.includes(response.status)) {
        const data: unknown = response.status === 204 ? null : await response.json().catch(() => null);
        return { status: response.status, data };
      }
      log("github_error", { operation, status: response.status });
      throw new GitHubError(response.status, operation);
    }
    throw new GitHubError(401, operation);
  }

  const get = async (operation: string, path: string) => asJson((await call(operation, "GET", `${repoPath}${path}`)).data);
  const commitTree = async (commit: string) => str(asJson((await get("read commit", `/git/commits/${encodeURIComponent(commit)}`)).tree).sha);
  const refPath = (name: string) => `/git/refs/heads/${encodePath(name)}`;

  return {
    async headOfMain() {
      const ref = await get("read branch", `/git/ref/heads/${encodePath(main)}`);
      const commit = str(asJson(ref.object).sha);
      return { commit, tree: await commitTree(commit) };
    },

    async tree(treeSha) {
      const data = await get("read tree", `/git/trees/${encodeURIComponent(treeSha)}?recursive=1`);
      const entries = Array.isArray(data.tree) ? data.tree : [];
      return entries.flatMap((item): TreeEntry[] => {
        const entry = asJson(item);
        return entry.type === "blob" || entry.type === "tree" ? [{ path: str(entry.path), sha: str(entry.sha), type: entry.type }] : [];
      });
    },

    async fileAt(commit, path) {
      const { status, data } = await call("read file", "GET", `${repoPath}/contents/${encodePath(path)}?ref=${encodeURIComponent(commit)}`, undefined, [404]);
      if (status === 404) return null;
      const file = asJson(data);
      return typeof file.content === "string" ? decodeBase64Utf8(file.content) : null;
    },

    async createCommit({ baseCommit, files, message }) {
      const baseTree = await commitTree(baseCommit);
      const entries: Record<string, string>[] = [];
      for (const file of files) {
        if ("bytes" in file) {
          const blob = asJson((await call("create blob", "POST", `${repoPath}/git/blobs`, { content: toBase64(file.bytes), encoding: "base64" })).data);
          entries.push({ path: file.path, mode: "100644", type: "blob", sha: str(blob.sha) });
        } else {
          entries.push({ path: file.path, mode: "100644", type: "blob", content: file.content });
        }
      }
      const tree = asJson((await call("create tree", "POST", `${repoPath}/git/trees`, { base_tree: baseTree, tree: entries })).data);
      const commit = asJson((await call("create commit", "POST", `${repoPath}/git/commits`, { message, tree: str(tree.sha), parents: [baseCommit] })).data);
      return str(commit.sha);
    },

    async setBranch(name, sha) {
      const created = await call("create branch", "POST", `${repoPath}/git/refs`, { ref: `refs/heads/${name}`, sha }, [422]);
      if (created.status === 422) await call("update branch", "PATCH", `${repoPath}${refPath(name)}`, { sha, force: true });
    },

    async deleteBranch(name) {
      await call("delete branch", "DELETE", `${repoPath}${refPath(name)}`, undefined, [404, 422]);
    },

    async branchHead(name) {
      const { status, data } = await call("read branch", "GET", `${repoPath}/git/ref/heads/${encodePath(name)}`, undefined, [404]);
      return status === 404 ? null : str(asJson(asJson(data).object).sha) || null;
    },

    async listBranches(prefix) {
      const { data } = await call("list branches", "GET", `${repoPath}/git/matching-refs/heads/${encodePath(prefix)}`);
      return Array.isArray(data)
        ? data.flatMap((item) => {
            const ref = asJson(item);
            const name = str(ref.ref).replace(/^refs\/heads\//, "");
            const sha = str(asJson(ref.object).sha);
            return name !== "" && sha !== "" ? [{ name, sha }] : [];
          })
        : [];
    },

    async openPull({ head, title, body }) {
      return mapPull((await call("open pull request", "POST", `${repoPath}/pulls`, { title, head, base: main, body })).data);
    },

    async enableAutoMerge(nodeId) {
      const { data } = await call("enable auto-merge", "POST", "/graphql", { query: AUTO_MERGE_MUTATION, variables: { pullRequestId: nodeId } });
      const errors = asJson(data).errors;
      if (!Array.isArray(errors) || errors.length === 0) return "queued";
      const messages = errors.map((error) => str(asJson(error).message));
      if (messages.some((message) => /auto[- ]merge is not allowed/i.test(message))) return "not_allowed";
      if (messages.some((message) => message.includes("clean status"))) return "clean";
      log("github_error", { operation: "enable auto-merge", status: 422 });
      throw new GitHubError(422, "enable auto-merge");
    },

    async closePull(number) {
      await call("close pull request", "PATCH", `${repoPath}/pulls/${number}`, { state: "closed" });
    },

    async getPull(number) {
      const { status, data } = await call("read pull request", "GET", `${repoPath}/pulls/${number}`, undefined, [404]);
      return status === 404 ? null : mapPull(data);
    },

    async listPulls(state) {
      const pulls: Pull[] = [];
      for (let page = 1; page <= (state === "open" ? OPEN_PAGES : 1); page++) {
        const { data } = await call("list pull requests", "GET", `${repoPath}/pulls?state=${state}&sort=created&direction=desc&per_page=100&page=${page}`);
        const batch = Array.isArray(data) ? data.map(mapPull) : [];
        pulls.push(...batch);
        if (batch.length < 100) break;
      }
      return pulls;
    },

    async pullFiles(number) {
      const { data } = await call("read pull request files", "GET", `${repoPath}/pulls/${number}/files?per_page=100`);
      return Array.isArray(data) ? data.map((item) => ({ path: str(asJson(item).filename), status: str(asJson(item).status) })) : [];
    },

    async checkRuns(sha) {
      const data = await get("read check runs", `/commits/${encodeURIComponent(sha)}/check-runs?per_page=100`);
      const runs = Array.isArray(data.check_runs) ? data.check_runs : [];
      return runs.map((item): CheckRun => {
        const run = asJson(item);
        return {
          name: str(run.name),
          status: run.status === "completed" || run.status === "in_progress" ? run.status : "queued",
          conclusion: strOrNull(run.conclusion),
        };
      });
    },

    async compare(base, head) {
      const data = await get("compare commits", `/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`);
      return data.status === "identical" || data.status === "ahead" || data.status === "behind" ? data.status : "diverged";
    },

    async commitParent(sha) {
      const parents = (await get("read commit", `/git/commits/${encodeURIComponent(sha)}`)).parents;
      const first = Array.isArray(parents) ? str(asJson(parents[0]).sha) : "";
      if (!first) throw new GitHubError(404, "read commit parent");
      return first;
    },

    async openIssue({ title, body, labels }) {
      const issue = asJson((await call("open issue", "POST", `${repoPath}/issues`, { title, body, labels })).data);
      return { number: typeof issue.number === "number" ? issue.number : 0, url: str(issue.html_url) };
    },
  };
}
