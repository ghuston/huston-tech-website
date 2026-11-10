import { Suspense } from "react";
import { Text } from "@/components/ui/Text";
import { noteForm } from "@/content/contact";
import { PartnerAwareHeading } from "./PartnerAwareHeading";

const inputClasses =
  "mt-1.5 block min-h-12 w-full rounded-[10px] border border-line bg-paper px-4 py-3 text-base text-ink placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-70";

type FieldProps = { id: string; label: string; optional?: boolean; children: React.ReactNode };

function Field({ id, label, optional, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-[0.98rem] font-semibold">
        {label}
        {optional ? <span className="font-normal text-muted"> {noteForm.optionalSuffix}</span> : null}
      </label>
      {children}
    </div>
  );
}

/**
 * Visual placeholder for the contact form. Intentionally NOT a <form>: nothing can be submitted.
 * When a provider is chosen, replace this with a real form (see AGENTS.md, "Contact and scheduling").
 */
export function ContactFormPlaceholder() {
  const f = noteForm.fields;
  return (
    <div className="rounded-[14px] border border-line bg-surface p-6 sm:p-8">
      <Suspense fallback={<h2 className="text-2xl sm:text-3xl">{noteForm.heading}</h2>}>
        <PartnerAwareHeading defaultText={noteForm.heading} partnerText={noteForm.partnerHeading} className="text-2xl sm:text-3xl" />
      </Suspense>

      <p className="mt-4 rounded-[10px] border border-dashed border-signal bg-signal-tint px-4 py-3 text-sm" role="note">
        <Text>{noteForm.placeholder}</Text>
      </p>

      <div role="group" aria-label="Contact form (not yet connected)" className="mt-6 space-y-5">
        <Field id="cf-name" label={f.name.label}>
          <input id="cf-name" type="text" disabled className={inputClasses} />
        </Field>
        <Field id="cf-email" label={f.email.label}>
          <input id="cf-email" type="email" disabled className={inputClasses} />
        </Field>
        <Field id="cf-business" label={f.business.label}>
          <input id="cf-business" type="text" disabled className={inputClasses} />
        </Field>
        <Field id="cf-message" label={f.message.label}>
          <textarea id="cf-message" rows={4} disabled placeholder={f.message.placeholder} className={inputClasses} />
          <p className="mt-2 text-sm text-muted">{noteForm.privacyNote}</p>
        </Field>
        <Field id="cf-tools" label={f.tools.label} optional>
          <input id="cf-tools" type="text" disabled placeholder={f.tools.placeholder} className={inputClasses} />
        </Field>
        <Field id="cf-website" label={f.website.label}>
          <input id="cf-website" type="url" disabled className={inputClasses} />
        </Field>
        <Field id="cf-source" label={f.source.label} optional>
          <select id="cf-source" disabled defaultValue="" className={inputClasses}>
            <option value="">Choose one</option>
            {f.source.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="button"
          disabled
          className="min-h-12 w-full cursor-not-allowed rounded-[10px] bg-line px-6 py-3 font-semibold text-muted sm:w-auto"
        >
          {noteForm.submitLabel}
        </button>
      </div>
    </div>
  );
}
