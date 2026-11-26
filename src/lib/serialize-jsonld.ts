/** JSON text for a JSON-LD script. "<" is escaped so the payload can never close the script tag. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
