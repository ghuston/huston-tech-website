import type { WorkerConfig } from "../config.ts";
import { resolveMode, type EditorEnv } from "../env.ts";

/** The editor answers only when it is on, in production mode, on the site's own host. Anything else leaves the site as it was. */
export function editorActive(config: WorkerConfig, env: EditorEnv, url: URL): boolean {
  if (!config.editor.enabled) return false;
  if (resolveMode(env.SITE_ENV, url.hostname, config.workerName, config.previewHostSuffix) !== "production") return false;
  return config.editor.host !== "" && url.hostname === config.editor.host;
}

const WELL_KNOWN = ["/.well-known/oauth-authorization-server", "/.well-known/oauth-protected-resource"];

/** Exactly the paths the editor owns (spec, "Paths and modes"); every other path stays the static site's. */
export function isEditorPath(pathname: string): boolean {
  if (pathname === "/mcp" || pathname === "/owner" || pathname.startsWith("/owner/") || pathname.startsWith("/oauth/")) return true;
  return WELL_KNOWN.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Names (never values) of the bindings and settings the editor needs and does not have. */
export function missingBindings(config: WorkerConfig, env: EditorEnv): string[] {
  const missing: string[] = [];
  if (!env.OAUTH_KV) missing.push("OAUTH_KV");
  if (!env.EDITOR_KV) missing.push("EDITOR_KV");
  if (!env.ASSETS) missing.push("ASSETS");
  if (!env.GITHUB_APP_PRIVATE_KEY) missing.push("GITHUB_APP_PRIVATE_KEY");
  const { github, access } = config.editor;
  if (github.owner === null) missing.push("editor.github.owner");
  if (github.repo === null) missing.push("editor.github.repo");
  if (github.appId === null) missing.push("editor.github.appId");
  if (github.installationId === null) missing.push("editor.github.installationId");
  if (github.botLogin === null || !github.botLogin.endsWith("[bot]")) missing.push("editor.github.botLogin");
  if (access.teamDomain === null) missing.push("editor.access.teamDomain");
  if (access.aud === null) missing.push("editor.access.aud");
  return missing;
}
