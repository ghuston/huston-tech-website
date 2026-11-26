/**
 * A short, stable id for an owner: the first 16 hex characters of the SHA-256 of the trimmed, lower-cased email. Used as the
 * rate-limit key and the OAuth user id, so the email itself never becomes a key or appears in KV key names.
 */
export async function ownerKey(email: string): Promise<string> {
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest.slice(0, 8), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
