// Removes hidden camera, location and editing data (EXIF, XMP, IPTC, comments, thumbnails) from the images a client change
// adds or changes under public/images/, in place. Run with `npm run strip:images`, then commit the result.
//
//   node scripts/strip-image-metadata.mjs [--base origin/main] [--all] [--check]
//
// By default it handles the images that differ from the point where the branch split from --base: committed, staged and
// not yet added. --all handles every image under public/images/. --check changes nothing and exits 1 if any image still
// carries hidden data. Only the metadata is cut out; the picture itself is never re-encoded (see scripts/image-metadata.mjs,
// which also says what is kept). Exit codes: 0 done, 1 an image still has data (--check) or could not be read, 2 could not run.
import { lstatSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { rules } from "./change-scope-rules.mjs";
import { realGit, safe } from "./check-change-scope.mjs";
import { stripMetadata } from "./image-metadata.mjs";

export function parseArgs(argv) {
  const args = { base: "origin/main", all: false, check: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--all") args.all = true;
    else if (arg === "--check") args.check = true;
    else if (arg === "--base") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("-")) return { error: "--base needs a branch or commit name, not an option" };
      args.base = value;
      i += 1;
    } else return { error: `Unknown option ${arg}. Options: --base <ref>, --all, --check` };
  }
  return args;
}

const names = (buffer) => String(buffer).split("\0").filter(Boolean);

/** The image paths to handle, relative to the repository root, sorted. */
function listImages({ args, git }) {
  const dir = rules.imageDir;
  const untracked = names(git(["ls-files", "-z", "--others", "--exclude-standard", "--", dir]));
  if (args.all) return [...new Set([...names(git(["ls-files", "-z", "--cached", "--", dir])), ...untracked])].sort();
  const mergeBase = String(git(["merge-base", args.base, "HEAD"])).trim();
  const changed = names(git(["diff", "-z", "--name-only", "--diff-filter=AM", "--no-renames", mergeBase, "--", dir]));
  return [...new Set([...changed, ...untracked])].sort();
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const extensionOf = (path) => {
  const dot = path.lastIndexOf(".");
  return dot > path.lastIndexOf("/") ? path.slice(dot).toLowerCase() : "";
};

/** Returns the exit code. `git` takes an argument array and returns a Buffer, as in check-change-scope.mjs. */
export function main({ argv, git = realGit, out = console.log }) {
  const args = parseArgs(argv);
  if (args.error) {
    out(`Strip images could not run: ${args.error}`);
    return 2;
  }
  let top;
  let paths;
  try {
    top = String(git(["rev-parse", "--show-toplevel"])).trim();
    paths = listImages({ args, git });
  } catch (error) {
    out(`Strip images could not read the git history (is "${safe(args.base)}" a branch or commit that exists?): ${safe(error.stderr?.toString().trim() || error.message)}`);
    return 2;
  }
  if (paths.length === 0) {
    out(`No new or changed images under ${rules.imageDir}, so there is nothing to clean.`);
    return 0;
  }
  const count = { cleaned: 0, clean: 0, skipped: 0, failed: 0 };
  for (const path of paths) {
    const name = safe(path);
    const full = join(top, path);
    const stat = lstatSync(full, { throwIfNoEntry: false });
    if (!stat) {
      count.skipped += 1;
      out(`  ${name}: skipped (git lists it but it is missing from the folder)`);
      continue;
    }
    if (!stat.isFile()) {
      count.skipped += 1;
      out(`  ${name}: skipped (not a regular file, such as a link; the change scope check will refuse it)`);
      continue;
    }
    // lstat only looks at the last part of the path. A folder swapped for a link would send the write somewhere else.
    if (!realpathSync(full).startsWith(join(realpathSync(join(top, rules.imageDir)), sep))) {
      count.skipped += 1;
      out(`  ${name}: skipped (it is reached through a link and is not really inside ${rules.imageDir}; the change scope check will refuse it)`);
      continue;
    }
    if (!Object.hasOwn(rules.imageTypes, extensionOf(path))) {
      count.skipped += 1;
      out(`  ${name}: skipped (not a jpg, png or webp; the change scope check will refuse it)`);
      continue;
    }
    let result;
    try {
      result = stripMetadata(readFileSync(full), extensionOf(path));
    } catch (error) {
      count.failed += 1;
      out(`  ${name}: could not be read, left as it was (${safe(error.message)})`);
      continue;
    }
    if (result.removed.length === 0) {
      count.clean += 1;
      out(`  ${name}: already clean`);
      continue;
    }
    count.cleaned += 1;
    const what = result.removed.map(safe).join("; ");
    if (args.check) out(`  ${name}: has hidden data (${what}). Run \`npm run strip:images\``);
    else {
      writeFileSync(full, result.bytes);
      out(`  ${name}: removed ${what}`);
    }
  }
  const verb = args.check ? "have hidden data" : "cleaned";
  out(`${plural(paths.length, "image")} checked: ${count.cleaned} ${verb}, ${count.clean} already clean, ${count.skipped} skipped, ${count.failed} could not be read.`);
  if (!args.check && count.cleaned > 0) out("The pictures themselves are unchanged. Look at the result, then commit it.");
  return count.failed > 0 || (args.check && count.cleaned > 0) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main({ argv: process.argv.slice(2) });
}
