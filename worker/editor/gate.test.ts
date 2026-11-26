import assert from "node:assert/strict";
import { test } from "node:test";
import { buildEditorConfig, type EditorConfig, type WorkerConfig } from "../config.ts";
import type { EditorEnv } from "../env.ts";
import { editorActive, isEditorPath, missingBindings } from "./gate.ts";
import { testEditorConfig } from "./test-support.ts";

function config(editor: Partial<EditorConfig> = {}): WorkerConfig {
  return {
    workerName: "example-site",
    previewHostSuffix: ".acct.workers.dev",
    editor: testEditorConfig(editor),
  } as unknown as WorkerConfig;
}

const env = (siteEnv = "production"): EditorEnv => ({ SITE_ENV: siteEnv });
const at = (url: string) => new URL(url);

test("the editor is active only when enabled, in production mode and on the site's own host", () => {
  assert.equal(editorActive(config(), env(), at("https://example.test/mcp")), true);
  assert.equal(editorActive(config({ enabled: false }), env(), at("https://example.test/mcp")), false);
  assert.equal(editorActive(config(), env(), at("https://example-site.acct.workers.dev/mcp")), false, "the production workers.dev host is not the site's host");
  assert.equal(editorActive(config(), env(), at("https://change-owner-abc12345-example-site.acct.workers.dev/mcp")), false);
  assert.equal(editorActive(config(), env("preview"), at("https://example.test/mcp")), false);
  assert.equal(editorActive(config(), env("development"), at("http://localhost:8787/mcp")), false);
  assert.equal(editorActive(config(), {}, at("https://example.test/mcp")), false);
  assert.equal(editorActive(config(), env(), at("https://www.example.test/mcp")), false);
});

test("an editor with no resolvable host is never active", () => {
  const unset = buildEditorConfig({
    domain: { url: "not a url", workerName: "x", previewHostSuffix: ".workers.dev" },
    business: { name: "X" },
  } as unknown as Parameters<typeof buildEditorConfig>[0]);
  assert.equal(unset.host, "");
  assert.equal(editorActive({ workerName: "x", previewHostSuffix: ".workers.dev", editor: { ...unset, enabled: true } } as unknown as WorkerConfig, env(), at("https://example.test/")), false);
});

test("isEditorPath names exactly the editor's paths", () => {
  for (const path of [
    "/mcp",
    "/owner",
    "/owner/",
    "/owner/connect",
    "/owner/publish",
    "/oauth/token",
    "/oauth/register",
    "/.well-known/oauth-authorization-server",
    "/.well-known/oauth-protected-resource",
    "/.well-known/oauth-protected-resource/mcp",
  ]) {
    assert.equal(isEditorPath(path), true, path);
  }
  for (const path of ["/", "/about", "/api/contact", "/owners", "/mcp/x", "/oauth", "/.well-known/security.txt", "/.well-known/oauth-protected-resources"]) {
    assert.equal(isEditorPath(path), false, path);
  }
});

test("missingBindings names every binding and setting that is absent, and nothing else", () => {
  const full: EditorEnv = {
    OAUTH_KV: {} as KVNamespace,
    EDITOR_KV: {} as KVNamespace,
    ASSETS: {} as Fetcher,
    GITHUB_APP_PRIVATE_KEY: "key",
  };
  const ready = config({ access: { teamDomain: "team.cloudflareaccess.com", aud: "aud" } });
  assert.deepEqual(missingBindings(ready, full), []);
  assert.deepEqual(missingBindings(ready, {}), ["OAUTH_KV", "EDITOR_KV", "ASSETS", "GITHUB_APP_PRIVATE_KEY"]);
  assert.deepEqual(missingBindings(ready, { ...full, EDITOR_KV: undefined }), ["EDITOR_KV"]);
  const bare = config({
    github: { owner: null, repo: null, appId: null, installationId: null, botLogin: null },
    access: { teamDomain: null, aud: null },
  });
  assert.deepEqual(missingBindings(bare, full), [
    "editor.github.owner",
    "editor.github.repo",
    "editor.github.appId",
    "editor.github.installationId",
    "editor.github.botLogin",
    "editor.access.teamDomain",
    "editor.access.aud",
  ]);
  const login = (botLogin: string | null) => config({ access: ready.editor.access, github: { ...ready.editor.github, botLogin } });
  assert.deepEqual(missingBindings(login("editor-bot"), full), ["editor.github.botLogin"], "a GitHub App login ends in [bot]");
  assert.deepEqual(missingBindings(login("editor-bot[bot]"), full), []);
});
