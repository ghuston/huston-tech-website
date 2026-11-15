// HOOK 4: scan-src (runs after Claude's Edit and Write tools, for files in src/).
//
// WHAT IT DOES, and why:
//   WARNS ONLY (never blocks). After a file under src/ changes, it scans that
//   file and reports likely design-rule slips so they get fixed early. The rules
//   follow docs/STYLE-GUIDE.md (design v3):
//     1. hard-coded colors (#hex, rgb(), rgba(), hsl()) in TS/TSX. CSS files are
//        exempt: v3 keeps its tokens, glows, door gradients, fading dividers and
//        the scoped client palette of the hero card in CSS.
//     2. `rounded-` and `shadow-` classes other than the v3 token classes
//        (rounded-field/btn/card/door/panel/pill, shadow-card/lift/chip/door).
//     3. v3 bans (STYLE-GUIDE.md §13 and the §14 grep): uppercase labels, mono
//        fonts, backdrop/blur filters, blend modes, the retired v2 colors and fonts.
//     4. dangerouslySetInnerHTML anywhere except components/ui/JsonLd.tsx
//     5. copy written directly in JSX (copy belongs in src/content/)
//   It is a heuristic nudge: it can miss things and can flag harmless ones.
//   It also flags v1 code that the Phase 6 rebuild has not replaced yet.
//
// If this script itself crashes it says so in a warning (it cannot block, but
// it must not fail silently either).

import { readFileSync } from "node:fs";
import path from "node:path";
import { projectDirOf, readInput } from "./lib.mjs";

const MAX_PER_RULE = 5;
const COLOR_EXEMPT = ["src/app/og.png/route.tsx"];
const TOKEN_CLASS = /^(?:rounded-(?:field|btn|card|door|panel|pill|none)|shadow-(?:card|lift|chip|door|none))$/;
const BANNED = [
  [/\buppercase\b/g, "uppercase label (v3: sentence case)"],
  [/\bfont-mono\b|monospace/g, "mono font (v3 has no mono face)"],
  [/backdrop-[\w-]+/g, "backdrop filter"],
  [/\bblur-[\w[\]-]+|filter:\s*blur/g, "blur filter"],
  [/mix-blend[\w-]*/g, "blend mode"],
  [/F6F4EE|E8E9E0|C0C2B4/gi, "retired v2 color"],
  [/Inter[ _]Tight|IBM[ _]Plex|Plex[ _]Mono|JetBrains/g, "retired font"],
];

const wordCount = (text) => text.trim().split(/\s+/).length;
const looksLikeCopy = (text) => /[A-Za-z]{2}/.test(text) && wordCount(text) >= 3;

function scan(rel, text) {
  const isCss = rel.endsWith(".css");
  const isCode = /\.(tsx?|jsx?)$/.test(rel);
  const isTsx = rel.endsWith(".tsx") && (rel.startsWith("src/app/") || rel.startsWith("src/components/"));
  const findings = [];
  const add = (rule, line, detail) => findings.push({ rule, line, detail });

  text.split("\n").forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();

    if (!isCss && !COLOR_EXEMPT.includes(rel)) {
      for (const m of raw.matchAll(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g)) {
        const before = raw.slice(0, m.index);
        if (/(href=["']|url\(|to=["'])$/.test(before)) continue;
        add("hard-coded color", line, m[0]);
      }
      for (const m of raw.matchAll(/\b(?:rgba?|hsla?)\(/g)) add("hard-coded color", line, m[0]);
    }

    if (isCode) {
      for (const m of raw.matchAll(/(?<![\w-])(?:rounded|shadow)-[\w[\]/.%-]+/g)) {
        if (!TOKEN_CLASS.test(m[0])) add("off-token rounded-/shadow- class", line, m[0]);
      }
    }

    for (const [pattern, rule] of BANNED) {
      for (const m of raw.matchAll(pattern)) add(`v3 ban: ${rule}`, line, m[0]);
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
      lines.push("Use the v3 tokens (docs/STYLE-GUIDE.md), keep colors in CSS and copy in src/content/, and see AGENTS.md.");
      report(lines.join("\n"));
    }
  }
} catch (error) {
  report(`Warning: the scan-src hook crashed (${error.message}), so this file was NOT scanned. Fix .claude/hooks/scan-src.mjs.`);
}
