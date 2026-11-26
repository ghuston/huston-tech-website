/**
 * True for exactly "https://host" (a non-default port is fine): no path, query, fragment or credentials, no trailing slash.
 * It must be written the way `URL` normalises it (lowercase host, no ":443"). Import-free on purpose: the Worker
 * (pipeline.ts) and the config check (scripts/config-rules.mjs) both use this one definition, so they cannot drift apart.
 */
export function isHttpsOrigin(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "" && value === url.origin;
  } catch {
    return false;
  }
}
