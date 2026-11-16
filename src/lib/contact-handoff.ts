/**
 * How the contact form tells /contact/thanks the visitor's first name and whether the automatic reply went out,
 * without putting anything personal in the URL: sessionStorage, which stays in this browser tab and clears when the
 * tab closes. Storage can be blocked (private modes, strict settings), so every access is guarded; the thanks page
 * then shows its plain version.
 */
const KEYS = { firstName: "hl-contact-first-name", autoReply: "hl-contact-auto-reply" } as const;

export function saveHandoff(firstName: string, autoReply: boolean): void {
  try {
    sessionStorage.setItem(KEYS.firstName, firstName);
    sessionStorage.setItem(KEYS.autoReply, autoReply ? "sent" : "failed");
  } catch {
    // Storage blocked: the thanks page shows "Got it, thanks." and the usual text.
  }
}

/** A stable string snapshot ("name|sent") for useSyncExternalStore; null when nothing is stored. */
export function readHandoff(): string | null {
  try {
    const name = sessionStorage.getItem(KEYS.firstName);
    const autoReply = sessionStorage.getItem(KEYS.autoReply);
    return name === null && autoReply === null ? null : `${name ?? ""}|${autoReply ?? "sent"}`;
  } catch {
    return null;
  }
}

export function parseHandoff(snapshot: string | null): { firstName: string; autoReplyFailed: boolean } {
  if (!snapshot) return { firstName: "", autoReplyFailed: false };
  const [firstName, autoReply] = snapshot.split("|");
  return { firstName: firstName ?? "", autoReplyFailed: autoReply === "failed" };
}
