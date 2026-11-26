import { formWords } from "../src/content/forms.ts";
import { answerLines, emailOf, nameOf, organizationOf, type AnswerLine } from "../src/forms/answers.ts";
import type { FormDefinition, FormDownload } from "../src/forms/schema.ts";
import type { SubmissionValue } from "../src/forms/submission.ts";
import type { WorkerConfig } from "./config.ts";
import type { Mode } from "./env.ts";
import { type Saved, savedLines } from "./messages.ts";
import { safeCell } from "./sheets.ts";

/** What the other forms (POST /api/forms/<id>) save and send. The contact form's own words are in worker/messages.ts. */

/** The most characters the Pipeline app accepts in `message`. */
const PIPELINE_MESSAGE_MAX = 5000;
/** The most characters one Sheet cell takes. */
const SHEET_CELL_MAX = 6000;
const ANSWERS_CUT = "\n(cut; the notification email has every answer)";

export interface FormLead {
  name: string;
  email: string;
  message: string;
  business?: string;
}

function cap(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function answerText(line: AnswerLine): string {
  return line.text.includes("\n") ? `${line.label}:\n${line.text}` : `${line.label}: ${line.text}`;
}

/** The "Answers" cell: one `Label: value` line per answer given, cut with a fixed ending past the cell limit. */
function answersCell(lines: AnswerLine[]): string {
  const text = lines.map(answerText).join("\n");
  // safeCell may add a leading apostrophe on the way out: leave room for it.
  const room = SHEET_CELL_MAX - (safeCell(text) === text ? 0 : 1);
  return text.length > room ? `${text.slice(0, room - ANSWERS_CUT.length)}${ANSWERS_CUT}` : text;
}

/** The Forms tab row, one fixed header for every form: Received (UTC), Form, Name, Email, Answers, Mode. */
export function formSheetRow(def: FormDefinition, value: SubmissionValue, mode: Mode, receivedAt: string): string[] {
  return [receivedAt, def.name, nameOf(def, value), emailOf(def, value), answersCell(answerLines(def, value)), mode];
}

/** The Pipeline lead: the name field or, without one, the email address; the answers travel in the message. */
export function formPipelineLead(def: FormDefinition, value: SubmissionValue): FormLead {
  const email = emailOf(def, value);
  const message = cap(`Form: ${def.name}\n\n${answerLines(def, value).map(answerText).join("\n")}`, PIPELINE_MESSAGE_MAX);
  const business = organizationOf(def, value);
  return { name: nameOf(def, value) || email, email, message, ...(business ? { business } : {}) };
}

/** The internal email for a form: plain text, every answer labelled, where it was saved, and the mode when not live. */
export function formNotificationEmail(def: FormDefinition, value: SubmissionValue, mode: Mode, receivedAt: string, saved: Saved) {
  const who = nameOf(def, value) || emailOf(def, value);
  const subject = cap(`${mode === "production" ? "" : "[Preview] "}New ${def.name} from ${who}`, 120);
  const lines = [`Form: ${def.name}`, "", ...answerLines(def, value).map(answerText), "", `Received: ${receivedAt}`, ...savedLines(saved)];
  if (mode !== "production") lines.push(`Mode: ${mode}`);
  return { subject, text: lines.join("\n") };
}

/**
 * The download email: plain text, fixed words (src/content/forms.ts) plus the owner's title, the business name and the
 * link built from the site's own address. No visitor input appears in it; in preview only the subject names who it would
 * have gone to, as the automatic reply does.
 */
export function downloadEmail(config: WorkerConfig, download: FormDownload, mode: Mode, visitorEmail: string) {
  const fill = (text: string) => text.replaceAll("{title}", download.title);
  const [intro, before] = formWords.download.lines;
  const text = [fill(intro ?? ""), `${fill(before ?? "")}\n${config.editor.siteUrl}${download.href}`, config.businessName].join("\n\n");
  const base = fill(formWords.download.subject);
  return { subject: mode === "production" ? base : `[Preview → would go to ${visitorEmail}] ${base}`, text };
}
