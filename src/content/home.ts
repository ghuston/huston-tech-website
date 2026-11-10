import type { ProcessStep } from "@/components/ui/ProcessSteps";

export type ProofStripContent = {
  stats: { value: string; label: string }[];
  footnote: string;
};

export const homeMeta = {
  title: "Huston Tech | Business Systems & Workflow Help for Small Teams",
  description:
    "Huston Tech helps owner-led service businesses fix follow-up, payments, reporting and messy software, starting with the tools you already use. Book a free 20-minute call.",
};

export const hero = {
  eyebrow: "Business systems for growing small teams",
  titleStart: "Your business grew.",
  titleHighlight: "Your systems didn't get the memo.",
  body: "Huston Tech helps owner-led teams fix the dropped handoffs, double-entry and half-set-up software that eat up your week, starting with the tools you already pay for.",
  secondaryCta: { label: "See what I've built →", href: "/past-work" },
  smallLine: "Hands-on help from Grant Huston · [[Based in Orange County, CA]] · Working with teams anywhere",
};

export const problems = {
  heading: "Sound familiar?",
  notes: [
    {
      title: "A new client inquiry came in Friday. Nobody saw it until Tuesday.",
      body: "New business slips through the cracks between your website, inbox and calendar.",
    },
    {
      title: "Payroll means a weekend with three spreadsheets and a calculator.",
      body: "Staff pay depends on rules nobody wants to calculate by hand twice a month.",
    },
    {
      title: "The payment failed. Nobody knows who's supposed to chase it.",
      body: "Exceptions sit in a report until they become a problem.",
    },
    {
      title: "We pay for a CRM. We use it as a very expensive address book.",
      body: "The setup was never finished, or it was finished for a business you no longer are.",
    },
    {
      title: "Every number I need lives in a different app.",
      body: "You make big decisions on gut feel because pulling the real numbers takes too long.",
    },
    {
      title: "Everything works… as long as I'm the one doing it.",
      body: "You hired a team, but the processes still live in your head.",
    },
  ],
  after: "If you nodded at two or more of these, we should talk.",
};

export const whatIDo = {
  heading: "Practical fixes for the stuff that slows you down",
  intro:
    "I'm a business systems consultant. In plain English, I make your software, data and day-to-day processes work together so your team spends less time chasing and more time doing the work you're actually in business for.",
  items: [
    {
      title: "Follow-up that doesn't fall through the cracks",
      body: "Every inquiry gets an owner, a fast and useful reply, and a clear path to a first appointment.",
    },
    {
      title: "Numbers you can actually see",
      body: "Owner dashboards and reports for revenue, retention, staff performance and pay, pulled together from the tools you already use.",
    },
    {
      title: "Payments and staff pay without the spreadsheet weekend",
      body: "Failed payments get flagged and owned. Pay calculations follow your rules, every time.",
    },
    {
      title: "Software that finally pulls its weight",
      body: "CRM setup and cleanup, automations, integrations, and custom tools when off-the-shelf doesn't fit.",
    },
  ],
  cta: { label: "Explore services →", href: "/services" },
  zoho: {
    lead: "Already on Zoho?",
    body: "It's one of my deepest specialties. I fix underused and messy Zoho setups without starting over.",
    link: { label: "See how →", href: "/services#zoho" },
  },
};

export const proof = {
  heading: "Real projects. Real owners. Their words, not mine.",
  teasers: [
    {
      name: "Hideout Fitness",
      body: "An owner dashboard that tracks retention, revenue and profit by coach and client, fed by a nightly sync from the studio's existing scheduling app.",
      href: "/past-work#hideout-fitness",
    },
    {
      name: "Irvine Family Counseling",
      body: "A staff app, payroll submissions, an inquiry pipeline and performance dashboards for a 10-practitioner practice that had outgrown doing everything by hand.",
      href: "/past-work#irvine-family-counseling",
    },
  ],
  teaserLinkLabel: "Read the project →",
};

export const proofStrip: ProofStripContent = {
  stats: [
    { value: "3 of 3", label: "clients said we met the goals set at kickoff" },
    { value: "5/5", label: "on communication" },
    { value: "5/5", label: "on handoff & training" },
  ],
  footnote:
    "From client wrap-up surveys, 2024–2025. Three projects, three perfect scores. A small sample, I know. I'm working on making it bigger.",
};

export const howItWorks = {
  heading: "How working together works",
  intro: "Small, clearly scoped steps. You always know what you're getting before you pay for it.",
  steps: [
    {
      title: "A quick, free call (20 minutes)",
      body: "Tell me what's bugging you and what you use today. I'll tell you honestly whether I can help, and what a sensible next step looks like.",
    },
    {
      title: "A focused Workflow Review",
      body: "For a fixed fee agreed up front, I dig into one process: what's happening, why, and what your current tools can already do about it. You get a clear report with prioritized recommendations. It's yours to keep, whether or not you hire me for the fix.",
    },
    {
      title: "The fix, built and handed over",
      body: "If there's a worthwhile fix, I'll quote it as a clearly scoped project. I build it, test it, document it and train your team. The Review fee is credited toward the project.",
    },
  ] satisfies ProcessStep[],
  after: "No rip-and-replace. No 40-slide strategy deck. Just one useful improvement at a time.",
};

export const whyHustonTech = {
  heading: "Why owners work with me",
  items: [
    {
      title: "I start with what you have.",
      body: "New software isn't always the answer. Often the fix is a setting, a process or a connection between tools you already pay for.",
    },
    {
      title: "I diagnose before I build.",
      body: "I'd rather spend an hour understanding the problem than a month building the wrong thing. And if the honest answer is \"you don't need a new system,\" I'll tell you. That's still a win.",
    },
    {
      title: "You work with me.",
      body: "Not an account manager, not a rotating junior team. The person on your call is the person doing the work.",
    },
    {
      title: "It's built to be handed off.",
      body: "Training, documentation and a clear owner on your side, so the fix keeps working after I've moved on.",
    },
  ],
};

export const aboutTeaser = {
  heading: "Hi, I'm Grant.",
  body: "I've been building business systems for small teams since 2024. The first was a group therapy practice that had outgrown doing everything by hand. Before starting Huston Tech, I led delivery for 21 client accounts at a Zoho consulting partner, in industries from healthcare to wholesale to local government. I love the moment a messy process finally clicks.",
  link: { label: "More about me →", href: "/about" },
  photoLabel: "[[PHOTO: headshot of Grant. Grant to supply]]",
};

export const insightsTeaser = {
  heading: "Useful stuff, no fluff",
  body: "Practical articles on systems, follow-up, reporting and running a growing team.",
  link: { label: "Read Insights →", href: "/insights" },
  comingSoon: "The first articles are on the way.",
};

export const closingCta = {
  heading: "Let's find the thing that's slowing you down.",
  body: "Twenty minutes, no pitch deck, no pressure. You'll leave with at least one useful idea, even if we never work together.",
  secondary: { label: "send a quick note →", href: "/contact" },
  microcopy:
    "Not in health & wellness? I work with all kinds of small businesses. If it involves messy processes and software, I'm interested.",
};
