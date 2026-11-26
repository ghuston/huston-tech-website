import type { Fields } from "../blocks/schema.ts";
import type { Context } from "../blocks/validate.ts";
import { checkFields, isDate, isRecord } from "./check.ts";

export type NoticeData = {
  /** Empty means no notice. */
  text: string;
  link?: { label: string; href: string };
  /** The last day the notice shows (inclusive), YYYY-MM-DD, or null for no end. */
  endsOn: string | null;
};

const WHERE = "notice.json";

/** The plain names of the notice fields, shared by the validator's messages and the editor's change list. */
export const NOTICE_LABELS = { text: "Notice text", link: "Notice link", linkText: "Link text", linkHref: "Link", endsOn: "Last day it shows" } as const;

const FIELDS: Fields = {
  text: { kind: "text", label: NOTICE_LABELS.text, max: 120, min: 0 },
  link: {
    kind: "object",
    label: NOTICE_LABELS.link,
    required: false,
    fields: {
      label: { kind: "text", label: NOTICE_LABELS.linkText, max: 40 },
      href: { kind: "link", label: NOTICE_LABELS.linkHref },
    },
  },
};

/** Why `notice.json` is not acceptable, in plain words; empty when it is. */
export function validateNotice(data: unknown, ctx: Context): string[] {
  if (!isRecord(data)) return [`${WHERE}: the file must be an object.`];
  const out: string[] = [];
  for (const key of Object.keys(data)) {
    if (key !== "text" && key !== "link" && key !== "endsOn") out.push(`${WHERE}: "${key}" is not a notice setting. It accepts: text, link, endsOn.`);
  }
  const { endsOn, ...rest } = data;
  const known: Record<string, unknown> = {};
  for (const key of ["text", "link"]) if (rest[key] !== undefined) known[key] = rest[key];
  out.push(...checkFields(FIELDS, known, WHERE, ctx));
  if (endsOn === undefined) out.push(`${WHERE}: "endsOn" is required (a date like 2026-12-26, or null for no end date).`);
  else if (endsOn !== null && !isDate(endsOn)) out.push(`${WHERE}: "endsOn" is ${JSON.stringify(endsOn)}; write a real date as YYYY-MM-DD, like 2026-12-26, or null.`);
  if (typeof data["text"] === "string" && data["text"].trim() === "" && data["link"] !== undefined) {
    out.push(`${WHERE}: there is a link but no notice text; a link needs text to sit in, or remove the link.`);
  }
  return out;
}

/** The calendar date (YYYY-MM-DD) it is in `timeZone` at `now`. Throws on an unknown time zone name. */
export function todayIn(timeZone: string, now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Whether the notice is on the page: it has text, and `today` is on or before its last day. */
export function noticeShows(notice: NoticeData, today: string): boolean {
  if (notice.text.trim() === "") return false;
  return notice.endsOn === null || today <= notice.endsOn;
}
