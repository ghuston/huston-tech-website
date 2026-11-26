// The example form of the block showcase (/blocks). Code, never a file, never in the registry: the Worker has no
// endpoint for it, so submitting it there shows the ordinary "failed" message. Import-free apart from siblings.
import { SHOWCASE_FORM_ID } from "./schema.ts";
import type { FormDefinition } from "./schema.ts";

export { SHOWCASE_FORM_ID };

/** A short enquiry form with every field type. Live, no download. */
export const showcaseForm: FormDefinition = {
  name: "Enquiry",
  status: "live",
  fields: [
    { id: "name", type: "short-text", label: "Your name", required: true, max: 100, purpose: "name" },
    { id: "email", type: "email", label: "Email", required: true, max: 254 },
    { id: "phone", type: "phone", label: "Phone", required: false, max: 30, help: "Only if you would like a call back." },
    { id: "interest", type: "dropdown", label: "What are you interested in?", required: true, options: ["A website", "Something else"], display: "buttons" },
    { id: "message", type: "long-text", label: "Tell me a little more", required: true, max: 1000 },
    { id: "copy", type: "checkbox", label: "I have worked with you before.", required: false },
    { id: "updates", type: "consent", label: "You can email me now and then with news.", required: false },
  ],
  button: "Send my enquiry",
  thanks: "Thanks. I'll reply within two working days.",
};
