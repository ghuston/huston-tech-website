import { bookCallLabel } from "./site";

// docs/website-rev8.md, B2. Word for word. The optional opener (two old pain lines) is left out.

export const systemsMeta = {
  title: "AI Systems for Small Businesses | Huston Logic",
  description:
    "A sales follow-up system you run by talking, hosted by me. A one-time install, an optional care plan, and flat-fee hosting.",
};

export const systemsHero = {
  eyebrow: "Systems",
  title: "A system you run by talking.",
  intro:
    "Big companies are rebuilding how they work around AI. I do the same for a business your size. It starts with the part most owners carry in their heads: sales follow-up.",
  cta: `${bookCallLabel} →`,
};

export const whatItDoes = {
  heading: "What it does",
  body: "Say what happened. It keeps the notes, tells you who to follow up with today, and has a brief ready before the next call. It drafts follow-ups in your voice, and you send them.",
};

export const whatISetUp = {
  heading: "What I set up",
  steps: [
    { lead: "A design call.", rest: "We set your stages and your follow-up rules." },
    { lead: "Your own copy, hosted by me.", rest: "Your website form connected, your contacts imported from a spreadsheet." },
    { lead: "A rulebook in your voice,", rest: "and five starter rules." },
    { lead: "30 days of tuning,", rest: "then a one-page handoff." },
  ],
};

export const itsYours = {
  heading: "It's yours",
  body: "I host your copy in my own accounts. Your domain and email stay in your name, and your data stays yours: it exports in full, any time. Ask, and I hand over everything, current code included, and move it to your own accounts. After the 30 days, a care plan is optional: updates, keeping the AI connection working, and a tune-up each quarter. Cancel it and the system keeps running.",
};

export const changeIt = {
  heading: "You can change it yourself",
  before:
    "Add a rule, a stage or a field by asking. Those are settings, not code, so you can't break what's underneath. Every change is logged and can be undone. For anything bigger, ask me, and it goes through ",
  link: { label: "the same checks as the rest", href: "/#why" },
  after: ".",
};

export const whatItCosts = {
  heading: "What it costs",
  body: "A one-time install price, agreed in writing before I start, plus a flat hosting fee, paid monthly or yearly. I'll share the numbers on the call.",
};

export const comingSoon = {
  heading: "Coming very soon",
  body: "Bulk email and campaigns, texting, call recording, booking and payments. Tell me which one you need first, and it moves up the list.",
};

export const protectedRecords = {
  heading: "Handle protected records?",
  body: "Patient files and the like need extra agreements, and this system isn't set up for them yet. Talk to me first.",
};

export const elseIBuild = {
  heading: "What else I build this way",
  body: "The same approach works past sales: owner dashboards, staff tools, and connections between the software you already use. Built with AI, checked the same way, and handed over whenever you ask.",
  link: { label: "See past work →", href: "/past-work" },
};

/** B2's closing text, split so the first sentence is the heading. */
export const systemsClosing = {
  heading: "Start with the free call.",
  body: "I'll show it to you on my phone. The demo takes 90 seconds.",
  cta: `${bookCallLabel} →`,
};
