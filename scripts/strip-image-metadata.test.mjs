// Tests for scripts/strip-image-metadata.mjs (`npm run strip:images`). Each test builds a throwaway git repository in the
// temp folder: no network, and the real project is never touched.
//   node --test scripts/strip-image-metadata.test.mjs   (or `npm run test:scripts`)
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { main as checkScope, gitIn } from "./check-change-scope.mjs";
import { SECRET, app1Exif, app1Xmp, comment, jpeg, listJpegSegments, png, pngText, webp } from "./image-fixtures.mjs";
import { main } from "./strip-image-metadata.mjs";

const COMMIT = ["-c", "user.email=t@example.com", "-c", "user.name=Test", "-c", "commit.gpgsign=false", "commit", "-q", "-m"];
const dirtyJpeg = () => jpeg([app1Exif({ orientation: 0 }), app1Xmp(), comment()]);
const leaks = (bytes) => Object.values(SECRET).filter((text) => bytes.includes(Buffer.from(text)));

/** A repo on `main` holding one already-dirty image (so "images already in the base" can be told apart), then a change/test branch. */
function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), "strip-repo-"));
  const git = gitIn(dir);
  const write = (path, content) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  };
  const read = (path) => readFileSync(join(dir, path));
  git(["init", "-q", "-b", "main"]);
  write("src/content/home.ts", 'export const title = "Old";\n');
  write("public/images/base.jpg", dirtyJpeg());
  git(["add", "-A"]);
  git([...COMMIT, "base"]);
  git(["checkout", "-q", "-b", "change/test"]);
  return { dir, git, write, read };
}

/** Runs the command in a fresh repo after `setup`, and removes the repo afterwards. */
async function inRepo(setup, argv = ["--base", "main"], after = () => {}) {
  const repo = makeRepo();
  try {
    setup(repo);
    const lines = [];
    const code = main({ argv, git: repo.git, out: (text) => lines.push(text) });
    after(repo, code, lines.join("\n"));
    return { code, text: lines.join("\n") };
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
}

test("it cleans new images however they are in git: untracked, staged and committed on the branch", async () => {
  await inRepo(
    ({ write, git }) => {
      write("public/images/committed.jpg", dirtyJpeg());
      git(["add", "-A"]);
      git([...COMMIT, "committed"]);
      write("public/images/staged.png", png([pngText("Author", SECRET.comment)]));
      git(["add", "-A"]);
      write("public/images/untracked.webp", webp({ exif: true, xmp: true }));
      write("public/images/team/nested.jpg", dirtyJpeg());
    },
    ["--base", "main"],
    ({ read }, code, text) => {
      assert.equal(code, 0, text);
      for (const path of ["committed.jpg", "staged.png", "untracked.webp", "team/nested.jpg"]) {
        assert.deepEqual(leaks(read(`public/images/${path}`)), [], path);
        assert.match(text, new RegExp(`public/images/${path.replace(".", "\\.")}`));
      }
      assert.match(text, /4 images checked: 4 cleaned/);
      assert.ok(!text.includes(SECRET.gps), "the output never prints the hidden data itself");
    },
  );
});

test("an image that is already clean is not rewritten", async () => {
  const clean = jpeg();
  await inRepo(
    ({ write }) => write("public/images/clean.jpg", clean),
    ["--base", "main"],
    ({ read }, code, text) => {
      assert.equal(code, 0);
      assert.ok(read("public/images/clean.jpg").equals(clean));
      assert.match(text, /1 image checked: 0 cleaned, 1 already clean/);
    },
  );
});

test("images that came from the base branch are left alone unless --all is given", async () => {
  await inRepo(
    ({ write }) => write("public/images/new.jpg", dirtyJpeg()),
    ["--base", "main"],
    ({ read }) => {
      assert.ok(leaks(read("public/images/base.jpg")).length > 0, "base.jpg was not touched");
      assert.deepEqual(leaks(read("public/images/new.jpg")), []);
    },
  );
  await inRepo(
    ({ write }) => write("public/images/new.jpg", dirtyJpeg()),
    ["--base", "main", "--all"],
    ({ read }, code) => {
      assert.equal(code, 0);
      assert.deepEqual(leaks(read("public/images/base.jpg")), []);
      assert.deepEqual(leaks(read("public/images/new.jpg")), []);
    },
  );
});

test("--check reports what would be removed, changes nothing, and exits 1; a clean branch exits 0", async () => {
  const dirty = dirtyJpeg();
  await inRepo(
    ({ write }) => write("public/images/new.jpg", dirty),
    ["--base", "main", "--check"],
    ({ read }, code, text) => {
      assert.equal(code, 1);
      assert.ok(read("public/images/new.jpg").equals(dirty));
      assert.match(text, /public\/images\/new\.jpg/);
      assert.match(text, /EXIF/);
      assert.match(text, /npm run strip:images/);
    },
  );
  const clean = await inRepo(({ write }) => write("public/images/new.jpg", jpeg()), ["--base", "main", "--check"]);
  assert.equal(clean.code, 0, clean.text);
});

test("a rotated phone photo keeps its rotation flag and the report says so", async () => {
  await inRepo(
    ({ write }) => write("public/images/phone.jpg", jpeg([app1Exif({ orientation: 6 })])),
    ["--base", "main"],
    ({ read }, code, text) => {
      assert.equal(code, 0);
      const exif = listJpegSegments(read("public/images/phone.jpg")).filter((s) => s.marker === 0xe1);
      assert.equal(exif.length, 1);
      assert.deepEqual(leaks(read("public/images/phone.jpg")), []);
      assert.match(text, /rotation flag/);
    },
  );
});

test("files that are not jpg, png or webp, and symbolic links, are skipped and never written through", async () => {
  const outside = dirtyJpeg();
  await inRepo(
    ({ dir, write }) => {
      write("public/images/vector.svg", "<svg/>");
      write("public/images/notes.txt", "hello");
      write("outside.jpg", outside);
      symlinkSync(join(dir, "outside.jpg"), join(dir, "public/images/link.jpg"));
    },
    ["--base", "main"],
    ({ read }, code, text) => {
      assert.equal(code, 0, text);
      assert.ok(read("outside.jpg").equals(outside), "the file the link points at is untouched");
      assert.match(text, /vector\.svg.*skipped/);
      assert.match(text, /link\.jpg.*skipped/);
      assert.match(text, /3 skipped/);
    },
  );
});

test("a folder that has been swapped for a link to somewhere else is never written through", async () => {
  const outside = dirtyJpeg();
  await inRepo(
    ({ dir, write, git }) => {
      write("public/images/a/x.jpg", dirtyJpeg());
      git(["add", "-A"]);
      git([...COMMIT, "folder"]);
      rmSync(join(dir, "public/images/a"), { recursive: true });
      write("elsewhere/x.jpg", outside);
      symlinkSync(join(dir, "elsewhere"), join(dir, "public/images/a"));
    },
    ["--base", "main", "--all"],
    ({ read }, code, text) => {
      assert.equal(code, 0, text);
      assert.ok(read("elsewhere/x.jpg").equals(outside), "the file outside the images folder is untouched");
      assert.match(text, /a\/x\.jpg.*skipped/);
    },
  );
});

test("a damaged image is reported with the reason, left exactly as it was, and the others are still cleaned", async () => {
  const damaged = jpeg().subarray(0, 40);
  await inRepo(
    ({ write }) => {
      write("public/images/broken.jpg", damaged);
      write("public/images/good.jpg", dirtyJpeg());
    },
    ["--base", "main"],
    ({ read }, code, text) => {
      assert.equal(code, 1);
      assert.ok(read("public/images/broken.jpg").equals(damaged));
      assert.deepEqual(leaks(read("public/images/good.jpg")), []);
      assert.match(text, /broken\.jpg.*could not be read/);
      assert.match(text, /1 could not be read/);
    },
  );
});

test("--all skips an image that git lists but that is missing from the folder, instead of crashing", async () => {
  const { code, text } = await inRepo(({ dir }) => rmSync(join(dir, "public/images/base.jpg")), ["--base", "main", "--all"]);
  assert.equal(code, 0, text);
  assert.match(text, /base\.jpg.*skipped \(.*missing/);
});

test("a branch with no new images says so and exits 0", async () => {
  const { code, text } = await inRepo(({ write }) => write("src/content/home.ts", 'export const title = "New";\n'));
  assert.equal(code, 0);
  assert.match(text, /No new or changed images/);
});

test("bad options and an unknown base branch exit 2 without changing anything", async () => {
  const unknown = await inRepo(() => {}, ["--nope"]);
  assert.equal(unknown.code, 2);
  assert.match(unknown.text, /--nope/);
  const noValue = await inRepo(() => {}, ["--base"]);
  assert.equal(noValue.code, 2);
  const option = await inRepo(() => {}, ["--base", "--all"]);
  assert.equal(option.code, 2);
  const missingBase = await inRepo(() => {}, ["--base", "no-such-branch"]);
  assert.equal(missingBase.code, 2);
  assert.match(missingBase.text, /no-such-branch/);
});

test("after strip:images, the change scope check passes for the same branch", async () => {
  await inRepo(
    ({ write, git }) => {
      write("public/images/new.jpg", dirtyJpeg());
      write("src/content/home.ts", 'export const title = "Old";\nexport const hero = { src: "/images/new.jpg", alt: "The front desk at opening time" };\n');
      git(["add", "-A"]);
      git([...COMMIT, "change"]);
    },
    ["--base", "main"],
    ({ git }, code) => {
      assert.equal(code, 0);
      const before = [];
      assert.equal(checkScope({ argv: ["--base", "main", "--head", "HEAD"], env: {}, git, out: (t) => before.push(t) }), 1, "the committed image still has its metadata");
      assert.match(before.join("\n"), /npm run strip:images/);
      git(["add", "-A"]);
      git([...COMMIT, "strip"]);
      const after = [];
      assert.equal(checkScope({ argv: ["--base", "main", "--head", "HEAD"], env: {}, git, out: (t) => after.push(t) }), 0, after.join("\n"));
    },
  );
});
