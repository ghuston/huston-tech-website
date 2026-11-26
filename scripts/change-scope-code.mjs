// Parser-based check for the .ts files a client change may touch. A content module runs at build time, so "it only
// changes text" is not enough: the file must BE plain data. Uses the TypeScript parser, which is already a dev dependency;
// nothing is executed. This is best-effort static analysis, one layer among several (CodeQL, the required checks and the
// preview are the others); see docs/CHANGE-SCOPE.md. Page files are JSON and are judged by the content check instead.
import ts from "typescript";
import { rules as defaultRules } from "./change-scope-rules.mjs";

const { SyntaxKind: K } = ts;
const kindName = (node) => ts.SyntaxKind[node.kind];

/** `import type { A } from "x"` and `import { type A } from "x"`: erased at build time, so they run nothing. */
function isTypeOnlyImport(node) {
  const clause = node.importClause;
  if (!clause) return false;
  if (clause.isTypeOnly) return true;
  const bindings = clause.namedBindings;
  return !clause.name && !!bindings && ts.isNamedImports(bindings) && bindings.elements.length > 0 && bindings.elements.every((e) => e.isTypeOnly);
}

const specifierOf = (node) => (ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : "(not a string)");

// ---- content modules: plain data only ---------------------------------------------------------------------------

function contentImportAllowed(spec, rules) {
  const match = /^(?:\.\/|@\/content\/)([A-Za-z0-9_-]+)$/.exec(spec);
  return !!match && !rules.contentWiring.includes(`src/content/${match[1]}.ts`);
}

function dataProblem(node, rules) {
  switch (node.kind) {
    case K.StringLiteral:
    case K.NoSubstitutionTemplateLiteral:
    case K.NumericLiteral:
    case K.BigIntLiteral:
    case K.TrueKeyword:
    case K.FalseKeyword:
    case K.NullKeyword:
      return null;
    case K.Identifier:
      return rules.denyIdentifiers.includes(node.text) ? `uses ${node.text}` : null;
    case K.ArrayLiteralExpression:
      return firstProblem(node.elements, (n) => dataProblem(n, rules));
    case K.SpreadElement:
    case K.AsExpression:
    case K.SatisfiesExpression:
    case K.ParenthesizedExpression:
    case K.TypeAssertionExpression:
    case K.NonNullExpression:
      return dataProblem(node.expression, rules);
    case K.PrefixUnaryExpression:
      return dataProblem(node.operand, rules);
    case K.PropertyAccessExpression:
      return rules.denyProperties.includes(node.name.text) || rules.denyMethodReads.includes(node.name.text) ? `uses .${node.name.text}` : dataProblem(node.expression, rules);
    case K.BinaryExpression:
      return node.operatorToken.kind === K.PlusToken ? firstProblem([node.left, node.right], (n) => dataProblem(n, rules)) : `uses an operator (${kindName(node.operatorToken)})`;
    case K.ObjectLiteralExpression:
      return firstProblem(node.properties, (prop) => {
        if (ts.isShorthandPropertyAssignment(prop)) return dataProblem(prop.name, rules);
        if (ts.isSpreadAssignment(prop)) return dataProblem(prop.expression, rules);
        if (!ts.isPropertyAssignment(prop)) return `has a method or accessor (${kindName(prop)})`;
        return keyProblem(prop.name, rules) ?? dataProblem(prop.initializer, rules);
      });
    default:
      return `uses ${kindName(node)}, which is code, not data`;
  }
}

/** An object key: a name, string or number, never computed, and never one that reaches the prototype chain or raw HTML. */
function keyProblem(name, rules) {
  if (ts.isComputedPropertyName(name)) return "uses a computed property name";
  const text = ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name) ? name.text : null;
  if (text === null) return `uses a property name of kind ${kindName(name)}`;
  return rules.denyProperties.includes(text) || rules.denyIdentifiers.includes(text) ? `uses the property name ${text}` : null;
}

/** Why the parser found a syntax error, or null. The build uses a different parser, so tolerated errors could be read differently. */
function syntaxProblem(source) {
  return source.parseDiagnostics?.length > 0 ? "has a syntax error" : null;
}

function firstProblem(nodes, check) {
  for (const node of nodes) {
    const problem = check(node);
    if (problem) return problem;
  }
  return null;
}

function contentStatementProblem(statement, rules) {
  if (ts.isEmptyStatement(statement)) return null;
  if (ts.isImportDeclaration(statement)) {
    if (isTypeOnlyImport(statement) || contentImportAllowed(specifierOf(statement), rules)) return null;
    return `imports ${specifierOf(statement)}, which a content file may not import`;
  }
  if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) return null;
  if (ts.isExportDeclaration(statement)) {
    return statement.isTypeOnly || !statement.moduleSpecifier ? null : `re-exports from ${specifierOf(statement)}`;
  }
  if (ts.isVariableStatement(statement)) {
    const { flags } = statement.declarationList;
    if (!(flags & ts.NodeFlags.Const) || flags & ts.NodeFlags.Using) return "declares a variable that is not a plain const";
    return firstProblem(statement.declarationList.declarations, (d) => {
      if (!ts.isIdentifier(d.name)) return "takes a value apart (destructuring)";
      return d.initializer ? dataProblem(d.initializer, rules) : null;
    });
  }
  return `contains ${kindName(statement)}, which is code, not data`;
}

/** Why `text` is not a plain-data content module, or null when it is. */
export function contentModuleProblem(text, rules = defaultRules) {
  if (text.includes("\0")) return "contains a binary (NUL) byte";
  const source = ts.createSourceFile("module.ts", text, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  return syntaxProblem(source) ?? firstProblem(source.statements, (s) => contentStatementProblem(s, rules));
}
