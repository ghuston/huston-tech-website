import type { EditorConfig } from "../config.ts";
import type { AnyBlockDefinition } from "../../src/blocks/schema.ts";
import type { FormSettings } from "../../src/forms/schema.ts";
import type { UploadStore } from "../uploads/store.ts";
import type { GitHub } from "./github.ts";
import type { ChangeView, ProposalView, UploadView } from "./views.ts";

export type { ChangeView, ProposalView, UploadView };

/** A small picture the AI app can look at (an MCP `image` content item). */
export type ToolImage = { data: string; mimeType: "image/jpeg" };
export type ToolResult<T = unknown> = { text: string; data: T; isError?: boolean; images?: ToolImage[] };
export type Owner = { email: string };
export type AssetsLike = { fetch(request: Request): Promise<Response> };

export interface EditorDeps {
  config: EditorConfig;
  github: GitHub;
  kv: KVNamespace;
  assets: AssetsLike;
  registry: readonly AnyBlockDefinition[];
  thanksLinks: readonly { where: string; href: string }[];
  now: () => Date;
  fetch?: typeof fetch;
  randomId?: () => string;
  /** The owner's upload inbox; absent when uploads are not set up on this site. */
  uploads?: UploadStore;
  /** The site's form caps (`forms` in site.config.ts); missing means the defaults. */
  formSettings?: FormSettings;
}

export interface Editor {
  overview(): Promise<ToolResult>;
  page(path: string): Promise<ToolResult>;
  catalog(): Promise<ToolResult>;
  guide(): Promise<ToolResult>;
  /** Each kind of item with its counts, and the three settings files' short state. */
  collections(): Promise<ToolResult>;
  collection(kind: string): Promise<ToolResult>;
  item(kind: string, slug: string): Promise<ToolResult>;
  /** Each form with its status, fields and the pages that show it. */
  forms(): Promise<ToolResult>;
  form(id: string): Promise<ToolResult>;
  /** One settings file: "business", "brand" or "notice". */
  settings(name: string): Promise<ToolResult>;
  propose(input: { summary: string; operations: unknown }, owner: Owner): Promise<ToolResult>;
  preview(proposalId: string): Promise<ToolResult>;
  publish(proposalId: string, confirmation: string, owner: Owner): Promise<ToolResult>;
  status(change: number): Promise<ToolResult>;
  recent(): Promise<ToolResult<ChangeView[]>>;
  undo(change: number, owner: Owner): Promise<ToolResult>;
  discard(proposalId: string): Promise<ToolResult>;
  requestFeature(input: { request: string; laneReason: string }, owner: Owner): Promise<ToolResult>;
  waiting(): Promise<ToolResult<ProposalView[]>>;
  /** The owner's uploads, newest first (data: UploadView[]). */
  uploads(): Promise<ToolResult<UploadView[]>>;
  /** One upload: a preview picture for a photo, and the facts. */
  viewUpload(id: string): Promise<ToolResult>;
  /** Removes an upload; refused while a waiting proposal uses it. */
  removeUpload(id: string): Promise<ToolResult>;
  /** Adds an upload for the owner page; a refusal is plain text with isError (data null). */
  addUpload(bytes: Uint8Array, fileName: string): Promise<ToolResult<UploadView | null>>;
  /** Renames an upload for the owner page. */
  renameUpload(id: string, name: string): Promise<ToolResult<UploadView | null>>;
  /** The preview JPEG bytes of a photo upload for the owner page, or null. */
  uploadPreview(id: string): Promise<Uint8Array | null>;
}

export const GITHUB_DOWN = "GitHub could not be reached right now, so nothing was changed. Try again in a minute.";
