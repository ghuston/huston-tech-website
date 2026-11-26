import assert from "node:assert/strict";
import { test } from "node:test";
import { applyOperations } from "./operations.ts";

const hours = () => ({
  path: "/hours",
  title: "Opening hours",
  description: "When we are open.",
  status: "live",
  menu: { label: "Hours", order: 10, places: ["header", "footer"] },
  blocks: [
    { type: "hero", content: { title: "Hours" } },
    { type: "prose", anchor: "times", content: { paragraphs: ["Monday: 9 to 5", "Thursday: 9 to 5", "Friday: 9 to 5"] } },
    { type: "faq", content: { heading: "Questions", items: [{ question: "Q1?", answer: "A1" }, { question: "Q2?", answer: "A2" }] } },
  ],
});
const pagesOf = (...list: Array<{ path: string }>) => new Map<string, unknown>(list.map((p) => [p.path, p]));
const home = () => ({ path: "/", title: "Home", description: "d", status: "live", blocks: [{ type: "hero", content: { title: "Hi" } }] });

function problems(ops: unknown, pages = pagesOf(hours(), home())): string[] {
  const result = applyOperations(pages, ops);
  assert.equal(result.ok, false);
  return result.ok ? [] : result.problems;
}

test("set changes a value, leaves the input alone and reports the touched page", () => {
  const input = pagesOf(hours(), home());
  const result = applyOperations(input, [{ op: "set", page: "/hours", pointer: "/blocks/1/content/paragraphs/2", value: "Friday: 9 to 3" }]);
  assert.ok(result.ok);
  assert.deepEqual(result.touched, ["/hours"]);
  assert.deepEqual((result.after.get("/hours") as ReturnType<typeof hours>).blocks[1].content, {
    paragraphs: ["Monday: 9 to 5", "Thursday: 9 to 5", "Friday: 9 to 3"],
  });
  assert.deepEqual(input.get("/hours"), hours());
});

test("set with null removes an optional key", () => {
  const result = applyOperations(pagesOf(hours()), [
    { op: "set", page: "/hours", pointer: "/menu", value: null },
    { op: "set", page: "/hours", pointer: "/blocks/1/anchor", value: null },
  ]);
  assert.ok(result.ok);
  const page = result.after.get("/hours") as Record<string, unknown>;
  assert.equal("menu" in page, false);
  assert.equal("anchor" in (page.blocks as object[])[1], false);
});

test("set may add a new key to an existing object", () => {
  const result = applyOperations(pagesOf(hours()), [{ op: "set", page: "/hours", pointer: "/blocks/0/variant", value: "dark" }]);
  assert.ok(result.ok);
  assert.equal(((result.after.get("/hours") as ReturnType<typeof hours>).blocks[0] as { variant?: string }).variant, "dark");
});

test("pointers: protected targets and missing parents are refused with plain sentences", () => {
  assert.match(problems([{ op: "set", page: "/hours", pointer: "/path", value: "/x" }])[0], /^Operation 1 \(set\): .*path/);
  assert.match(problems([{ op: "set", page: "/hours", pointer: "/status", value: "archived" }])[0], /use archive_page or restore_page/);
  assert.match(problems([{ op: "set", page: "/hours", pointer: "/blocks", value: [] }])[0], /insert_block/);
  assert.match(problems([{ op: "set", page: "/hours", pointer: "/blocks/1/type", value: "faq" }])[0], /type cannot be changed/);
  assert.match(problems([{ op: "set", page: "/hours", pointer: "/blocks/9/content/x", value: "a" }])[0], /does not exist/);
  assert.match(problems([{ op: "set", page: "/hours", pointer: "/blocks/1/content/nope/deeper", value: "a" }])[0], /goes through something that does not exist/);
  assert.match(problems([{ op: "set", page: "/hours", pointer: "title", value: "a" }])[0], /valid pointer/);
  assert.match(problems([{ op: "set", page: "/hours", pointer: "/blocks/1/content/__proto__", value: "a" }])[0], /not allowed as a key/);
});

test("insert_item and remove_item use 1-based positions", () => {
  const result = applyOperations(pagesOf(hours()), [
    { op: "insert_item", page: "/hours", pointer: "/blocks/2/content/items", at: 3, value: { question: "Q3?", answer: "A3" } },
    { op: "remove_item", page: "/hours", pointer: "/blocks/2/content/items", at: 1 },
  ]);
  assert.ok(result.ok);
  const items = (result.after.get("/hours") as ReturnType<typeof hours>).blocks[2].content as { items: { question: string }[] };
  assert.deepEqual(items.items.map((i) => i.question), ["Q2?", "Q3?"]);
  assert.match(problems([{ op: "insert_item", page: "/hours", pointer: "/blocks/2/content/items", at: 4, value: {} }])[0], /from 1 to 3/);
  assert.match(problems([{ op: "remove_item", page: "/hours", pointer: "/blocks/2/content/items", at: 0 }])[0], /from 1 to 2/);
});

test("block operations keep block identity", () => {
  const result = applyOperations(pagesOf(hours()), [
    { op: "move_block", page: "/hours", from: 3, to: 1 },
    { op: "insert_block", page: "/hours", at: 2, block: { type: "prose", content: { paragraphs: ["New"] } } },
    { op: "remove_block", page: "/hours", block: 4 },
  ]);
  assert.ok(result.ok);
  assert.deepEqual(result.ids.before.get("/hours"), ["/hours#1", "/hours#2", "/hours#3"]);
  assert.deepEqual(result.ids.after.get("/hours"), ["/hours#3", null, "/hours#1"]);
  assert.match(problems([{ op: "remove_block", page: "/hours", block: 4 }])[0], /from 1 to 3/);
  assert.match(problems([{ op: "insert_block", page: "/hours", at: 1, block: { type: "faq", content: {}, extra: 1 } }])[0], /"extra"/);
});

test("move to the same position is a no-op and leaves the page untouched", () => {
  const result = applyOperations(pagesOf(hours()), [{ op: "move_block", page: "/hours", from: 2, to: 2 }]);
  assert.ok(result.ok);
  assert.deepEqual(result.touched, []);
});

test("add_page, archive_page and restore_page", () => {
  const added = { path: "/videos", title: "Videos", description: "d", status: "live", blocks: [] };
  const result = applyOperations(pagesOf(hours()), [
    { op: "add_page", page: added },
    { op: "archive_page", page: "/hours" },
  ]);
  assert.ok(result.ok);
  assert.deepEqual(result.touched, ["/hours", "/videos"]);
  assert.equal(result.ids.before.has("/videos"), false);
  assert.equal((result.after.get("/hours") as { status: string }).status, "archived");

  assert.match(problems([{ op: "add_page", page: added }, { op: "add_page", page: added }])[0], /Operation 2 \(add_page\): \/videos already exists; use restore_page/);
  assert.match(problems([{ op: "add_page", page: hours() }])[0], /\/hours already exists/);
  assert.match(problems([{ op: "restore_page", page: "/hours" }])[0], /already live/);
  assert.match(problems([{ op: "archive_page", page: "/hours" }, { op: "archive_page", page: "/hours" }])[0], /already archived/);
  assert.match(problems([{ op: "archive_page", page: "/nope" }])[0], /there is no page \/nope/);
});

test("unknown operations, extra keys, non-lists and the limits are refused", () => {
  assert.match(problems([{ op: "frobnicate", page: "/hours" }])[0], /^Operation 1 \(frobnicate\): unknown operation/);
  assert.match(problems([{ op: "set", page: "/hours", pointer: "/title", value: "x", force: true }])[0], /"force" is not a field/);
  assert.match(problems([{ op: "set", page: "/hours", pointer: "/title" }])[0], /"value" is missing/);
  assert.match(problems("nope")[0], /must be a list/);
  assert.match(problems(Array.from({ length: 41 }, () => ({ op: "set", page: "/hours", pointer: "/title", value: "x" })))[0], /41/);
  const six = Array.from({ length: 6 }, (_, i) => ({ path: `/p${i}`, title: "t", description: "d", status: "live", blocks: [] }));
  assert.match(problems(six.map((page) => ({ op: "archive_page", page: page.path })), pagesOf(...six))[0], /Too many pages: 6/);
  assert.equal(applyOperations(pagesOf(...six), six.slice(0, 5).map((page) => ({ op: "archive_page", page: page.path }))).ok, true);
});
