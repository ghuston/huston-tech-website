"use client";

import { useEffect, useId, useRef, useState, type SyntheticEvent } from "react";
import { Text } from "@/components/ui/Text";
import { honeypot } from "@/content/contact-fields";
import { formWords } from "@/content/forms";
import { providers } from "@/content/providers";
import type { FormField, PublicForm } from "@/forms/schema";
import { validateSubmission } from "@/forms/submission";
import { errorFor, FieldView, Honeypot, labelFor, NoScriptNote, SubmitButton, type FieldIds } from "./form/controls";
import { turnstileSiteKey, useTurnstile } from "./useTurnstile";

type SendError = keyof typeof formWords.sendErrors;
type Errors = Record<string, string>;

/**
 * Any form but the contact form (docs/superpowers/specs/2026-11-25-forms-and-downloads-design.md, "The form block").
 * It receives only what it draws: the public form (never the download link) and the site's email for the no-JavaScript
 * note. It validates with the Worker's own rules, gets a Turnstile token (action `form`, loaded on first focus) and
 * posts JSON to `/api/forms/<id>`. A real success replaces the panel with the thank-you message, in the panel's own
 * height, and moves focus to it. No `action`, and `method="post"`, so without JavaScript nothing is sent.
 */
export function FormView({ id, form, noScriptEmail }: { id: string; form: PublicForm; noScriptEmail: string | null }) {
  const prefix = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [chips, setChips] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<SendError | null>(null);
  const [done, setDone] = useState<{ delivered: boolean } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const thanksRef = useRef<HTMLDivElement>(null);
  const {
    containerRef: turnstileRef,
    start: startTurnstile,
    getToken,
    reset: resetTurnstile,
    isConfigError: turnstileConfigError,
  } = useTurnstile(providers.turnstileSiteKey, "form");

  useEffect(() => {
    if (done) thanksRef.current?.focus();
  }, [done]);

  const idsFor = (field: FormField): FieldIds => ({ input: `${prefix}-${field.id}`, help: `${prefix}-${field.id}-help`, error: `${prefix}-${field.id}-error` });

  function showFieldErrors(fields: string[]) {
    const next: Errors = {};
    for (const field of form.fields) if (fields.includes(field.id)) next[field.id] = errorFor(field);
    setErrors(next);
    const first = form.fields.find((field) => next[field.id]);
    if (!first) return;
    const target =
      first.type === "dropdown" && first.display === "buttons"
        ? formRef.current?.querySelector<HTMLInputElement>(`input[name="${first.id}"]`)
        : document.getElementById(idsFor(first).input);
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
    const answers: Record<string, string | boolean> = {};
    for (const field of form.fields) {
      if (field.type === "checkbox" || field.type === "consent") answers[field.id] = data.get(field.id) !== null;
      else {
        const value = data.get(field.id);
        answers[field.id] = typeof value === "string" ? value : "";
      }
    }
    const trap = data.get(honeypot.name);

    setSendError(null);
    const result = validateSubmission(form, answers);
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
      response = await fetch(`/api/forms/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...answers, [honeypot.name]: typeof trap === "string" ? trap : "", turnstileToken: token }),
      });
    } catch {
      return fail("failed");
    }
    const body = (await response.json().catch(() => null)) as { ok?: boolean; delivered?: boolean; error?: string; fields?: unknown } | null;

    if (response.ok && body?.ok === true) {
      // Keep the panel's height so the page below does not jump when the form is replaced.
      const panel = panelRef.current;
      if (panel) panel.style.minHeight = `${panel.offsetHeight}px`;
      setDone({ delivered: body.delivered !== false });
      return;
    }
    if (response.status === 400 && body?.error === "invalid" && Array.isArray(body.fields)) {
      resetTurnstile();
      setSending(false);
      showFieldErrors(body.fields.filter((f): f is string => typeof f === "string"));
      return;
    }
    if (response.status === 429) return fail("rateLimited");
    if (body?.error === "rejected") return fail("notVerified");
    return fail("failed");
  }

  return (
    <div ref={panelRef} className="rounded-panel bg-white p-6 shadow-card md:p-9">
      {done ? (
        <div ref={thanksRef} tabIndex={-1} className="font-text text-body text-ink">
          <p>
            <Text>{form.thanks}</Text>
          </p>
          {form.delivers && !done.delivered ? <p className="mt-4 text-label text-rust">{formWords.downloadNotSent}</p> : null}
        </div>
      ) : (
        <form ref={formRef} method="post" noValidate onSubmit={submit} onFocus={startTurnstile} className="space-y-6">
          {form.fields.map((field) => {
            const choices = (field.options ?? []).map((option) => ({ value: option, label: option }));
            return (
              <FieldView
                key={field.id}
                field={field}
                ids={idsFor(field)}
                label={labelFor(field, true)}
                error={errors[field.id]}
                rich
                emptyChoice={formWords.selectEmpty}
                chips={
                  field.display === "buttons"
                    ? {
                        options: choices,
                        selected: chips[field.id] ?? "",
                        onSelect: (value) => {
                          setChips((previous) => ({ ...previous, [field.id]: value }));
                          setErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => key !== field.id)));
                        },
                      }
                    : undefined
                }
              />
            );
          })}

          <Honeypot id={`${prefix}-fax`} />

          <div>
            {/* Turnstile draws here only if Cloudflare needs the visitor to click. */}
            <div ref={turnstileRef} className="not-empty:mb-4" />
            <SubmitButton label={form.button} sending={sending} />
            <NoScriptNote email={noScriptEmail} />
          </div>

          <div role="status">
            {sendError ? <p className="text-label text-rust">{formWords.sendErrors[sendError]}</p> : null}
          </div>
        </form>
      )}
    </div>
  );
}
