import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { LoadedItem } from "../collections/schema.ts";
import { findItem } from "../collections/pick.ts";
import { pickItems } from "./collections.ts";
import { showDrafts } from "./drafts.ts";

const item = (slug: string, status: LoadedItem["status"], date: string): LoadedItem => ({ kind: "posts", slug, status, data: { date } });
const all: LoadedItem[] = [item("old", "live", "2026-01-01"), item("new", "live", "2026-03-01"), item("wip", "draft", "2026-04-01"), item("gone", "archived", "2026-05-01"), { kind: "team", slug: "t", status: "live", data: { name: "T", order: 1 } }];

describe("pickItems", () => {
  it("in a production build shows live items only, newest first", () => {
    const drafts = showDrafts({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" }, "main");
    assert.deepEqual(pickItems(all, "posts", drafts).map((i) => i.slug), ["new", "old"]);
  });
  it("outside production adds drafts, never archived items", () => {
    const drafts = showDrafts({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "feat/x" }, "main");
    assert.deepEqual(pickItems(all, "posts", drafts).map((i) => i.slug), ["wip", "new", "old"]);
  });
});

describe("findItem", () => {
  it("finds a live item, a draft only when drafts show, and never an archived one", () => {
    assert.equal(findItem(all, "posts", "new", false)?.slug, "new");
    assert.equal(findItem(all, "posts", "wip", false), undefined);
    assert.equal(findItem(all, "posts", "wip", true)?.slug, "wip");
    assert.equal(findItem(all, "posts", "gone", true), undefined);
  });
});
