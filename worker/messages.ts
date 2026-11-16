import { autoReply } from "../src/content/auto-reply.ts";
import { needOptions } from "../src/content/contact-fields.ts";
import type { ContactSubmission } from "../src/lib/contact-validation.ts";
import { firstName } from "../src/lib/first-name.ts";
import type { Mode } from "./env.ts";

/** "A website", "Help with a workflow", ... or "Zoho partner" for the partner variant (it has no need field). */
export function needLabel(submission: ContactSubmission): string {
  if (submission.topic === "partner") return "Zoho partner";
  return needOptions.find((option) => option.value === submission.need)?.label ?? "";
}

function cap(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function previewPrefix(mode: Mode): string {
  return mode === "production" ? "" : "[Preview] ";
}

/** The internal email to Grant: plain text, every field labelled, plus whether the Sheet row was saved. */
export function notificationEmail(s: ContactSubmission, mode: Mode, receivedAt: string, sheetSaved: boolean) {
  const subject = cap(`${previewPrefix(mode)}New note: ${needLabel(s)} from ${s.name}`, 120);
  const lines = [
    `Need: ${needLabel(s)}`,
    `Topic link: ${s.topic || "(none)"}`,
    `Name: ${s.name}`,
    `Email: ${s.email}`,
    `Business or band: ${s.business || "(not given)"}`,
    `Uses today: ${s.tools || "(not given)"}`,
    `Current website: ${s.website || "(not given)"}`,
    `Heard about Huston Logic: ${s.source || "(not given)"}`,
    "",
    "What's going on:",
    s.message,
    "",
    `Received: ${receivedAt}`,
    sheetSaved ? "Sheet: saved" : "Sheet: NOT saved - add this one by hand",
  ];
  if (mode !== "production") lines.push(`Mode: ${mode}`);
  return { subject, text: lines.join("\n") };
}

/** The B7b automatic reply. In preview it goes to Grant instead, and the subject says who it would have gone to. */
export function autoReplyEmail(s: ContactSubmission, mode: Mode, schedulerLink: string) {
  const name = firstName(s.name);
  const greeting = name ? autoReply.greeting.replace("{firstName}", name) : autoReply.greetingNoName;
  const text = [`${greeting} ${autoReply.body.replace("{schedulerLink}", schedulerLink)}`, "", autoReply.signOff].join("\n");
  const subject = mode === "production" ? autoReply.subject : `[Preview → would go to ${s.email}] ${autoReply.subject}`;
  return { subject, text };
}

/** The Sheet row, in the header order: Received, Need, Topic, Name, Email, Business, Message, Tools, Website, Source, Mode. */
export function sheetRow(s: ContactSubmission, mode: Mode, receivedAt: string): string[] {
  return [receivedAt, needLabel(s), s.topic, s.name, s.email, s.business, s.message, s.tools, s.website, s.source, mode];
}
