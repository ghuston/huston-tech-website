export type TextToken =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "placeholder"; value: string };

const TOKEN_PATTERN = /(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g;

/**
 * A value used outside visible text (a `tel:` link, a vCard field), with the `[[ ]]` markers removed. The source string
 * keeps them, so `npm run check:placeholders` still fails until the real value is set.
 */
export function unwrapPlaceholder(value: string): string {
  return value.replace(/^\[\[|\]\]$/g, "");
}

/**
 * Splits content strings into plain text, **bold** runs and [[placeholder]] markers.
 * Output is rendered as React text nodes only; never as HTML.
 */
export function tokenize(input: string): TextToken[] {
  return input
    .split(TOKEN_PATTERN)
    .filter((part) => part.length > 0)
    .map((part): TextToken => {
      if (part.startsWith("**") && part.endsWith("**")) return { kind: "bold", value: part.slice(2, -2) };
      if (part.startsWith("[[") && part.endsWith("]]")) return { kind: "placeholder", value: part };
      return { kind: "text", value: part };
    });
}
