import Link from "next/link";
import type { ReactNode } from "react";
import { Text } from "@/components/ui/Text";
import { honeypot } from "@/content/contact-fields";
import { formWords } from "@/content/forms";
import type { FormField } from "@/forms/schema";

/**
 * The form primitives both the contact form and the `form` block draw from: labels, controls, the error line, the chip
 * row, the ink button and the no-JavaScript note. Lifted from the contact form unchanged, so both render one set.
 */

export type FieldIds = { input: string; help: string; error: string };
export type Choice = { value: string; label: string };

export const labelClass = "block font-ui text-label font-medium text-ink";
const controlClass =
  "mt-2 block w-full rounded-field border border-ink-2 bg-white px-3.5 font-text text-control text-ink placeholder:text-ink-2 focus:border-ink aria-[invalid=true]:border-rust";
export const inputClass = `${controlClass} h-13`;

/** The message for a problem with a field: its own, else the default for its type. */
export function errorFor(field: FormField): string {
  return field.error ?? formWords.errors[field.type];
}

/** A label with "(optional)" on a field that is not required. A checkbox or consent label is a sentence, and a box left unticked is optional by nature, so it never gets the mark. */
export function labelFor(field: FormField, marked: boolean): string {
  const isBox = field.type === "checkbox" || field.type === "consent";
  return marked && !field.required && !isBox ? `${field.label} ${formWords.optional}` : field.label;
}

/** Fields whose problems a person can fix show a live error line; the others never need one. */
export function canFail(field: FormField): boolean {
  return field.required || field.type === "email" || field.type === "phone";
}

export function ErrorLine({ id, message }: { id: string; message?: string }) {
  return (
    <div id={id} aria-live="polite">
      {message ? (
        <p className="mt-2 flex items-start gap-2 text-label text-rust">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.75 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="8" cy="8" r="6.25" />
          </svg>
          {message}
        </p>
      ) : null}
    </div>
  );
}

function Labeled({ id, text, children }: { id: string; text: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {text}
      </label>
      {children}
    </div>
  );
}

function Help({ id, text, rich }: { id: string; text: string; rich: boolean }) {
  return (
    <p id={id} className="mt-2 text-small text-ink-2">
      {rich ? <Text>{text}</Text> : text}
    </p>
  );
}

function ChipRow({
  field,
  legend,
  options,
  selected,
  onSelect,
  error,
  describedBy,
  errorId,
  children,
}: {
  field: FormField;
  legend: string;
  options: readonly Choice[];
  selected: string;
  onSelect: (value: string) => void;
  error?: string;
  describedBy?: string;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <fieldset role="radiogroup" aria-required={field.required ? "true" : undefined} aria-invalid={error ? "true" : undefined} aria-describedby={describedBy}>
      <legend className={labelClass}>{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={field.id}
              value={option.value}
              checked={selected === option.value}
              onChange={() => onSelect(option.value)}
              aria-describedby={error ? errorId : undefined}
              className="peer sr-only"
            />
            <span
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border px-4.5 font-ui text-chip font-medium peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-rust ${
                selected === option.value ? "border-ink bg-ink text-silver" : error ? "border-rust text-ink" : "border-ink-2 text-ink"
              }`}
            >
              {selected === option.value ? <span aria-hidden="true" className="size-2 rounded-pill bg-rust" /> : null}
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {children}
    </fieldset>
  );
}

export type FieldViewProps = {
  field: FormField;
  ids: FieldIds;
  /** The label as shown (with "(optional)" already applied where wanted). */
  label: string;
  error?: string;
  /** Help text may carry **bold** and [[placeholder]]; the contact form shows its note as plain text. */
  rich: boolean;
  placeholder?: string;
  /** A long-text field drawn as one line (the contact form's `tools`). */
  oneLine?: boolean;
  /** The first, empty choice of a menu. */
  emptyChoice: string;
  /** Choices and state of a `buttons` dropdown. */
  chips?: { options: readonly Choice[]; selected: string; onSelect: (value: string) => void };
};

/** One field of a form: its label, control, help and error line, from the field's own settings. */
export function FieldView({ field, ids, label, error, rich, placeholder, oneLine, emptyChoice, chips }: FieldViewProps) {
  const described = [field.help ? ids.help : undefined, error ? ids.error : undefined].filter(Boolean).join(" ") || undefined;
  const invalid = error ? ("true" as const) : undefined;
  const required = field.required ? ({ required: true, "aria-required": "true" } as const) : {};
  const help = field.help ? <Help id={ids.help} text={field.help} rich={rich} /> : null;
  const line = canFail(field) ? <ErrorLine id={ids.error} message={error} /> : null;

  if (field.type === "dropdown" && field.display === "buttons" && chips) {
    return (
      <ChipRow field={field} legend={label} options={chips.options} selected={chips.selected} onSelect={chips.onSelect} error={error} describedBy={described} errorId={ids.error}>
        {help}
        {line}
      </ChipRow>
    );
  }

  if (field.type === "checkbox" || field.type === "consent") {
    return (
      <div>
        <label htmlFor={ids.input} className="flex min-h-11 cursor-pointer items-start gap-3 font-text text-control text-ink">
          <input id={ids.input} name={field.id} type="checkbox" {...required} aria-invalid={invalid} aria-describedby={described} className="mt-1 size-5 shrink-0 accent-ink" />
          <span>{label}</span>
        </label>
        {help}
        {line}
      </div>
    );
  }

  let control: ReactNode;
  if (field.type === "dropdown") {
    control = (
      <select id={ids.input} name={field.id} defaultValue="" {...required} aria-invalid={invalid} aria-describedby={described} className={inputClass}>
        <option value="">{emptyChoice}</option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "long-text" && !oneLine) {
    control = (
      <textarea
        id={ids.input}
        name={field.id}
        rows={5}
        {...required}
        maxLength={field.max}
        aria-invalid={invalid}
        aria-describedby={described}
        placeholder={placeholder}
        className={`${controlClass} min-h-35 py-3`}
      />
    );
  } else {
    const kind = field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.purpose === "website" ? "url" : "text";
    const autoComplete =
      field.type === "email"
        ? "email"
        : field.type === "phone"
          ? "tel"
          : field.purpose === "name"
            ? "name"
            : field.purpose === "organization"
              ? "organization"
              : field.purpose === "website"
                ? "url"
                : field.purpose === "address"
                  ? "street-address"
                  : undefined;
    control = (
      <input
        id={ids.input}
        name={field.id}
        type={kind}
        autoComplete={autoComplete}
        {...required}
        maxLength={field.max}
        aria-invalid={invalid}
        aria-describedby={described}
        placeholder={placeholder}
        className={inputClass}
      />
    );
  }

  return (
    <Labeled id={ids.input} text={label}>
      {control}
      {help}
      {line}
    </Labeled>
  );
}

/** Spam trap: hidden from people and screen readers, out of the tab order. A filled value is refused. */
export function Honeypot({ id }: { id: string }) {
  return (
    <div aria-hidden="true" className="sr-only">
      <label htmlFor={id}>{honeypot.label}</label>
      <input id={id} name={honeypot.name} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

export function SubmitButton({ label, sending }: { label: string; sending: boolean }) {
  return (
    <button
      type="submit"
      aria-disabled={sending ? "true" : undefined}
      aria-busy={sending ? "true" : undefined}
      className="inline-flex min-h-13.5 w-full items-center justify-center rounded-btn bg-ink px-6 font-ui text-btn font-semibold text-silver aria-disabled:cursor-wait aria-disabled:opacity-70 md:w-auto md:justify-start md:pl-5.5"
    >
      {label}
    </button>
  );
}

/** Under the button, for visitors without JavaScript: the form cannot send, so it says how to reach the owner (R6). */
export function NoScriptNote({ email }: { email: string | null }) {
  const [before, after] = formWords.noScriptNoEmail.split("contact page");
  return (
    <noscript>
      <p className="mt-4 text-small text-ink-2">
        {email ? (
          <>
            {formWords.noScript} <a href={`mailto:${email}`} className="underline">{email}</a>.
          </>
        ) : after === undefined ? (
          formWords.noScriptNoEmail
        ) : (
          <>
            {before}
            <Link href="/contact" className="underline">
              contact page
            </Link>
            {after}
          </>
        )}
      </p>
    </noscript>
  );
}
