import type { AnyBlockDefinition, Fields } from "../blocks/schema.ts";
import { validateContent, type Context } from "../blocks/validate.ts";

export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** A real calendar date written YYYY-MM-DD. */
export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * Judges `content` against a small field schema with the same rules as a block's content: plain text (only **bold** and
 * [[placeholder]]), links, lengths and unknown keys. Settings files reuse the block validator through this one door.
 */
export function checkFields(fields: Fields, content: unknown, where: string, ctx: Context): string[] {
  const def: AnyBlockDefinition = {
    type: "settings",
    title: where,
    description: where,
    source: "library",
    fields,
    variants: [],
    placement: { position: "any", maxPerPage: 1, rhythm: "section" },
    motion: { entrance: "default" },
    example: {},
  };
  return validateContent(def, content, where, ctx);
}
