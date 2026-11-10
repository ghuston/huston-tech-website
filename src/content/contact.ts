import { fw } from "@/lib/framework";

export const contactMeta = {
  title: "Contact | Book a Free 20-Minute Call | Huston Tech",
  description:
    "Tell Grant what's slowing your business down. Book a free 20-minute call or send a quick note. Replies within one business day.",
};

export const contactHero = {
  eyebrow: "Huston, we have a problem.",
  title: "Good. Tell me about it.",
  intro: "Two easy ways to start. Both are free, and neither comes with a 12-email follow-up sequence.",
};

export const scheduler = {
  heading: "Book a 20-minute call",
  body: "Pick a time that works. We'll talk about one problem, the tools you use and whether there's a sensible next step.",
  buttonLabel: "Pick a time",
  placeholder: "[[SCHEDULER: embed or booking link goes here once a provider is chosen]]",
};

export const noteForm = {
  heading: "Or send a quick note",
  partnerHeading: "Zoho partner? Tell me about the work and your timeline.",
  placeholder: "[[CONTACT FORM: not connected. Fields are disabled until a form provider is chosen]]",
  fields: {
    name: { label: "Your name", placeholder: "" },
    email: { label: "Best email", placeholder: "" },
    business: { label: "Business name", placeholder: "" },
    message: {
      label: "What's going on?",
      placeholder: "e.g. New inquiries come in from three places and nobody's sure who follows up.",
    },
    tools: {
      label: "What tools do you use today?",
      placeholder: "e.g. SimplePractice, QuickBooks, Google Sheets, Zoho… or 'not sure'",
    },
    website: { label: "Website (optional)", placeholder: "" },
    source: {
      label: "How did you hear about Huston Tech?",
      options: ["Referral", "Google", "LinkedIn", "Article", "Other"],
    },
  },
  optionalSuffix: "(optional)",
  privacyNote:
    "Please don't include client or patient details, account numbers or passwords. Anything sensitive gets handled the right way, later.",
  submitLabel: "Send it over",
  /** Kept for the day a form provider is wired up. */
  validationMessages: {
    name: "Please add your name.",
    email: "That email doesn't look quite right.",
    message: "A sentence or two is plenty, but I do need something to go on.",
  },
};

export const whatHappensNext = {
  heading: "What happens next",
  steps: [
    { title: "I read it myself", body: "and reply within one business day (Monday to Friday)." },
    { title: "Step zero: a free 20-minute call", body: "about one problem and the tools involved." },
    {
      title: "If there's a fit,",
      body: fw("I'll send a short written scope for step one, {find} (your Workflow Review). If not, I'll point you somewhere useful."),
    },
  ],
  emailLabel: "Prefer email?",
};

export const thanks = {
  title: "Contact confirmation | Huston Tech",
  description: "Confirmation page shown after a contact form submission.",
  heading: "Got it, thanks!",
  body: "That's step zero started. I'll reply within one business day. Want to skip the back-and-forth?",
  pickTimeLabel: "Pick a time now",
  afterCall: {
    lead: "Curious what happens after the call?",
    link: { label: fw("{steps} →"), href: "/#how-it-works" },
  },
  next: "In the meantime:",
  nextLink: { label: "See what I've built →", href: "/past-work" },
};

export const notFound = {
  title: "Page not found | Huston Tech",
  heading: "Huston, we have a problem.",
  body: "This page doesn't exist, or it moved without telling anyone. (Ironic, I know.)",
  homeLabel: "Back to home",
};
