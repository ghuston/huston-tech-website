import contactWorker from "./contact.ts";
import type { ContactEnv } from "./env.ts";
import formsWorker, { FORMS_ROUTE_PREFIX } from "./forms.ts";

/**
 * Every /api/* request. Only /api/forms/<id> goes to the forms route (worker/forms.ts); every other /api path, the contact
 * form's /api/contact included, is answered by the contact Worker exactly as before. Kept out of worker/index.ts (which
 * imports the OAuth library and cannot load in Node) so a test can cover the dispatch.
 */
export function handleApi(request: Request, env: ContactEnv): Promise<Response> {
  const { pathname } = new URL(request.url);
  return pathname.startsWith(FORMS_ROUTE_PREFIX) ? formsWorker.fetch(request, env) : contactWorker.fetch(request, env);
}
