"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { Text } from "@/components/ui/Text";
import { noteForm } from "@/content/contact";
import { fieldLimits, honeypot, topicFromUrl, type Need } from "@/content/contact-fields";
import { providers } from "@/content/providers";
import { saveHandoff } from "@/lib/contact-handoff";
import { validateContact, type ContactField, type ContactInput } from "@/lib/contact-validation";
import { firstName } from "@/lib/first-name";
import { turnstileSiteKey, useTurnstile } from "./useTurnstile";

type Errors = Partial<Record<ContactField, string>>;
type SendError = keyof typeof noteForm.sendErrors;

const FIELD_ORDER: ContactField[] = ["need", "name", "email", "message"];

const label = "block font-ui text-label font-medium text-ink";
const control =
  "mt-2 block w-full rounded-field border border-ink-2 bg-white px-3.5 font-text text-control text-ink placeholder:text-ink-2 focus:border-ink aria-[invalid=true]:border-rust";
const input = `${control} h-13`;

function ErrorLine({ id, message }: { id: string; message?: string }) {
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
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {children}
    </div>
  );
}

/**
 * The contact form (docs/website-plan.md B7). It validates with the same rules as the Worker
 * (`src/lib/contact-validation.ts`), gets a Turnstile token, and posts JSON to `/api/contact` (worker/contact.ts).
 * Only a real success moves on to /contact/thanks, with the first name passed through sessionStorage, never the URL.
 * Every failure keeps the visitor's answers. No `action`, and `method="post"`, so without JavaScript nothing is sent
 * and nothing lands in the URL.
 */
function Form({ urlTopic }: { urlTopic: string | null }) {
  const topic = topicFromUrl(urlTopic);
  const router = useRouter();
  const [need, setNeed] = useState<Need | null>(topic === "" ? null : topic);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<SendError | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const {
    containerRef: turnstileRef,
    start: startTurnstile,
    getToken,
    reset: resetTurnstile,
    isConfigError: turnstileConfigError,
  } = useTurnstile(providers.turnstileSiteKey);

  const key = need === "website" || need === "system" ? need : "other";
  const e = noteForm.errors;

  function showFieldErrors(fields: ContactField[]) {
    const next: Errors = {};
    for (const field of fields) next[field] = e[field];
    setErrors(next);
    const first = FIELD_ORDER.find((f) => next[f]);
    if (!first) return;
    const target =
      first === "need"
        ? formRef.current?.querySelector<HTMLInputElement>('input[name="need"]')
        : formRef.current?.querySelector<HTMLElement>(`#cf-${first}`);
    target?.focus();
  }

  function fail(error: SendError) {
    resetTurnstile();
    setSending(false);
    setSendError(error);
  }

  async function submit(event: SyntheticEvent) {
    event.preventDefault();
    if (sending || !formRef.current) return;
    const data = new FormData(formRef.current);
    const text = (field: string) => {
      const value = data.get(field);
      return typeof value === "string" ? value : "";
    };
    const answers: ContactInput = {
      need: need ?? "",
      topic,
      name,
      email,
      message,
      business: text("business"),
      tools: text("tools"),
      website: text("website"),
      source: text("source"),
    };

    setSendError(null);
    const result = validateContact(answers);
    if (!result.ok) {
      showFieldErrors(result.fields);
      if (result.fields.length === 0) setSendError("notVerified");
      return;
    }
    setErrors({});
    // A missing site key can't verify anything, so it is an honest failure. The launch gate checks the key itself.
    if (!turnstileSiteKey(providers.turnstileSiteKey)) {
      setSendError("failed");
      return;
    }

    setSending(true);
    const token = await getToken();
    // A Turnstile setup error (for example a hostname missing from the widget) is our fault, so retrying can't help.
    if (!token) return fail(turnstileConfigError() ? "failed" : "notVerified");

    let response: Response;
    try {
      response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...answers, [honeypot.name]: text(honeypot.name), turnstileToken: token }),
      });
    } catch {
      return fail("failed");
    }
    const body = (await response.json().catch(() => null)) as { ok?: boolean; autoReply?: boolean; error?: string; fields?: unknown } | null;

    if (response.ok && body?.ok === true) {
      saveHandoff(firstName(result.value.name), body.autoReply !== false);
      router.push("/contact/thanks");
      return;
    }
    if (response.status === 400 && body?.error === "invalid" && Array.isArray(body.fields)) {
      resetTurnstile();
      setSending(false);
      showFieldErrors(body.fields.filter((f): f is ContactField => FIELD_ORDER.includes(f as ContactField)));
      return;
    }
    if (response.status === 429) return fail("rateLimited");
    if (body?.error === "rejected") return fail("notVerified");
    return fail("failed");
  }

  const invalid = (f: ContactField) => (errors[f] ? ("true" as const) : undefined);
  const described = (f: ContactField, extra?: string) => [extra, errors[f] ? `cf-${f}-error` : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <div className="rounded-panel bg-white p-6 shadow-card md:p-9">
      <h2 className="font-ui text-head font-bold leading-tight tracking-head">
        {noteForm.heading}
      </h2>

      <form ref={formRef} method="post" noValidate onSubmit={submit} onFocus={startTurnstile} className="mt-6 space-y-6">
        <input type="hidden" name="topic" value={topic} />

        <fieldset role="radiogroup" aria-required="true" aria-describedby={described("need")}>
          <legend className={label}>{noteForm.needLegend}</legend>
          <div className="mt-3 flex flex-wrap gap-2.5">
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
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border px-4.5 font-ui text-chip font-medium peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-rust ${
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

        <Labeled id="cf-name" text={noteForm.name.label}>
          <input
            id="cf-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-required="true"
            maxLength={fieldLimits.name}
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
            maxLength={fieldLimits.email}
            aria-invalid={invalid("email")}
            aria-describedby={described("email")}
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className={input}
          />
          <ErrorLine id="cf-email-error" message={errors.email} />
        </Labeled>

        <Labeled id="cf-business" text={noteForm.business.label}>
          <input id="cf-business" name="business" type="text" autoComplete="organization" maxLength={fieldLimits.business} className={input} />
        </Labeled>

        <Labeled id="cf-message" text={noteForm.message.label}>
          <textarea
            id="cf-message"
            name="message"
            rows={5}
            required
            aria-required="true"
            maxLength={fieldLimits.message}
            aria-invalid={invalid("message")}
            aria-describedby={described("message", "cf-privacy")}
            placeholder={noteForm.message.placeholders[key]}
            value={message}
            onChange={(ev) => setMessage(ev.target.value)}
            className={`${control} min-h-35 py-3`}
          />
          <p id="cf-privacy" className="mt-2 text-small text-ink-2">
            {noteForm.privacyNote}
          </p>
          <ErrorLine id="cf-message-error" message={errors.message} />
        </Labeled>

        <Labeled id="cf-tools" text={noteForm.tools.label}>
          <input id="cf-tools" name="tools" type="text" maxLength={fieldLimits.tools} placeholder={noteForm.tools.placeholders[key]} className={input} />
        </Labeled>

        <Labeled id="cf-site" text={noteForm.website.label}>
          <input id="cf-site" name="website" type="url" autoComplete="url" maxLength={fieldLimits.website} className={input} />
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

        {/* Spam trap: hidden from people and screen readers, out of the tab order. A filled value is refused. */}
        <div aria-hidden="true" className="sr-only">
          <label htmlFor="cf-fax">{noteForm.honeypotLabel}</label>
          <input id="cf-fax" name={honeypot.name} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        <div>
          {/* Turnstile draws here only if Cloudflare needs the visitor to click. */}
          <div ref={turnstileRef}className="not-empty:mb-4" />
          <button
            type="submit"
            aria-disabled={sending ? "true" : undefined}
            aria-busy={sending ? "true" : undefined}
            className="inline-flex min-h-13.5 w-full items-center justify-center rounded-btn bg-ink px-6 font-ui text-btn font-semibold text-silver aria-disabled:cursor-wait aria-disabled:opacity-70 md:w-auto md:justify-start md:pl-5.5"
          >
            {noteForm.submitLabel}
          </button>
        </div>

        <div role="status">
          {sendError ? (
            <p className="text-label text-rust">
              <Text>{noteForm.sendErrors[sendError]}</Text>
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
