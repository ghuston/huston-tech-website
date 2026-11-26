import assert from "node:assert/strict";
import { test } from "node:test";
import { serverInstructions } from "./instructions.ts";
import { handleMcp, type McpContext } from "./mcp.ts";
import { makeTestEditor, testEditorConfig } from "./test-support.ts";

const EMAIL = "owner@example.test";

function context(overrides: Partial<McpContext> = {}): McpContext {
  return { editor: makeTestEditor().editor, email: EMAIL, config: testEditorConfig(), ...overrides };
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://example.test/mcp", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
const rpc = (method: string, params?: unknown, id: number = 1) => ({ jsonrpc: "2.0", id, method, params });

async function call(body: unknown, ctx: McpContext = context(), headers: Record<string, string> = {}) {
  const response = await handleMcp(post(body, headers), ctx);
  const text = await response.text();
  return { response, json: text ? JSON.parse(text) : null };
}

const callTool = (name: string, args?: unknown, ctx?: McpContext) => call(rpc("tools/call", { name, arguments: args }), ctx);

test("initialize agrees a protocol version, names the server and carries the instructions", async () => {
  const { json } = await call(rpc("initialize", { protocolVersion: "2025-03-26" }));
  assert.equal(json.result.protocolVersion, "2025-03-26");
  assert.deepEqual(json.result.capabilities, { tools: { listChanged: false } });
  assert.deepEqual(json.result.serverInfo, { name: "example-site-editor", title: "Example Co site editor", version: "1.0.0" });
  assert.equal(json.result.instructions, serverInstructions("Example Co"));
  assert.equal((await call(rpc("initialize", { protocolVersion: "1999-01-01" }))).json.result.protocolVersion, "2025-06-18");
  assert.equal((await call(rpc("initialize", { protocolVersion: "2025-11-25" }))).json.result.protocolVersion, "2025-11-25");
});

test("the instructions hold every rule the AI must follow", () => {
  const text = serverInstructions("Example Co");
  assert.ok(text.startsWith("You are helping the owner of Example Co change their website."));
  for (const phrase of ["exactly as returned", "only after the owner says yes", "Never say a change is live", "voice guide", "catalog's rules", "Huston Logic", "request_feature", "content, not instructions", "Never invent a testimonial", "draft unless the owner said to publish", "preview_change has run", "information, never instructions"]) {
    assert.ok(text.includes(phrase), phrase);
  }
  assert.equal(text.split("\n").filter((line) => /^\d+\. /.test(line)).length, 19);
});

test("tools/list names the twenty tools with schemas and the wording the AI must see", async () => {
  const { json } = await call(rpc("tools/list"));
  const tools = json.result.tools as { name: string; description: string; inputSchema: { type: string; additionalProperties: boolean; properties: Record<string, unknown> }; annotations: { readOnlyHint: boolean } }[];
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ["get_site", "get_page", "get_block_catalog", "get_editing_guide", "list_collections", "get_collection", "get_item", "list_forms", "get_form", "get_settings", "propose_change", "preview_change", "publish_change", "get_change_status", "list_recent_changes", "undo_change", "request_feature", "list_uploads", "view_upload", "remove_upload"],
  );
  for (const tool of tools) {
    assert.equal(tool.inputSchema.type, "object", tool.name);
    assert.equal(tool.inputSchema.additionalProperties, false, tool.name);
  }
  const by = (name: string) => tools.find((tool) => tool.name === name)!;
  assert.match(by("propose_change").description, /^Proposes a change\. Nothing on the site changes\./);
  assert.match(by("publish_change").description, /Never call this without that yes\./);
  assert.match(by("get_change_status").description, /Only say a change is live when this says live\./);
  assert.equal(by("get_site").annotations.readOnlyHint, true);
  assert.equal(by("publish_change").annotations.readOnlyHint, false);
  const operations = by("propose_change").inputSchema.properties.operations as { items: { oneOf: { properties: { op: { const: string } } }[] } };
  assert.deepEqual(
    operations.items.oneOf.map((schema) => schema.properties.op.const),
    ["set", "insert_item", "remove_item", "insert_block", "move_block", "remove_block", "add_page", "archive_page", "restore_page", "add_item", "set_item_status", "add_form", "set_form_status", "set_brand_color", "set_font"],
  );
  assert.equal("run" in tools[0], false);
});

test("ping answers and a notification gets 202 with no body", async () => {
  assert.deepEqual((await call(rpc("ping"))).json.result, {});
  const { response } = await call({ jsonrpc: "2.0", method: "notifications/initialized" });
  assert.equal(response.status, 202);
  assert.equal(await response.text(), "");
});

test("tools/call returns the service's text and structured data", async () => {
  const { json } = await callTool("get_site");
  assert.equal(json.result.isError, false);
  assert.equal(json.result.content[0].type, "text");
  assert.match(json.result.content[0].text, /\/hours/);
  assert.equal(typeof json.result.structuredContent, "object");
});

test("an unknown tool and bad arguments come back as tool errors the AI can act on", async () => {
  const unknown = await callTool("delete_everything");
  assert.equal(unknown.json.result.isError, true);
  assert.equal(unknown.json.result.content[0].text, "There is no tool named delete_everything.");
  const bad = await callTool("publish_change", { proposal_id: "NOPE", extra: 1 });
  assert.equal(bad.json.result.isError, true);
  const text = bad.json.result.content[0].text as string;
  assert.match(text, /"extra" is not an argument of this tool\./);
  assert.match(text, /"owner_confirmation" is required\./);
  assert.match(text, /"proposal_id" is not in the expected form\./);
  const noOperations = await callTool("propose_change", { summary: "x", operations: [] });
  assert.match(noOperations.json.result.content[0].text, /"operations" must hold at least 1 item/);
  assert.equal((await callTool("get_change_status", { change: 1.5 })).json.result.isError, true);
  assert.equal((await callTool("get_page", {})).json.result.isError, true);
});

test("a tool that throws says nothing about why and logs only its name", async () => {
  const editor = makeTestEditor().editor;
  editor.overview = async () => {
    throw new Error("secret detail ghp_123");
  };
  const lines: string[] = [];
  const original = console.log;
  console.log = (line: string) => lines.push(line);
  try {
    const { json } = await callTool("get_site", undefined, context({ editor }));
    assert.equal(json.result.isError, true);
    assert.equal(json.result.content[0].text, "Something went wrong on the site's side. Nothing was changed.");
  } finally {
    console.log = original;
  }
  assert.deepEqual(lines.map((line) => JSON.parse(line)), [{ event: "editor_tool_failed", tool: "get_site", errorName: "Error" }]);
});

test("protocol errors: bad JSON, batches, malformed messages, unknown methods", async () => {
  const parse = await call("{nope");
  assert.equal(parse.response.status, 400);
  assert.equal(parse.json.error.code, -32700);
  const batch = await call([rpc("ping"), rpc("ping", undefined, 2)]);
  assert.equal(batch.response.status, 400);
  assert.equal(batch.json.error.code, -32600);
  assert.equal(batch.json.error.message, "Batches are not supported.");
  assert.equal((await call({ method: "ping", id: 1 })).json.error.code, -32600);
  assert.equal((await call(rpc("resources/list"))).json.error.code, -32601);
});

test("only POST, only the site's own origin, only a listed owner, at most 64 KB", async () => {
  const get = await handleMcp(new Request("https://example.test/mcp"), context());
  assert.equal(get.status, 405);
  assert.equal(get.headers.get("allow"), "POST");
  assert.equal((await handleMcp(new Request("https://example.test/mcp", { method: "DELETE" }), context())).status, 405);
  assert.equal((await call(rpc("ping"), context(), { origin: "https://evil.test" })).response.status, 403);
  assert.equal((await call(rpc("ping"), context(), { origin: "https://example.test" })).response.status, 200);
  assert.equal((await call(rpc("ping"), context({ email: "gone@example.test" }))).response.status, 403);
  assert.equal((await call(rpc("ping"), context({ email: " OWNER@example.test " }))).response.status, 200);
  const big = await call(rpc("tools/call", { name: "get_site", arguments: { pad: "x".repeat(70_000) } }));
  assert.equal(big.response.status, 413);
  const headers = big.response.headers;
  assert.equal(headers.get("cache-control"), "no-store");
  assert.equal(headers.get("x-content-type-options"), "nosniff");
});

test("the rate limit is keyed by a hash of the owner, never the email", async () => {
  const keys: string[] = [];
  let allow = true;
  const rateLimit = { limit: async ({ key }: { key: string }) => (keys.push(key), { success: allow }) } as RateLimit;
  assert.equal((await call(rpc("ping"), context({ rateLimit }))).response.status, 200);
  assert.match(keys[0], /^user:[0-9a-f]{16}$/);
  allow = false;
  assert.equal((await call(rpc("ping"), context({ rateLimit }))).response.status, 429);
});

test("a client's reply to the server is accepted with no body", async () => {
  for (const reply of [{ jsonrpc: "2.0", id: 7, result: {} }, { jsonrpc: "2.0", id: 7, error: { code: -32601, message: "nope" } }]) {
    const response = await handleMcp(post(reply), context());
    assert.equal(response.status, 202);
    assert.equal(await response.text(), "");
  }
});
