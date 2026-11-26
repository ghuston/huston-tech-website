/**
 * The interface words every form shares: default error messages by field type, the "(optional)" mark, send errors, the
 * no-JavaScript note and the download email's lines. Plain defaults, like src/content/blog.ts. A client wanting other
 * wording edits this module. The download lines hold a literal `{title}`; the code fills it in.
 */
export const formWords = {
  optional: "(optional)",
  /** The first, empty choice of a dropdown shown as a menu. */
  selectEmpty: "Choose one",
  errors: {
    "short-text": "Please fill this in.",
    "long-text": "Please fill this in.",
    email: "That email doesn't look quite right.",
    phone: "That phone number doesn't look quite right.",
    dropdown: "Please pick one.",
    checkbox: "Please tick this box.",
    consent: "Please tick this box to go on.",
  },
  sendErrors: {
    notVerified: "That didn't go through. Please try again.",
    rateLimited: "Too many tries in a row. Wait a minute and try again.",
    failed: "That didn't send. Please try again in a few minutes.",
  },
  downloadNotSent: "The email with your file didn't send. Please write to us and we'll send it.",
  noScript: "This form needs JavaScript to send. You can also write to",
  noScriptNoEmail: "This form needs JavaScript to send. You can also reach us from the contact page.",
  download: {
    subject: "Your copy of {title}",
    lines: ["Here is {title}, as you asked.", "Download it here:"],
  },
};
