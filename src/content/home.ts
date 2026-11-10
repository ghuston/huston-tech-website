import type { DetailedStepContent, StepZeroContent } from "@/components/ui/ProcessSteps";
import { fw } from "@/lib/framework";
import type { HeroOptionId } from "./site";

export type ProofStripContent = {
  stats: { value: string; label: string }[];
  footnote: string;
};

export const homeMeta = {
  title: "Huston Tech | Business Systems & Workflow Help for Small Teams",
  description:
    "Huston Tech helps owner-led service businesses fix follow-up, payments, reporting and messy software, starting with the tools you already use. Book a free 20-minute call.",
};

export type HeroOption = { titleStart: string; titleHighlight: string; body: string };

/** The four hero options from the spec (B1). `siteConfig.heroOption` picks one; A is the recommended default. */
export const heroOptions: Record<HeroOptionId, HeroOption> = {
  A: {
    titleStart: "Find the friction.",
    titleHighlight: "Make the fix.",
    body: "Huston Tech is hands-on systems help for owner-led teams. I find what's slowing your week down, fix it in the tools you already pay for, and hand it over so it's off your plate.",
  },
  B: {
    titleStart: "Your business grew.",
    titleHighlight: "Your systems didn't get the memo.",
    body: "I find the friction in your week, fix it in the tools you already pay for, and flick it off your plate: tested, documented, and your team trained.",
  },
  C: {
    titleStart: "Less friction.",
    titleHighlight: "More business.",
    body: "Hands-on systems help for owner-led teams. I find what's slowing you down, fix it in the tools you already use, and hand it over for good.",
  },
  D: {
    titleStart: fw("{find}. {fix}."),
    titleHighlight: fw("{flick}."),
    body: "The friction in your week: found, fixed in the tools you already use, and flicked off your plate.",
  },
};

export const hero = {
  eyebrow: "Business systems for growing small teams",
  secondaryCta: { label: "See what I've built →", href: "/past-work" },
  smallLine: "Hands-on help from Grant Huston · [[Based in Orange County, CA]] · Working with teams anywhere",
};

export const frameworkCompact = {
  srHeading: fw("How it works: {stepsList}"),
};

export const reviewBar = {
  default: {
    lead: "Start with a Workflow Review.",
    body: "Written findings and a prioritized plan for one process, at a fixed fee agreed up front, credited in full toward the fix.",
    link: { label: "How it works ↓", href: "#how-it-works" },
  },
  priced: {
    lead: "Workflow Review: {price}, fixed.",
    body: "Written findings and a prioritized plan, with the full {price} credited toward the fix.",
    link: { label: "Book a free call →" },
  },
};

export const problems = {
  eyebrow: "Sound familiar?",
  heading: "Your business grew. Your systems didn't get the memo.",
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
  eyebrow: fw("{steps}"),
  heading: "What you get at each step",
  stepZero: {
    body: "Every project runs the same three steps, and nothing starts until you've seen the scope and the price. It all begins with a free 20-minute call: tell me what's bugging you and what you use today, and I'll tell you honestly whether I can help.",
  } satisfies StepZeroContent,
  steps: [
    {
      key: "find",
      subtitle: "the Workflow Review",
      paragraphs: [
        "I dig into one process: what's happening, why, and what your current tools can already do about it. Then I rank what's worth fixing.",
      ],
      list: {
        label: "You get",
        items: ["Written findings", "A prioritized plan", "A scoped quote for the fix, if one is worth building"],
      },
      afterList: "It's a fixed fee agreed up front, and the report is yours to keep.",
      callout: {
        lead: "You can stop here.",
        body: "Take the plan and run with it yourself, or put it on the shelf for later. If the honest answer is \"you don't need a build,\" that's still a win.",
      },
    },
    {
      key: "fix",
      subtitle: "a clearly scoped project",
      paragraphs: [
        "I build the change, usually in the tools you already pay for, and test it with safe sample data against acceptance tests we agreed on before I started.",
      ],
      list: {
        label: "You get",
        items: [
          "A written scope and acceptance tests up front",
          "The build, tested",
          "The Review fee credited toward the project",
        ],
      },
    },
    {
      key: "flick",
      subtitle: "the handoff",
      paragraphs: [
        "Switched on, handed over, off your plate. I train the people who'll use it, document how it works, and make sure someone on your side owns it.",
      ],
      list: {
        label: "You get",
        items: ["Team training", "Documentation", "A 14-day correction window", "Full ownership of your accounts, data and logins"],
      },
      proof: "All three client wrap-up surveys so far rated handoff and training 5/5.",
    },
  ] satisfies DetailedStepContent[],
  after: "No rip-and-replace. No 40-slide strategy deck. Just one useful improvement at a time.",
  support: {
    lead: "Want me to keep an eye on things after handoff?",
    link: { label: "Ongoing support is available", href: "/services#systems" },
  },
};

export const whyHustonTech = {
  heading: "Why owners work with me",
  items: [
    {
      title: "I start with what you have.",
      body: "New software isn't always the answer. Often the fix is a setting, a process or a connection between tools you already pay for.",
    },
    {
      title: "You work with me.",
      body: "Not an account manager, not a rotating junior team. The person on your call is the person doing the work.",
    },
    {
      title: "You always know what you're paying for.",
      body: "Fixed fees, agreed in writing before work starts. No hourly meter running in the background.",
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
