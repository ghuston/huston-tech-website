import { fw } from "../lib/framework.ts";
import { honeypot, needOptions, sourceOptions } from "./contact-fields.ts";

/** Copy: docs/website-rev8.md B7 (amends Revision 7.1 B7, B7b and B8). The contact page's own words are in src/content/pages/contact.json; field options and limits live in `contact-fields.ts`. */

export const noteForm = {
  heading: "Or send a quick note",
  needLegend: "What do you need?",
  needOptions,
  name: { label: "Your name" },
  email: { label: "Best email" },
  business: { label: "Business name (optional)" },
  message: {
    label: "What's going on?",
    placeholders: {
      website: "e.g. A site for my business with a services page and a booking form.",
      system: "e.g. Follow-up lives in my head, and my call notes never get written down.",
      other: "e.g. Our site is old, and inquiries from it get lost.",
    },
  },
  tools: {
    label: "What do you use today?",
    placeholders: {
      website: "e.g. A Facebook page, an old site, or nothing yet.",
      system: "e.g. A spreadsheet, a CRM I stopped opening, or nothing yet.",
      other: "e.g. A Facebook page, an old site, or nothing yet.",
    },
  },
  website: { label: "Current website (optional)" },
  source: {
    label: "How did you hear about Huston Logic?",
    /** Interface string, not in Section B; flagged for Grant's OK. */
    empty: "Choose one",
    options: sourceOptions,
  },
  honeypotLabel: honeypot.label,
  privacyNote:
    "Please don't include client or patient details, account numbers or passwords. Anything sensitive gets handled the right way, later.",
  submitLabel: "Send it over →",
  errors: {
    need: "Pick the closest one. 'Not sure' counts.",
    name: "Please add your name.",
    email: "That email doesn't look quite right.",
    message: "A sentence or two is plenty, but I do need something to go on.",
  },
  /** Shown when sending fails (B7, Grant, Nov 15). The form keeps the visitor's answers. */
  sendErrors: {
    notVerified: "That didn't go through. Please try again.",
    rateLimited: "That's a few tries in a row. Give it a minute and try again.",
    failed: "Something broke on my end and your note didn't send. Your answers are still here, or email grant@hustonlogic.com.",
  },
};

export const thanks = {
  title: "Contact confirmation | Huston Logic",
  description: "Confirmation page shown after a contact form submission.",
  heading: "Got it, thanks.",
  /** B7b, with the first name the form saved in sessionStorage. */
  headingWithName: "Got it, thanks {firstName}.",
  body: "That's step zero started. Your automatic reply is on its way (check spam the first time), and I'll write back myself within one business day. Want to skip the back-and-forth?",
  /** B7b (Grant, Nov 15): replaces the auto-reply sentence when the automatic reply failed to send. */
  bodyAutoReplyFailed: "That's step zero started. Your note reached me. The automatic reply didn't send, so don't wait for it. Want to skip the back-and-forth?",
  pickTimeLabel: "Pick a time now →",
  after: { lead: "Curious what happens after the call?", label: fw("{steps} →"), href: "/how-i-work" },
  meanwhile: {
    lead: "While you wait:",
    links: [
      { label: "What's included in a website →", href: "/services#websites" },
      { label: "See the system →", href: "/systems" },
    ],
  },
};

export const notFound = {
  title: "Page not found | Huston Logic",
  heading: "Huston, we have a problem.",
  body: "This page doesn't exist, or it moved without telling anyone. (Ironic, I know.)",
  homeLabel: "Back to home →",
  callLabel: "Book a free call →",
};
