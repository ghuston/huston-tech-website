/**
 * The first word of "Your name", for "Hi {firstName}," in the auto-reply and "Got it, thanks {firstName}." on the
 * thanks page. Returns "" unless the word looks like a name (letters and accents, apostrophes and hyphens, one
 * optional final period, at most 40 characters), so the auto-reply can't be used to deliver someone else's text.
 */
export function autoReplyFirstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  return first.length <= 30 && /^[\p{L}\p{M}'’-]+$/u.test(first) ? first : "";
}

export function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  if (first.length === 0 || first.length > 40) return "";
  return /^\p{L}[\p{L}\p{M}'’-]*\.?$/u.test(first) ? first : "";
}
