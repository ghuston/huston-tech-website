// Small pure helpers for the list blocks (dates, initials, reading item data). Import-free so it can be unit-tested.

/** A string field of an item, or undefined when it is missing or not a string. */
export function itemText(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-03-27" as "March 27, 2026". Anything that is not a date comes back unchanged. */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const month = m ? MONTHS[Number(m[2]) - 1] : undefined;
  return m && month ? `${month} ${Number(m[3])}, ${m[1]}` : iso;
}

/** Up to two capital letters for a name: the first letters of its first and last words. Placeholder brackets are ignored. */
export function initials(name: string): string {
  const words = name.replace(/\[\[|\]\]/g, "").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  const letter = (w: string) => (/[\p{L}\p{N}]/u.exec(w)?.[0] ?? "").toUpperCase();
  const first = words[0];
  const last = words[words.length - 1];
  if (first === undefined || last === undefined) return "";
  return words.length === 1 ? letter(first) : letter(first) + letter(last);
}

/** Fills `{title}` and `{provider}` in a copy template. */
export function fillCopy(template: string, values: { title?: string; provider?: string }): string {
  return template.replaceAll("{title}", values.title ?? "").replaceAll("{provider}", values.provider ?? "");
}
