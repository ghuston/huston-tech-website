import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { showDrafts } from "./drafts.ts";

describe("showDrafts", () => {
  it("hides drafts on the production branch and when the branch is unknown on Workers Builds", () => {
    assert.equal(showDrafts({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" }, "main"), false);
    assert.equal(showDrafts({ WORKERS_CI: "1" }, "main"), false);
  });
  it("shows drafts on previews and on a local machine", () => {
    assert.equal(showDrafts({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "feat/x" }, "main"), true);
    assert.equal(showDrafts({}, "main"), true);
  });
});
