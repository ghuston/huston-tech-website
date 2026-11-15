"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { Text } from "@/components/ui/Text";
import { noteForm, type Topic } from "@/content/contact";

type Field = "need" | "name" | "email" | "message";
type Errors = Partial<Record<Field, string>>;

const label = "block font-ui text-[15px] font-medium text-ink";
const control =
  "mt-2 block w-full rounded-field border border-ink-2 bg-white px-[14px] font-text text-[17px] text-ink placeholder:text-ink-2 focus:border-ink aria-[invalid=true]:border-rust";
const input = `${control} h-[52px]`;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ErrorLine({ id, message }: { id: string; message?: string }) {
  return (
    <div id={id} aria-live="polite">
      {message ? (
        <p className="mt-2 flex items-start gap-2 text-[15px] text-rust">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-[3px] size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75">
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
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {children}
    </div>
  );
}

/**
 * The shell of the contact form (docs/website-plan.md B7). It validates with the Rev 7.1 messages, but nothing is sent
 * yet: the Worker, email sending and Turnstile arrive in a later PR. A valid submit shows a marked "not connected"
 * note (it fails the launch gate on purpose), never a success state. No `action`, and `method="post"`, so a visitor
 * without JavaScript can never put their answers into the URL.
 */
function Form({ urlTopic }: { urlTopic: string | null }) {
  const partner = urlTopic === "partner";
  const [need, setNeed] = useState<Topic | null>(urlTopic === "website" || urlTopic === "workflow" ? urlTopic : null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const key = need === "website" || need === "workflow" ? need : "other";
  const e = noteForm.errors;

  function submit(event: SyntheticEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (!partner && !need) next.need = e.need;
    if (!name.trim()) next.name = e.name;
    if (!EMAIL.test(email.trim())) next.email = e.email;
    if (!message.trim()) next.message = e.message;
    setErrors(next);
    setSent(false);
    const first = (["need", "name", "email", "message"] as Field[]).find((f) => next[f]);
    if (first) {
      const target = first === "need" ? formRef.current?.querySelector<HTMLInputElement>('input[name="need"]') : formRef.current?.querySelector<HTMLElement>(`#cf-${first}`);
      target?.focus();
      return;
    }
    setSent(true);
  }

  const invalid = (f: Field) => (errors[f] ? ("true" as const) : undefined);
  const described = (f: Field, extra?: string) => [extra, errors[f] ? `cf-${f}-error` : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <div className="rounded-panel bg-white p-6 shadow-card md:p-9">
      <h2 className="font-ui text-[28px] font-bold leading-tight tracking-[-0.03em]">
        {partner ? noteForm.partnerHeading : noteForm.heading}
      </h2>

      <form ref={formRef} method="post" noValidate onSubmit={submit} className="mt-6 space-y-6">
        <input type="hidden" name="topic" value={urlTopic ?? ""} />

        {partner ? null : (
          <fieldset role="radiogroup" aria-required="true" aria-describedby={described("need")}>
            <legend className={label}>{noteForm.needLegend}</legend>
            <div className="mt-3 flex flex-wrap gap-[10px]">
              {noteForm.needOptions.map((option) => (
                <label key={option.value} className="relative">
                  <input
                    type="radio"
                    name="need"
                    value={option.value}
                    checked={need === option.value}
                    onChange={() => {
                      setNeed(option.value);
                      setErrors((previous) => ({ ...previous, need: undefined }));
                    }}
                    className="peer sr-only"
                  />
                  <span
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border px-[18px] font-ui text-[16px] font-medium peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-rust ${
                      need === option.value ? "border-ink bg-ink text-silver" : errors.need ? "border-rust text-ink" : "border-ink-2 text-ink"
                    }`}
                  >
                    {need === option.value ? <span aria-hidden="true" className="size-2 rounded-pill bg-rust" /> : null}
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
            <ErrorLine id="cf-need-error" message={errors.need} />
          </fieldset>
        )}

        <Labeled id="cf-name" text={noteForm.name.label}>
          <input
            id="cf-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-required="true"
            aria-invalid={invalid("name")}
            aria-describedby={described("name")}
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            className={input}
          />
          <ErrorLine id="cf-name-error" message={errors.name} />
        </Labeled>

        <Labeled id="cf-email" text={noteForm.email.label}>
          <input
            id="cf-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={invalid("email")}
            aria-describedby={described("email")}
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className={input}
          />
          <ErrorLine id="cf-email-error" message={errors.email} />
        </Labeled>

        <Labeled id="cf-business" text={noteForm.business.label}>
          <input id="cf-business" name="business" type="text" autoComplete="organization" className={input} />
        </Labeled>

        <Labeled id="cf-message" text={noteForm.message.label}>
          <textarea
            id="cf-message"
            name="message"
            rows={5}
            required
            aria-required="true"
            aria-invalid={invalid("message")}
            aria-describedby={described("message", "cf-privacy")}
            placeholder={noteForm.message.placeholders[key]}
            value={message}
            onChange={(ev) => setMessage(ev.target.value)}
            className={`${control} min-h-[140px] py-3`}
          />
          <p id="cf-privacy" className="mt-2 text-small text-ink-2">
            {noteForm.privacyNote}
          </p>
          <ErrorLine id="cf-message-error" message={errors.message} />
        </Labeled>

        <Labeled id="cf-tools" text={noteForm.tools.label}>
          <input id="cf-tools" name="tools" type="text" placeholder={noteForm.tools.placeholders[key]} className={input} />
        </Labeled>

        <Labeled id="cf-site" text={noteForm.website.label}>
          <input id="cf-site" name="website" type="url" autoComplete="url" className={input} />
        </Labeled>

        <Labeled id="cf-source" text={noteForm.source.label}>
          <select id="cf-source" name="source" defaultValue="" className={input}>
            <option value="">{noteForm.source.empty}</option>
            {noteForm.source.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Labeled>

        <button
          type="submit"
          className="inline-flex min-h-[54px] w-full items-center justify-center rounded-btn bg-ink px-6 font-ui text-btn font-semibold text-silver md:w-auto md:justify-start md:pl-[22px]"
        >
          {noteForm.submitLabel}
        </button>

        <div role="status">
          {sent ? (
            <p className="text-small">
              <Text>{noteForm.notConnected}</Text>
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function FormFromUrl() {
  const topic = useSearchParams().get("topic");
  return <Form key={topic ?? ""} urlTopic={topic} />;
}

/** A static page cannot read the query at build time, so the form reads ?topic= in the browser. Before that (and without JS) it shows the unselected form. */
export function ContactForm() {
  return (
    <Suspense fallback={<Form urlTopic={null} />}>
      <FormFromUrl />
    </Suspense>
  );
}
