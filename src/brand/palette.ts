import { parseHex } from "./color.ts";
import { COLOR_TOKENS, type Palette } from "./contrast-pairs.ts";

const kebab = (key: string) => key.replace(/([a-z0-9])([A-Z0-9])/g, "$1-$2").toLowerCase();

/** The generated palette file: the 13 `--hl-*` tokens, nothing else. Only validated `#rrggbb` values reach it. */
export function paletteCss(colors: Palette): string {
  const lines = COLOR_TOKENS.map((token) => {
    const value: unknown = colors[token];
    if (typeof value !== "string" || parseHex(value) === null) throw new Error(`The color "${token}" must be #rrggbb, not ${JSON.stringify(value)}.`);
    return `  --hl-${kebab(token)}: ${value.toLowerCase()};`;
  });
  return `/* Generated from src/content/brand.json by \`npm run sync:config\`. Do not edit by hand. */
:root {
${lines.join("\n")}
}
`;
}
