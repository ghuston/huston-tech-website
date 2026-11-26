/** The headers every Worker answer carries; each endpoint adds its own content type and CSP through `extra`. */
export const BASE_HEADERS: Record<string, string> = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "cross-origin-resource-policy": "same-origin",
};

export function plainText(status: number, text: string, extra: Record<string, string> = {}): Response {
  return new Response(text, { status, headers: { ...BASE_HEADERS, "content-type": "text/plain; charset=utf-8", ...extra } });
}

export function jsonResponse(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...BASE_HEADERS, "content-type": "application/json; charset=utf-8", ...extra } });
}
