import type { ProofStripContent } from "@/components/hl/ProofChips";
import { caseStudies } from "./past-work";
import { bookCallLabel, siteConfig } from "./site";

// docs/website-rev8.md, B1 (Revision 8): every string on Home, word for word. The doors come from `offers` in site.ts.

export const homeMeta = {
  title: "Huston Logic | Personal Software and Websites for Small Businesses",
  description: siteConfig.oneLiner,
};

/** B1 section 1. */
export const heroContent = {
  eyebrow: "Hi, I'm Grant. Personal software and AI acceleration for small businesses.",
  line1: "For the parts of the job",
  line2: "you never signed up for.",
  subhead:
    "I build the systems that handle them, starting with sales follow-up you run by talking to your phone. It lives in your accounts, and it changes when you tell it to.",
  supportingLine: "AI-accelerated, checked by hand.",
  cta: `${bookCallLabel} →`,
  installLink: { label: "See what I'm installing now ↘", href: "#installing" },
};

/**
 * The hero's card stack (B1 section 1): the owner's board in front; around it the spoken note that created the
 * follow-up, the brief before the next call and a rule added by asking.
 * Stand-in: All names are invented (Dana Ortiz, R. Alvarez, Kim Lee). No real person's data is used.
 */
export const heroStack = {
  ariaLabel:
    "The owner's board in front, with a new follow-up for Dana. Around it: the spoken note that created it, a brief before the next call, and a rule added by asking.",
  board: {
    heading: "Today",
    rows: [
      { name: "Dana Ortiz", detail: "Quote, three units", status: "Due Fri", highlighted: true },
      { name: "R. Alvarez", detail: "Proposal, no reply yet", status: "Nudge", highlighted: false },
      { name: "Kim Lee", detail: "Call back", status: "Today", highlighted: false },
    ],
  },
  say: { tag: "You say, after the call", said: "Just talked to Dana. She wants a quote for three units by Friday." },
  brief: { tag: "Before your next call", name: "Dana Ortiz", time: "2:00 pm", line: "Wants three units. Quote due Friday." },
  rule: { tag: "A rule you added by asking", rule: "Nudge me three days after any proposal with no reply.", undo: "Don't like it? “Undo that.”" },
  chip: { figure: "Notes saved", label: "Follow-up set for Friday" },
};

/**
 * The follow-up app's phone screenshots (docs/website-rev8.md, Section D): seeded demo data, 390 × 844, in
 * public/work/pipeline-<key>.{avif,webp}. Home shows three; /systems shows all four.
 */
export const appScreens = {
  today: { key: "today", label: "Today", alt: "The Today screen of the follow-up app, with demo data" },
  pipeline: { key: "pipeline", label: "Pipeline", alt: "The Pipeline screen of the follow-up app, with demo data" },
  brief: { key: "brief", label: "Brief", alt: "The Brief screen of the follow-up app, with demo data" },
  rule: { key: "rule", label: "Rule preview", alt: "A rule preview in the follow-up app, with demo data" },
} as const;

/** B1 section 2. The bubbles keep the quotation marks B1 writes around them. */
export const installing = {
  eyebrow: "What I'm installing now",
  heading: "A sales follow-up system you run by talking.",
  pairs: [
    { said: "“Just talked to Dana. She wants a quote for three units by Friday.”", result: "Notes saved. Follow-up set for Friday." },
    { said: "“Who do I need to talk to today?”", result: "A short list, with what was said last time." },
    {
      said: "“From now on, nudge me three days after any proposal with no reply.”",
      result: "The rule is added, in plain English. Changed your mind? “Undo that.”",
    },
  ],
  screens: [appScreens.today, appScreens.pipeline, appScreens.brief],
  /** Approved interface string: the accessible name of the screenshots' swipe row. */
  screensLabel: "App screens, demo data",
  line: "I set it up in your own accounts and tune it for 30 days. After that it's yours, whether or not you keep me around.",
  link: { label: "See how the install works →", href: "/systems" },
};

/** Approved interface string for the door band's accessible name (docs/STYLE-GUIDE.md §7.8). */
export const doorBandLabel = "Two ways to start";

/** B1 section 4. The last stop has no line: the rust dot rests there. */
export const whyHireMe = {
  eyebrow: "Why hire me",
  line1: "Anyone can vibe-code an app these days.",
  line2: "Here's why you'd still hire me.",
  body: "You could build this yourself with AI, and the first version would probably work. The hard part is knowing it still works next month, on a slow phone, after an update nobody noticed. So nothing I build goes live until it passes the checks a big software team would run. I can't skip them either.",
  stops: [
    { title: "It builds clean.", line: "On a fresh machine, not only my laptop." },
    { title: "Everyone can use it.", line: "Every page scanned for accessibility, at phone and desktop size." },
    { title: "It's fast, and Google can read it.", line: "Audited as a mid-range phone on a slow connection." },
    { title: "The building blocks are safe.", line: "Every outside package checked against known vulnerabilities." },
    { title: "The code is safe.", line: "Scanned for the patterns attackers look for." },
    { title: "I've tried to break it.", line: "By hand, on a phone and with a keyboard." },
    { title: "Then it goes live." },
  ],
  callout: "I broke each automatic check on purpose to prove it blocks a bad change. Five tries, five blocked.",
  points: [
    { title: "You work with me.", body: "The person on the call is the person doing the work." },
    { title: "You see the price first.", body: "Fixed, and agreed in writing before I start." },
    { title: "It's yours.", body: "Your accounts and your data, with or without me." },
  ],
};

/** The first screenshot of a Past work case study, with the alt text it already has there (Section D). */
function caseImage(id: string) {
  const shot = caseStudies.find((study) => study.id === id)?.screenshots[0];
  if (!shot || typeof shot === "string") throw new Error(`No screenshot for case study ${id}`);
  return { src: shot.src.replace(/\.webp$/, ""), alt: shot.alt, width: shot.width, height: shot.height };
}

/** B1 section 5. The quotes come from testimonials.ts (placement "home"). */
export const proof = {
  heading: "What clients said afterward",
  tag: "Custom systems, 2024 to 2025",
  /** Approved interface string: the accessible name of the quotes' swipe row. */
  quotesLabel: "Client quotes",
  teasers: [
    {
      name: "Hideout Fitness",
      body: "An owner dashboard for retention, revenue and profit by coach and client.",
      href: "/past-work#hideout-fitness",
      image: caseImage("hideout-fitness"),
    },
    {
      name: "Irvine Family Counseling",
      body: "A staff app, payroll submissions and dashboards for a 10-practitioner practice.",
      href: "/past-work#irvine-family-counseling",
      image: caseImage("irvine-family-counseling"),
    },
  ],
  teaserLinkLabel: "Read the project →",
};

export const proofStrip: ProofStripContent = {
  stats: [
    { value: "3 of 3", label: "met the goals set at kickoff" },
    { value: "5/5", label: "on communication" },
    { value: "5/5", label: "on handoff & training" },
  ],
  footnote: "From client wrap-up surveys. A small sample, I know.",
};

/** B1 section 6. */
export const aboutTeaser = {
  heading: "Hi, I'm Grant.",
  body: "I've spent my career where software meets business, as an application developer, business analyst and software consultant. I started Huston Logic to bring small businesses into the AI age, one useful system at a time.",
  link: { label: "More about me →", href: "/about" },
  /** Alt text for the ring headshot (docs/STYLE-GUIDE.md §7.22). */
  photoAlt: "Grant Huston",
};

/** B1 section 7. */
export const closingCta = {
  line1: "Twenty minutes.",
  line2: "Worst case, you get one good idea.",
  body: "Tell me what keeps landing on your plate. If I'm not the right person, I'll tell you who is.",
  cta: `${bookCallLabel} →`,
  secondary: { label: "Or send a quick note →", href: "/contact" },
};
