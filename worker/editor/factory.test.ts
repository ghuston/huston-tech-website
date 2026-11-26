import assert from "node:assert/strict";
import { test } from "node:test";
import type { WorkerConfig } from "../config.ts";
import type { EditorEnv } from "../env.ts";
import { createFakeR2 } from "../uploads/fake-r2.ts";
import { buildEditor } from "./factory.ts";
import { FakeAssets, FakeKv, testEditorConfig } from "./test-support.ts";

const RS256 = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) } as const;
const pair = (await crypto.subtle.generateKey(RS256, true, ["sign", "verify"])) as CryptoKeyPair;
const der = new Uint8Array((await crypto.subtle.exportKey("pkcs8", pair.privateKey)) as ArrayBuffer);
const PEM = `-----BEGIN PRIVATE KEY-----\n${Buffer.from(der).toString("base64")}\n-----END PRIVATE KEY-----\n`;

const config = { workerName: "example-site", editor: testEditorConfig() } as unknown as WorkerConfig;
const env: EditorEnv = {
  EDITOR_KV: new FakeKv().asNamespace(),
  ASSETS: new FakeAssets() as unknown as Fetcher,
  GITHUB_APP_PRIVATE_KEY: PEM,
};

test("buildEditor reads the site through GitHub with the configured app, repo and user agent", async () => {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, headers: Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>)) });
    if (url.endsWith("/access_tokens")) return Response.json({ token: "ghs_x", expires_at: "2026-11-25T13:00:00Z" }, { status: 201 });
    return new Response("{}", { status: 503 });
  };
  const editor = buildEditor(config, env, { fetch: fetcher, now: () => new Date("2026-11-25T12:00:00Z") });
  const result = await editor.overview();
  assert.equal(result.isError, true, "the mocked GitHub is down, so the editor answers with its plain failure");
  assert.equal(calls[0]?.url, "https://api.github.com/app/installations/2/access_tokens");
  assert.equal(calls[0]?.headers["User-Agent"] ?? calls[0]?.headers["user-agent"], "example-site-editor");
  assert.ok(calls.slice(1).every((call) => call.url.startsWith("https://api.github.com/repos/example/site/")));
});

test("buildEditor refuses to build without its bindings", () => {
  assert.throws(() => buildEditor(config, {}), /bindings/);
});

test("uploads are built only when enabled and both bindings exist; missing bindings are logged once and the editor still builds", async () => {
  const on = testEditorConfig({ uploads: { ...testEditorConfig().uploads, enabled: true, bucket: "example-site-uploads" } });
  const withUploads = { workerName: "example-site", editor: on } as unknown as WorkerConfig;
  const lines: string[] = [];
  const original = console.log;
  console.log = (line: string) => void lines.push(String(line));
  try {
    const bare = buildEditor(withUploads, env);
    assert.equal((await bare.uploads()).text, "Uploads aren't set up on this site yet.");
    assert.deepEqual(lines.filter((l) => l.includes("uploads_not_configured")).length, 1);
    const full = buildEditor(withUploads, { ...env, UPLOADS: createFakeR2().bucket, IMAGES: {} as ImagesBinding });
    assert.notEqual((await full.removeUpload("abcd1234")).text, "Uploads aren't set up on this site yet.");
    assert.equal(lines.filter((l) => l.includes("uploads_not_configured")).length, 1, "no log when configured");
    lines.length = 0;
    buildEditor(config, env);
    assert.equal(lines.length, 0, "disabled uploads log nothing");
  } finally {
    console.log = original;
  }
});
