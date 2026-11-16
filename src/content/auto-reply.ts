/**
 * The automatic reply the contact Worker sends (docs/website-plan.md B7b): plain text, from grant@hustonlogic.com.
 * It imports nothing, because the Worker bundles it. worker/messages.ts fills `{firstName}` and `{schedulerLink}`;
 * when the name doesn't look like a name, the greeting has none.
 */
export const autoReply = {
  subject: "Got it, thanks",
  greeting: "Hi {firstName}, your note reached me.",
  greetingNoName: "Hi, your note reached me.",
  body: "I read every message myself and will reply within one business day. If it's easier to talk, you can pick a time here: {schedulerLink}.",
  signOff: "— Grant, Huston Logic",
};
