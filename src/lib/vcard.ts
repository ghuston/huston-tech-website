// vCard 3.0 (RFC 2426) writer for /grant.vcf. Lines end in CRLF and are folded at 75 octets (RFC 2425 §5.8.1).

type VCardInput = {
  givenName: string;
  familyName: string;
  formattedName: string;
  org: string;
  title: string;
  phone: string;
  email: string | null;
  url: string;
  /** A JPEG, embedded as base64. */
  photoJpeg: Uint8Array;
};

/** Escapes a text value: backslash, comma, semicolon and newlines (RFC 2426 §4). */
function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
}

/** Folds a content line: at most 75 characters per physical line, continuation lines start with one space. ASCII only. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(` ${line.slice(i, i + 74)}`);
  return parts.join("\r\n");
}

export function buildVCard(input: VCardInput): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeText(input.familyName)};${escapeText(input.givenName)};;;`,
    `FN:${escapeText(input.formattedName)}`,
    `ORG:${escapeText(input.org)}`,
    `TITLE:${escapeText(input.title)}`,
    `TEL;TYPE=CELL:${input.phone}`,
    ...(input.email ? [`EMAIL;TYPE=INTERNET:${input.email}`] : []),
    `URL:${input.url}`,
    `PHOTO;ENCODING=b;TYPE=JPEG:${Buffer.from(input.photoJpeg).toString("base64")}`,
    "END:VCARD",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
