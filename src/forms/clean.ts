// Text cleaning shared by the contact form and every other form. Import-free.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// C0 and C1 control characters plus DEL. cleanText keeps tab and newline.
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g;
const CONTROL_EXCEPT_TAB_NEWLINE = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g;

/** One line of text: no control characters or line breaks, single spaces, trimmed. */
export function cleanLine(value: string): string {
  return value.normalize("NFC").replace(CONTROL, " ").replace(/\s+/g, " ").trim();
}

/** Multi-line text: line breaks kept (as \n), other control characters removed, trimmed. */
export function cleanText(value: string): string {
  return value.normalize("NFC").replace(/\r\n?/g, "\n").replace(CONTROL_EXCEPT_TAB_NEWLINE, "").trim();
}
