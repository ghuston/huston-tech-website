// HOOK 4: scan-src (runs after Claude's Edit and Write tools, for files in src/).
//
// WHAT IT DOES, and why:
//   WARNS ONLY (never blocks). After a file under src/ changes, it scans that
//   file and reports likely design-rule slips so they get fixed early:
//     1. hard-coded colors (#hex, rgb(), rgba(), hsl()) instead of design tokens
//     2. `rounded-` and `shadow-` Tailwind classes (design v2 moves away from them)
//     3. dangerouslySetInnerHTML anywhere except components/ui/JsonLd.tsx
//     4. copy written directly in JSX (copy belongs in src/content/)
//   It is a heuristic nudge: it can miss things and can flag harmless ones.
//   It stays warn-only while the code is still on the old v1 design.
//
// If this script itself crashes it says so in a warning (it cannot block, but
// it must not fail silently either).

import { readFileSync } from "node:fs";
import path from "node:path";
import { projectDirOf, readInput } from "./lib.mjs";

const MAX_PER_RULE = 5;
const COLOR_EXEMPT = ["src/app/globals.css", "src/app/og.png/route.tsx"];

const wordCount = (text) => text.trim().split(/\s+/).length;
const looksLikeCopy = (text) => /[A-Za-z]{2}/.test(text) && wordCount(text) >= 3;

function scan(rel, text) {
  const isCode = /\.(tsx?|jsx?)$/.test(rel);
  const isTsx = rel.endsWith(".tsx") && (rel.startsWith("src/app/") || rel.startsWith("src/components/"));
  const findings = [];
  const add = (rule, line, detail) => findings.push({ rule, line, detail });

  text.split("\n").forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();

    if (!COLOR_EXEMPT.includes(rel)) {
      for (const m of raw.matchAll(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g)) {
        const before = raw.slice(0, m.index);
        if (/(href=["']|url\(|to=["'])$/.test(before)) continue;
        add("hard-coded color", line, m[0]);
      }
      for (const m of raw.matchAll(/\b(?:rgba?|hsla?)\(/g)) add("hard-coded color", line, m[0]);
    }

    if (isCode) {
      for (const m of raw.matchAll(/(?<![\w-])(?:rounded|shadow)-[\w[\]/.%-]+/g)) {
        add("rounded-/shadow- class", line, m[0]);
      }
    }

    if (/dangerouslySetInnerHTML/.test(raw) && !rel.endsWith("components/ui/JsonLd.tsx")) {
      add("dangerouslySetInnerHTML outside JsonLd.tsx", line, "dangerouslySetInnerHTML");
    }

    if (isTsx && !/^(\/\/|\/\*|\*)/.test(trimmed)) {
      for (const m of raw.matchAll(/>([^<>{}\n]{6,})</g)) {
        if (looksLikeCopy(m[1])) add("copy written in JSX", line, m[1].trim().slice(0, 50));
      }
      for (const m of raw.matchAll(/\b(?:alt|title|aria-label|placeholder)="([^"{]+)"/g)) {
        if (looksLikeCopy(m[1])) add("copy written in JSX", line, m[1].slice(0, 50));
      }
      if (!/[{}=;()<>/\\:"`]/.test(trimmed) && /^[A-Za-z]/.test(trimmed) && looksLikeCopy(trimmed)) {
        add("copy written in JSX", line, trimmed.slice(0, 50));
      }
    }
  });
  return findings;
}

function report(message) {
  process.stdout.write(
    JSON.stringify({
      systemMessage: message,
      hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: message },
    }),
  );
}

try {
  const input = readInput();
  const projectDir = projectDirOf(input);
  const abs = path.resolve(input.cwd ?? projectDir, input.tool_input?.file_path ?? "");
  const rel = path.relative(projectDir, abs).split(path.sep).join("/");
  if (rel.startsWith("src/") && /\.(tsx?|jsx?|css)$/.test(rel)) {
    const findings = scan(rel, readFileSync(abs, "utf8"));
    if (findings.length) {
      const byRule = new Map();
      for (const f of findings) byRule.set(f.rule, [...(byRule.get(f.rule) ?? []), f]);
      const lines = [`Heads up (warning only, nothing was blocked): ${rel}`];
      for (const [rule, items] of byRule) {
        const shown = items.slice(0, MAX_PER_RULE).map((f) => `line ${f.line}: ${f.detail}`);
        const more = items.length > MAX_PER_RULE ? ` (+${items.length - MAX_PER_RULE} more)` : "";
        lines.push(`- ${rule}: ${shown.join("; ")}${more}`);
      }
      lines.push("Use design tokens from globals.css, keep copy in src/content/, and see AGENTS.md.");
      report(lines.join("\n"));
    }
  }
} catch (error) {
  report(`Warning: the scan-src hook crashed (${error.message}), so this file was NOT scanned. Fix .claude/hooks/scan-src.mjs.`);
}
