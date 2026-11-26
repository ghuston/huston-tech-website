import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { readItemFiles, readSettingsFiles } from "./content-files.ts";

const withRoot = (run: (root: string) => void) => {
  const root = mkdtempSync(join(tmpdir(), "content-files-"));
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

describe("readItemFiles", () => {
  it("reads every kind folder, sorted, and carries a parse error", () => {
    withRoot((root) => {
      const posts = join(root, "src/content/collections/posts");
      mkdirSync(posts, { recursive: true });
      mkdirSync(join(root, "src/content/collections/team"), { recursive: true });
      writeFileSync(join(posts, "b.json"), '{"status":"live"}');
      writeFileSync(join(posts, "a.json"), "{nope");
      writeFileSync(join(posts, "notes.txt"), "ignored");
      writeFileSync(join(root, "src/content/collections/team/x.json"), "{}");
      const items = readItemFiles(root);
      assert.deepEqual(items.map((i) => `${i.kind}/${i.slug}`), ["posts/a", "posts/b", "team/x"]);
      assert.match(items[0]?.error ?? "", /not valid JSON/);
      assert.deepEqual(items[1]?.data, { status: "live" });
    });
  });
  it("gives [] when the folder is missing", () => withRoot((root) => assert.deepEqual(readItemFiles(root), [])));
});

describe("readSettingsFiles", () => {
  it("returns data, an error for bad JSON, and undefined data for a missing file", () => {
    withRoot((root) => {
      mkdirSync(join(root, "src/content"), { recursive: true });
      writeFileSync(join(root, "src/content/business.json"), '{"a":1}');
      writeFileSync(join(root, "src/content/brand.json"), "{");
      const result = readSettingsFiles(root);
      assert.deepEqual(result.business, { data: { a: 1 } });
      assert.match(result.brand.error ?? "", /not valid JSON/);
      assert.deepEqual(result.notice, { data: undefined });
    });
  });
});
