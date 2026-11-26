import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isProductionBuild } from "./build-target.ts";

describe("isProductionBuild", () => {
  it("is true on the production branch", () => {
    assert.equal(isProductionBuild({ WORKERS_CI_BRANCH: "main" }, "main"), true);
  });
  it("is true for a Workers Builds build that cannot name its branch", () => {
    assert.equal(isProductionBuild({ WORKERS_CI: "1" }, "main"), true);
    assert.equal(isProductionBuild({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "" }, "main"), true);
  });
  it("is false on another branch, locally and in GitHub CI", () => {
    assert.equal(isProductionBuild({ WORKERS_CI: "1", WORKERS_CI_BRANCH: "feat/x" }, "main"), false);
    assert.equal(isProductionBuild({ WORKERS_CI_BRANCH: "change/owner-1" }, "main"), false);
    assert.equal(isProductionBuild({}, "main"), false);
    assert.equal(isProductionBuild({ GITHUB_SHA: "abc" }, "main"), false);
  });
  it("does not match a named branch when the production branch is empty", () => {
    assert.equal(isProductionBuild({ WORKERS_CI_BRANCH: "main" }, ""), false);
  });
});
