import type { EditorConfig } from "../config.ts";
import { log } from "../env.ts";
import { BASE_HEADERS, jsonResponse } from "../http.ts";
import { readBody } from "../read-body.ts";
import { isOwner } from "./access.ts";
import { serverInstructions } from "./instructions.ts";
import { ownerKey } from "./owner-id.ts";
import { argumentProblems, findTool, tools } from "./tools.ts";
import type { Editor, ToolImage, ToolResult } from "./types.ts";

/**
 * The MCP endpoint the owner's AI app talks to: stateless Streamable HTTP, one JSON-RPC message per POST, answered as
 * JSON. Hand-written (no SDK). The caller has already checked the OAuth token; `email` is that token's owner, and is
 * checked against the owner list again here on every request.
 */

export interface McpContext {
  editor: Editor;
  email: string;
  config: EditorConfig;
  rateLimit?: RateLimit;
}

const MAX_BODY_BYTES = 64 * 1024;
const VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26"];
const FALLBACK_VERSION = "2025-06-18";
const FAILED = "Something went wrong on the site's side. Nothing was changed.";

const CSP = { "content-security-policy": "default-src 'none'; frame-ancestors 'none'" };
const HEADERS = { ...BASE_HEADERS, "content-type": "application/json; charset=utf-8", ...CSP };

type Id = string | number | null;

const reply = (status: number, body: unknown, extra: Record<string, string> = {}): Response => jsonResponse(status, body, { ...CSP, ...extra });
const refusal = (status: number, error: string): Response => reply(status, { error });
const rpcError = (status: number, id: Id, code: number, message: string): Response =>
  reply(status, { jsonrpc: "2.0", id, error: { code, message } });
const rpcResult = (id: Id, result: unknown): Response => reply(200, { jsonrpc: "2.0", id, result });

export async function handleMcp(request: Request, ctx: McpContext): Promise<Response> {
  if (request.method !== "POST") return reply(405, { error: "Use POST." }, { allow: "POST" });
  const origin = request.headers.get("origin");
  if (origin !== null && origin !== ctx.config.siteUrl) {
    log("mcp_rejected_origin");
    return refusal(403, "Not allowed from this origin.");
  }
  const email = ctx.email.trim().toLowerCase();
  if (!isOwner(ctx.config, email)) {
    log("mcp_not_owner");
    return refusal(403, "This sign-in is no longer allowed to edit the site.");
  }
  const key = await ownerKey(email);
  if (ctx.rateLimit && !(await ctx.rateLimit.limit({ key: `user:${key}` })).success) {
    return refusal(429, "Too many requests. Wait a moment and try again.");
  }

  if (Number(request.headers.get("content-length") ?? "0") > MAX_BODY_BYTES) return refusal(413, "That request is too large.");
  const text = await readBody(request, MAX_BODY_BYTES);
  if (text === null) return refusal(413, "That request is too large.");

  let message: unknown;
  try {
    message = JSON.parse(text);
  } catch {
    return rpcError(400, null, -32700, "The request is not valid JSON.");
  }
  if (Array.isArray(message)) return rpcError(400, null, -32600, "Batches are not supported.");
  if (typeof message !== "object" || message === null) return rpcError(400, null, -32600, "The request must be a JSON-RPC object.");
  const { jsonrpc, method, id, params } = message as Record<string, unknown>;
  if (jsonrpc === "2.0" && method === undefined && ("result" in message || "error" in message)) return new Response(null, { status: 202, headers: HEADERS });
  if (jsonrpc !== "2.0" || typeof method !== "string") return rpcError(400, null, -32600, 'The request must have "jsonrpc": "2.0" and a method.');
  if (!("id" in message)) return new Response(null, { status: 202, headers: HEADERS });
  if (typeof id !== "string" && typeof id !== "number") return rpcError(400, null, -32600, "The id must be text or a number.");

  switch (method) {
    case "initialize":
      return rpcResult(id, initialize(params, ctx.config));
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: tools.map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations })) });
    case "tools/call":
      return rpcResult(id, await callTool(params, ctx));
    default:
      return rpcError(200, id, -32601, `Unknown method: ${method}.`);
  }
}

function initialize(params: unknown, config: EditorConfig): unknown {
  const asked = typeof params === "object" && params !== null ? (params as Record<string, unknown>).protocolVersion : undefined;
  return {
    protocolVersion: typeof asked === "string" && VERSIONS.includes(asked) ? asked : FALLBACK_VERSION,
    capabilities: { tools: { listChanged: false } },
    serverInfo: { name: `${config.workerName}-editor`, title: `${config.siteName} site editor`, version: "1.0.0" },
    instructions: serverInstructions(config.siteName),
  };
}

function toolResult(text: string, data: unknown, isError: boolean, images: ToolImage[] = []): unknown {
  const result: Record<string, unknown> = { content: [{ type: "text", text }, ...images.map((image) => ({ type: "image", data: image.data, mimeType: image.mimeType }))], isError };
  if (typeof data === "object" && data !== null && !Array.isArray(data)) result.structuredContent = data;
  return result;
}

async function callTool(params: unknown, ctx: McpContext): Promise<unknown> {
  const { name, arguments: args } = typeof params === "object" && params !== null ? (params as Record<string, unknown>) : {};
  const tool = findTool(name);
  if (!tool) return toolResult(`There is no tool named ${String(name)}.`, undefined, true);
  const problems = argumentProblems(tool, args);
  if (problems.length > 0) return toolResult(`${tool.name} was not called. Fix these and try again:\n${problems.map((p) => `- ${p}`).join("\n")}`, undefined, true);
  let result: ToolResult;
  try {
    result = await tool.run(ctx.editor, (args ?? {}) as Record<string, unknown>, { email: ctx.email });
  } catch (caught) {
    log("editor_tool_failed", { tool: tool.name, errorName: caught instanceof Error ? caught.name : "unknown" });
    return toolResult(FAILED, undefined, true);
  }
  return toolResult(result.text, result.data, result.isError === true, result.images);
}
