// The forms a page can show: the registry's form files parsed with the site's caps, plus the showcase example. Import-free
// of Next, so node:test loads it.
import { siteConfig } from "../../site.config.ts";
import { formFiles } from "../forms/registry.generated.ts";
import { CONTACT_FORM_ID, SHOWCASE_FORM_ID } from "../forms/schema.ts";
import type { FormDefinition, PublicForm } from "../forms/schema.ts";
import { showcaseForm } from "../forms/showcase.ts";
import { parseForm, publicForm } from "../forms/validate.ts";

/** Every registered form file that parses, in the registry's order (archived ones included; check `definition.status`). */
export function loadForms(): { id: string; definition: FormDefinition }[] {
  return formFiles.flatMap(({ id, data }) => {
    const definition = parseForm(data, siteConfig.forms, id);
    return definition === null ? [] : [{ id, definition }];
  });
}

/** A live form by id, or null (unknown, archived or unreadable). The showcase example is code, so it is answered here too. */
export function formById(id: string): FormDefinition | null {
  if (id === SHOWCASE_FORM_ID) return showcaseForm;
  if (id === CONTACT_FORM_ID) return null;
  const found = loadForms().find((form) => form.id === id);
  return found !== undefined && found.definition.status === "live" ? found.definition : null;
}

/** Exactly what the browser gets for a form: the public form, never the download link. */
export function viewProps(id: string, definition: FormDefinition): { id: string; form: PublicForm } {
  return { id, form: publicForm(definition) };
}
