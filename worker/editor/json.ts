/** Small shared checks for untrusted JSON values. */

export type Json = Record<string, unknown>;

export const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);

/** The value when it is a string, else "". */
export const str = (value: unknown): string => (typeof value === "string" ? value : "");
