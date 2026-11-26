import { DEFAULT_UPLOADS, type EditorConfig } from "../config.ts";
import { createFakeImages, type FakeImagesOptions } from "../uploads/fake-images.ts";
import { createFakeR2, type FakeR2 } from "../uploads/fake-r2.ts";
import { createUploadStore, type UploadStore } from "../uploads/store.ts";
import type { UploadsConfig } from "../uploads/types.ts";
import type { FakeGitHub } from "./fake-github.ts";
import { handleMcp } from "./mcp.ts";
import { FakeKv, makeTestEditor, testEditorConfig, type TestEditor } from "./test-support.ts";

/** An editor on the seeded site with a real upload store on fake R2 and fake Images, for the uploads tests. */

export const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
export const pdfBytes = (body = "<< /Type /Page >>") => new TextEncoder().encode(`%PDF-1.4\n${body}\n%%EOF\n`);
export const MP4 = Uint8Array.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0, 0x69, 0x73, 0x6f, 0x6d, 0x6d, 0x70, 0x34, 0x31]);

export interface UploadsEditor extends TestEditor {
  store: UploadStore;
  r2: FakeR2;
}

export function makeUploadsEditor(options: { github?: FakeGitHub; images?: FakeImagesOptions; uploads?: Partial<UploadsConfig>; config?: Partial<EditorConfig> } = {}): UploadsEditor {
  const r2 = createFakeR2();
  const images = createFakeImages({ webpSizes: [100 * 1024], ...options.images });
  let counter = 0;
  const held: { test?: TestEditor } = {};
  const store = createUploadStore({
    bucket: r2.bucket,
    images: images.images,
    kv: new FakeKv().asNamespace(),
    config: { ...DEFAULT_UPLOADS, enabled: true, bucket: "example-site-uploads", ...options.uploads },
    now: () => (held.test as TestEditor).now.value,
    randomId: () => `up${String(++counter).padStart(6, "0")}`,
  });
  const test = (held.test = makeTestEditor({ ...(options.github ? { github: options.github } : {}), ...(options.config ? { config: options.config } : {}), deps: { uploads: store } }));
  return { ...test, store, r2 };
}

export const OWNER = "owner@example.test";
export interface Called {
  text: string;
  isError: boolean;
  data: Record<string, unknown>;
  content: { type: string; text?: string; data?: string; mimeType?: string }[];
}

/** The owner's AI app calling one tool through the MCP endpoint. */
export function aiApp(t: TestEditor) {
  let id = 0;
  return async (name: string, args: Record<string, unknown> = {}): Promise<Called> => {
    const request = new Request("https://example.test/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }),
    });
    const response = await handleMcp(request, { editor: t.editor, email: OWNER, config: testEditorConfig() });
    const { result } = (await response.json()) as { result: { content: Called["content"]; isError: boolean; structuredContent?: Record<string, unknown> } };
    return { text: result.content[0].text ?? "", isError: result.isError, data: result.structuredContent ?? {}, content: result.content };
  };
}
