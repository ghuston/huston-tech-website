import type { Fields } from "../blocks/schema.ts";
import type { Context } from "../blocks/validate.ts";
import { checkFields, isRecord } from "./check.ts";

export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export type DayHours = "closed" | { opens: string; closes: string };
export type Hours = Record<Weekday, DayHours>;

export const SOCIAL_NETWORKS = [
  { id: "instagram", label: "Instagram", hosts: ["instagram.com"] },
  { id: "facebook", label: "Facebook", hosts: ["facebook.com", "fb.com"] },
  { id: "linkedin", label: "LinkedIn", hosts: ["linkedin.com"] },
  { id: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  { id: "tiktok", label: "TikTok", hosts: ["tiktok.com"] },
  { id: "x", label: "X", hosts: ["x.com", "twitter.com"] },
  { id: "pinterest", label: "Pinterest", hosts: ["pinterest.com", "pin.it"] },
  { id: "threads", label: "Threads", hosts: ["threads.net", "threads.com"] },
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number]["id"];

export type BusinessData = {
  name: string;
  phone: string;
  email: string;
  address: string[];
  hours: Hours | null;
  hoursNote?: string;
  social: { network: SocialNetwork; url: string }[];
};

const WHERE = "business.json";
const KEYS = ["name", "phone", "email", "address", "hours", "hoursNote", "social"];
const PLACEHOLDER = /\[\[[^\]]+\]\]/;
const PHONE_CHARS = /^[0-9 +()\-.]+$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/** The plain names of the business fields, shared by the validator's messages and the editor's change list. */
export const BUSINESS_LABELS = {
  name: "Business name",
  phone: "Phone",
  email: "Email",
  address: "Address lines",
  addressLine: "Address line",
  hours: "Hours",
  opens: "Opens",
  closes: "Closes",
  hoursNote: "Hours note",
  social: "Social links",
  socialLink: "Social link",
  network: "Network",
  url: "Address",
} as const;

const TEXT_FIELDS: Fields = {
  name: { kind: "text", label: BUSINESS_LABELS.name, max: 80 },
  address: { kind: "list", label: BUSINESS_LABELS.address, min: 0, max: 4, of: { kind: "text", label: BUSINESS_LABELS.addressLine, max: 80 } },
  hoursNote: { kind: "text", label: BUSINESS_LABELS.hoursNote, max: 120, required: false },
  social: {
    kind: "list",
    label: BUSINESS_LABELS.social,
    min: 0,
    max: 8,
    of: {
      kind: "object",
      label: BUSINESS_LABELS.socialLink,
      fields: {
        network: { kind: "choice", label: BUSINESS_LABELS.network, options: SOCIAL_NETWORKS.map((n) => n.id) },
        url: { kind: "link", label: BUSINESS_LABELS.url },
      },
    },
  },
};

const digits = (value: string) => value.replace(/\D/g, "");

/** True for a real phone number: digits, spaces and + ( ) - . only, 7 to 20 characters, at least 7 digits. */
function isPhone(value: string): boolean {
  return value.length >= 7 && value.length <= 20 && PHONE_CHARS.test(value) && digits(value).length >= 7;
}

function hostMatches(url: string, hosts: readonly string[]): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return hosts.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

function hoursProblems(hours: unknown): string[] {
  if (hours === null) return [];
  if (!isRecord(hours)) return [`${WHERE}: "hours" must be null (no hours shown) or a list of the seven days.`];
  const out: string[] = [];
  for (const key of Object.keys(hours)) {
    if (!(WEEKDAYS as readonly string[]).includes(key)) out.push(`${WHERE}: "hours" has "${key}", which is not a day. The days are ${WEEKDAYS.join(", ")}.`);
  }
  for (const day of WEEKDAYS) {
    const value = hours[day];
    if (value === undefined) {
      out.push(`${WHERE}: "hours" needs ${day}: its opening and closing times, or "closed".`);
    } else if (value === "closed") {
      continue;
    } else if (!isRecord(value) || Object.keys(value).some((k) => k !== "opens" && k !== "closes")) {
      out.push(`${WHERE}: "hours", ${day} must be "closed" or { "opens": "09:00", "closes": "17:00" }.`);
    } else if (typeof value["opens"] !== "string" || !TIME_RE.test(value["opens"]) || typeof value["closes"] !== "string" || !TIME_RE.test(value["closes"])) {
      out.push(`${WHERE}: "hours", ${day} needs times written as 24-hour HH:MM, like "09:00" and "17:00".`);
    } else if (minutes(value["closes"]) <= minutes(value["opens"])) {
      out.push(`${WHERE}: "hours", ${day} closes (${value["closes"]}) at or before it opens (${value["opens"]}).`);
    }
  }
  return out;
}

/** Why `business.json` is not acceptable, in plain words; empty when it is. */
export function validateBusiness(data: unknown, ctx: Context): string[] {
  if (!isRecord(data)) return [`${WHERE}: the file must be an object.`];
  const out: string[] = [];
  for (const key of Object.keys(data)) {
    if (!KEYS.includes(key)) out.push(`${WHERE}: "${key}" is not a business detail. It accepts: ${KEYS.join(", ")}.`);
  }
  for (const key of ["phone", "email", "hours"]) {
    if (data[key] === undefined) out.push(`${WHERE}: "${key}" is required (use "" for none${key === "hours" ? ", or null" : ""}).`);
  }

  const { phone, email } = data;
  if (phone !== undefined) {
    if (typeof phone !== "string") out.push(`${WHERE}: "phone" must be text.`);
    else if (phone !== "" && !PLACEHOLDER.test(phone) && !isPhone(phone)) {
      out.push(`${WHERE}: "phone" is "${phone.slice(0, 30)}"; use 7 to 20 digits, spaces and + ( ) - . only, like "555 0142" or "+1 (555) 014-2000".`);
    }
  }
  if (email !== undefined) {
    if (typeof email !== "string") out.push(`${WHERE}: "email" must be text.`);
    else if (email !== "" && !PLACEHOLDER.test(email) && !EMAIL_RE.test(email)) {
      out.push(`${WHERE}: "email" is "${email.slice(0, 60)}", which is not one email address like name@example.com.`);
    }
  }

  const text: Record<string, unknown> = {};
  for (const key of ["name", "address", "hoursNote", "social"]) if (data[key] !== undefined) text[key] = data[key];
  out.push(...checkFields(TEXT_FIELDS, text, WHERE, ctx));

  if (Array.isArray(data["social"])) {
    data["social"].forEach((entry: unknown, index) => {
      if (!isRecord(entry) || typeof entry["url"] !== "string" || typeof entry["network"] !== "string") return;
      const network = SOCIAL_NETWORKS.find((n) => n.id === entry["network"]);
      const url = entry["url"];
      if (network === undefined || !url.toLowerCase().startsWith("https://")) return;
      if (!hostMatches(url, network.hosts)) {
        out.push(`${WHERE}: "social" entry ${index + 1}: "${url}" is not a ${network.label} address. The ${network.label} link must be an https:// address on ${network.hosts.join(" or ")}.`);
      }
    });
  }

  if (data["hours"] !== undefined) out.push(...hoursProblems(data["hours"]));
  return out;
}

const DAY_NAMES: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function clock(time: string): string {
  const hour = Number(time.slice(0, 2));
  const minute = time.slice(3);
  const suffix = hour < 12 ? "am" : "pm";
  const shown = hour % 12 === 0 ? 12 : hour % 12;
  return minute === "00" ? `${shown} ${suffix}` : `${shown}:${minute} ${suffix}`;
}

const sameDay = (a: DayHours, b: DayHours) => (a === "closed" || b === "closed" ? a === b : a.opens === b.opens && a.closes === b.closes);

/** The week as the visitor reads it: runs of days with the same hours, in order, such as "Monday to Thursday" / "9 am to 5 pm". */
export function formatHours(hours: Hours | null): { days: string; time: string }[] {
  if (hours === null) return [];
  const runs: { first: Weekday; last: Weekday; count: number; value: DayHours }[] = [];
  for (const day of WEEKDAYS) {
    const value = hours[day];
    const run = runs[runs.length - 1];
    if (run !== undefined && sameDay(run.value, value)) {
      run.last = day;
      run.count += 1;
    } else {
      runs.push({ first: day, last: day, count: 1, value });
    }
  }
  return runs.map((run) => ({
    days:
      run.count === 1
        ? DAY_NAMES[run.first]
        : run.count === 2
          ? `${DAY_NAMES[run.first]} and ${DAY_NAMES[run.last]}`
          : `${DAY_NAMES[run.first]} to ${DAY_NAMES[run.last]}`,
    time: run.value === "closed" ? "closed" : `${clock(run.value.opens)} to ${clock(run.value.closes)}`,
  }));
}

/** A `tel:` link for a real phone number, or null (empty, a [[placeholder]] or not a phone number). Keeps a leading +. */
export function telHref(phone: string): string | null {
  if (typeof phone !== "string" || PLACEHOLDER.test(phone) || !isPhone(phone)) return null;
  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${digits(phone)}`;
}
