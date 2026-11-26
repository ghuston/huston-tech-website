import { autoReply } from "../src/content/auto-reply.ts";
import { needOptions } from "../src/content/contact-fields.ts";
import type { ContactSubmission } from "../src/lib/contact-validation.ts";
import { autoReplyFirstName } from "../src/lib/first-name.ts";
import type { Mode } from "./env.ts";

/** The need's label from `needOptions`: "A website", "An AI system for my business", ... */
export function needLabel(submission: ContactSubmission): string {
  return needOptions.find((option) => option.value === submission.need)?.label ?? "";
}

function cap(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function previewPrefix(mode: Mode): string {
  return mode === "production" ? "" : "[Preview] ";
}

/**
 * Where a submission landed. `app`: the Pipeline app took it, did not (`failed`), is not connected yet (`off`), or is
 * not used in previews. `sheet`: written, failed, or not tried because the app had it.
 */
export type Saved = { app: "saved" | "failed" | "off" | "preview"; sheet: "saved" | "failed" | "skipped" };

const APP_LINE: Record<Saved["app"], string> = {
  saved: "Pipeline app: saved",
  failed: "Pipeline app: NOT saved - check the app and INTAKE_SECRET",
  off: "Pipeline app: not connected yet",
  preview: "Pipeline app: not used in previews",
};

export function savedLines({ app, sheet }: Saved): string[] {
  const where =
    app === "saved" ? "the Pipeline app" : sheet !== "saved" ? "NOWHERE - add this one by hand" : app === "failed" ? "the Google Sheet (the Pipeline app did not take it)" : "the Google Sheet";
  const sheetLine = sheet === "saved" ? "Sheet: saved" : sheet === "failed" ? "Sheet: NOT saved - add this one by hand" : "Sheet: not used (the app has it)";
  return [`Saved to: ${where}`, APP_LINE[app], sheetLine];
}

/** The internal email to Grant: plain text, every field labelled, plus where the submission was saved. */
export function notificationEmail(s: ContactSubmission, mode: Mode, receivedAt: string, saved: Saved) {
  const subject = cap(`${previewPrefix(mode)}New note: ${needLabel(s)} from ${s.name}`, 120);
  const lines = [
    `Need: ${needLabel(s)}`,
    `Topic link: ${s.topic || "(none)"}`,
    `Name: ${s.name}`,
    `Email: ${s.email}`,
    `Business:${s.business || "(not given)"}`,
    `Uses today: ${s.tools || "(not given)"}`,
    `Current website: ${s.website || "(not given)"}`,
    `Heard about Huston Logic: ${s.source || "(not given)"}`,
    "",
    "What's going on:",
    s.message,
    "",
    `Received: ${receivedAt}`,
    ...savedLines(saved),
  ];
  if (mode !== "production") lines.push(`Mode: ${mode}`);
  return { subject, text: lines.join("\n") };
}

/** The B7b automatic reply. In preview it goes to Grant instead, and the subject says who it would have gone to. */
export function autoReplyEmail(s: ContactSubmission, mode: Mode, bookingUrl: string) {
  const name = autoReplyFirstName(s.name);
  const { booking } = autoReply;
  const greeting = name ? autoReply.greeting.replace("{firstName}", name) : autoReply.greetingNoName;
  const text = [
    greeting,
    ...autoReply.paragraphs,
    `${booking.before}${booking.linkText}${booking.after}\n${bookingUrl}`,
    ...autoReply.paragraphsAfter,
    autoReply.talkSoon,
    autoReply.signatureText.join("\n").replace("{bookingUrl}", bookingUrl),
  ].join("\n\n");

  const p = (inner: string) => `<p style="margin:0 0 16px;">${inner}</p>`;
  const link = `<a href="${escapeHtml(bookingUrl)}" style="color:#2B6455;">${escapeHtml(booking.linkText)}</a>`;
  const html = [
    '<div style="max-width:560px;margin:0;text-align:left;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#29332D;">',
    p(escapeHtml(greeting)),
    ...autoReply.paragraphs.map((t) => p(escapeHtml(t))),
    p(`${escapeHtml(booking.before)}${link}${escapeHtml(booking.after)}`),
    ...autoReply.paragraphsAfter.map((t) => p(escapeHtml(t))),
    p(escapeHtml(autoReply.talkSoon)),
    autoReply.signatureHtml.replace("{bookingUrl}", escapeHtml(bookingUrl)),
    "</div>",
  ].join("\n");

  const subject = mode === "production" ? autoReply.subject : `[Preview → would go to ${s.email}] ${autoReply.subject}`;
  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** The Sheet row, in the header order: Received, Need, Topic, Name, Email, Business, Message, Tools, Website, Source, Mode. */
export function sheetRow(s: ContactSubmission, mode: Mode, receivedAt: string): string[] {
  return [receivedAt, needLabel(s), s.topic, s.name, s.email, s.business, s.message, s.tools, s.website, s.source, mode];
}
