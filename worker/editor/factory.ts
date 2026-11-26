import { registry } from "../../src/blocks/definitions.ts";
import { thanks } from "../../src/content/contact.ts";
import { thanksPageLinks } from "../../src/lib/thanks-links.ts";
import type { WorkerConfig } from "../config.ts";
import type { EditorEnv } from "../env.ts";
import { log } from "../env.ts";
import { createUploadStore } from "../uploads/store.ts";
import { createGitHub } from "./github.ts";
import { createEditor } from "./service.ts";
import type { Editor } from "./types.ts";

/** Wires the editor from the config and the bindings. The caller has already checked `missingBindings`; a gap throws. */
export function buildEditor(config: WorkerConfig, env: EditorEnv, deps: { fetch?: typeof fetch; now?: () => Date } = {}): Editor {
  const { editor } = config;
  const { github } = editor;
  if (!env.EDITOR_KV || !env.ASSETS || !env.GITHUB_APP_PRIVATE_KEY) throw new Error("The editor's bindings are missing.");
  if (github.owner === null || github.repo === null || github.appId === null || github.installationId === null) {
    throw new Error("The editor's GitHub settings are missing.");
  }
  const now = deps.now ?? (() => new Date());
  const githubClient = createGitHub({
    appId: github.appId,
    installationId: github.installationId,
    owner: github.owner,
    repo: github.repo,
    branch: editor.productionBranch,
    privateKeyPem: env.GITHUB_APP_PRIVATE_KEY,
    userAgent: `${config.workerName}-editor`,
    ...(deps.fetch ? { fetch: deps.fetch } : {}),
    now: () => now().getTime(),
  });
  const { uploads } = editor;
  let store;
  if (uploads.enabled) {
    if (env.UPLOADS && env.IMAGES) store = createUploadStore({ bucket: env.UPLOADS, images: env.IMAGES, kv: env.EDITOR_KV, config: uploads, now });
    else log("uploads_not_configured");
  }
  return createEditor({
    config: editor,
    github: githubClient,
    kv: env.EDITOR_KV,
    assets: env.ASSETS,
    registry,
    thanksLinks: thanksPageLinks(thanks),
    formSettings: config.forms,
    now,
    ...(store ? { uploads: store } : {}),
    ...(deps.fetch ? { fetch: deps.fetch } : {}),
  });
}
