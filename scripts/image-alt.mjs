// Alt text check for client changes: every image a change adds or changes under public/images/ must be used somewhere in
// src/ with real alt text written out next to it, so a screen reader says what the picture shows. Reads the source files
// with the TypeScript parser (already a dev dependency), so spacing, quotes and line breaks do not matter. Nothing is run.
// Used by scripts/check-change-scope.mjs; explanation in docs/CHANGE-SCOPE.md.
//
// A "use" is a string that is exactly the image's URL, found in one of two shapes:
//   - JSX:    <img src="/images/team/sam.jpg" alt="Sam at the front desk" />   (img, Image or any component)
//   - data:   { src: "/images/team/sam.jpg", alt: "Sam at the front desk" }   (any key may hold the path; the key must be `alt`)
//             Page files (.json) are read the same way: { "src": "...", "alt": "..." } is a use with alt text.
// The alt text must be written out as text (a string, a template without ${}, or two strings joined with +), because a
// variable or a spread cannot be checked. Empty, generic ("photo"), file-name and [[placeholder]] alt text is refused.
import ts from "typescript";
import { rules as defaultRules } from "./change-scope-rules.mjs";

const isText = (node) => ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
const WRAPPERS = (node) => ts.isParenthesizedExpression(node) || ts.isJsxExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isNonNullExpression(node);
/** True when `parent` only passes `node` through (brackets, {}, `as`, or one branch of a ?: choice), so the use is really the parent's. */
const passesThrough = (node, parent) => WRAPPERS(parent) || (ts.isConditionalExpression(parent) && (parent.whenTrue === node || parent.whenFalse === node));
const nameOf = (name) => (ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined);

/** The text of an expression written out as plain text, or undefined when it is anything else (a variable, a call, ${}...). */
function plainText(node) {
  if (!node) return undefined;
  if (isText(node)) return node.text;
  if (WRAPPERS(node)) return node.expression ? plainText(node.expression) : undefined;
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = plainText(node.left);
    const right = plainText(node.right);
    return left === undefined || right === undefined ? undefined : left + right;
  }
  return undefined;
}

/** Lower case, with HTML entities (&nbsp;), invisible characters and punctuation taken out, and spaces collapsed. */
const normalise = (text) =>
  text
    .replace(/&(?:#x?[0-9a-f]+|[a-z]+);/gi, " ")
    .replace(/[​-‏⁠­﻿]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const GENERIC_PHRASE = /^(?:images?|photos?|pictures?|photographs?|graphics?|icons?|logos?)(?: of)?$/;
const CAMERA_NAME = /^(?:img|dsc|dscn|dscf|pxl|image|photo|pic|picture|screenshot) ?\d[\d ]*$/;

/** Why this alt text is not acceptable, or null. */
function altTextProblem(text, rules) {
  const trimmed = text.trim();
  const words = normalise(text);
  if (trimmed === "" || (words === "" && /^[\s​-‏⁠­﻿]*$/.test(trimmed))) return "the alt text is empty";
  if (trimmed.includes("[[")) return "the alt text is still a [[placeholder]]";
  const core = words.replace(/^(?:a|an|the) /, "");
  if (rules.genericAltText.includes(words) || rules.genericAltText.includes(core) || GENERIC_PHRASE.test(core)) return `the alt text "${trimmed}" says nothing about the picture`;
  if (CAMERA_NAME.test(words)) return `the alt text "${trimmed}" looks like a camera file name, not a description`;
  if (!/\s/.test(trimmed) && /\.(jpe?g|png|webp)$/i.test(trimmed)) return `the alt text "${trimmed}" is a file name, not a description`;
  if (words.replace(/ /g, "").length < 3) return `the alt text "${trimmed}" is too short to describe a picture`;
  return null;
}

/** True when an attribute hides its element from screen readers: aria-hidden (anything but "false") or a presentation role. */
function hidesFromScreenReaders(attributes) {
  return attributes.some((attribute) => {
    if (!ts.isJsxAttribute(attribute)) return false;
    const name = attribute.name.getText();
    const value = attribute.initializer ? plainText(attribute.initializer) ?? attribute.initializer.getText().replace(/[{}\s]/g, "") : "true";
    if (name === "aria-hidden") return value !== "false";
    return name === "role" && ["presentation", "none"].includes(String(value).trim());
  });
}

/** Finds the alt value next to the node that holds the image URL. Returns { found: true, node } or { found: false, why }. */
function altBeside(literal) {
  let node = literal;
  while (node.parent && passesThrough(node, node.parent)) node = node.parent;
  const parent = node.parent;
  if (parent && ts.isJsxAttribute(parent)) {
    const attributes = parent.parent.properties;
    if (attributes.some((a) => ts.isJsxSpreadAttribute(a))) return { found: false, why: "the element spreads props, so its alt text cannot be checked. Write src and alt out as plain attributes" };
    if (hidesFromScreenReaders(attributes)) return { found: false, why: "the element is hidden from screen readers (aria-hidden or a presentation role), so its alt text is never read" };
    const alt = attributes.find((a) => ts.isJsxAttribute(a) && a.name.getText() === "alt");
    return alt ? { found: true, node: alt.initializer } : { found: false, why: "there is no alt attribute on this element" };
  }
  if (parent && ts.isPropertyAssignment(parent) && parent.initializer === node) {
    if (parent.parent.properties.some((p) => ts.isSpreadAssignment(p))) return { found: false, why: "the object spreads another object, which could replace the alt text. Write src and alt out directly" };
    const alt = parent.parent.properties.find((p) => ts.isPropertyAssignment(p) && nameOf(p.name) === "alt");
    return alt ? { found: true, node: alt.initializer } : { found: false, why: 'there is no alt next to it. Write it as { src: "...", alt: "what the picture shows" }' };
  }
  return { found: false, why: 'it is used on its own. Write it as { src: "...", alt: "what the picture shows" } or <img src alt>' };
}

function* literalsEqualTo(url, tree) {
  const stack = [tree];
  while (stack.length > 0) {
    const node = stack.pop();
    if (isText(node) && node.text === url) yield node;
    ts.forEachChild(node, (child) => void stack.push(child));
  }
}

/**
 * `url` is the image's address on the site (such as "/images/team/sam.jpg"); `sources` is [{ path, content }] of the files
 * that mention it. Returns { problems: [text], alts: [text] }: the problems are plain English and name the file, and the
 * alts are the accepted alt texts, for the change report. An image that no file uses is a problem too.
 */
export function imageAltCheck(url, sources, rules = defaultRules) {
  const problems = [];
  const alts = [];
  let uses = 0;
  for (const { path, content } of sources) {
    const kind = /\.json$/.test(path) ? ts.ScriptKind.JSON : /\.tsx$/.test(path) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const tree = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, kind);
    for (const literal of literalsEqualTo(url, tree)) {
      uses += 1;
      const beside = altBeside(literal);
      if (!beside.found) {
        problems.push(`${path}: ${url} has no alt text (${beside.why})`);
        continue;
      }
      const text = plainText(beside.node);
      if (text === undefined) {
        problems.push(`${path}: the alt text for ${url} is not plain text (a variable or an expression cannot be checked). Write the words out`);
        continue;
      }
      const bad = altTextProblem(text, rules);
      if (bad) problems.push(`${path}: ${url}: ${bad}`);
      else alts.push(text.trim());
    }
  }
  if (uses === 0) problems.push(`${url} is not used by any page or content file, so it has no alt text. Use it with alt text, or leave the image out`);
  return { problems, alts };
}
